/**
 * Service de gestion des livraisons
 * Optimisé avec algorithmes efficaces et logique conditionnelle
 */

const DeliveryService = (() => {

    // ========================================
    // Helpers privés
    // ========================================

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;

        const R = 6371; // Rayon de la Terre en km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const formatDateISO = (date) => {
        if (!(date instanceof Date) || isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
    };

    const enrichFamilyData = (familyRow) => {
        const C = SHEET_DEF.FAMILLE.COLS;
        const idQuartier = familyRow[C.ID_QUARTIER];
        const quartier = DataService.getQuartierDetails(idQuartier);

        const nombreAdulte = familyRow[C.NOMBRE_ADULTE] || 0;
        const nombreEnfant = familyRow[C.NOMBRE_ENFANT] || 0;

        return {
            id: familyRow[C.ID],
            nom: familyRow[C.NOM],
            adresse: familyRow[C.ADRESSE],
            quartier: quartier,
            nombreAdulte: nombreAdulte,
            nombreEnfant: nombreEnfant,
            nombreParts: nombreAdulte + nombreEnfant,
            needsToys: nombreEnfant > 0,
            needsHygiene: true, // Toujours vrai
            latitude: quartier?.latitude,
            longitude: quartier?.longitude,
            telephone: familyRow[C.TELEPHONE]
        };
    };

    // ========================================
    // Méthodes publiques
    // ========================================

    const assignDeliveries = (occasion, dateLivraison, maxFamiliesPerDriver = CONFIG.DEFAULT_MAX_FAMILIES_PER_DRIVER) => {
        console.log(`🚀 Début assignation: ${occasion} le ${dateLivraison}`);

        try {
            const unassignedFamilies = getUnassignedFamilies(occasion, dateLivraison);
            const availableDrivers = getAvailableDrivers(dateLivraison);

            if (unassignedFamilies.length === 0) {
                return {
                    success: true,
                    message: 'Toutes les familles sont déjà assignées',
                    assignments: []
                };
            }

            if (availableDrivers.length === 0) {
                throw new Error('Aucun livreur disponible pour cette date');
            }

            // Grouper par secteur
            const familiesBySector = groupFamiliesBySector(unassignedFamilies);
            const allAssignments = [];

            // Assigner par secteur
            for (const [secteur, families] of Object.entries(familiesBySector)) {
                const sectorDrivers = availableDrivers.filter(d => d.secteur === secteur);

                if (sectorDrivers.length === 0) {
                    console.warn(`⚠️ Aucun livreur disponible pour le secteur: ${secteur}`);
                    continue;
                }

                const routes = createOptimizedRoutes(families, sectorDrivers, maxFamiliesPerDriver);
                allAssignments.push(...routes);
            }

            // Écrire les assignations
            writeAssignments(allAssignments, occasion, dateLivraison);

            const driversCount = new Set(allAssignments.map(a => a.driverId)).size;

            return {
                success: true,
                message: `✅ ${allAssignments.length} livraisons assignées à ${driversCount} livreur(s)`,
                assignments: allAssignments
            };
        } catch (error) {
            console.error(`assignDeliveries: ${error.message}`);
            return {
                success: false,
                message: error.message,
                assignments: []
            };
        }
    };

    const getUnassignedFamilies = (occasion, dateLivraison) => {
        const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
        const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);

        const LC = SHEET_DEF.LIVRAISON.COLS;
        const FC = SHEET_DEF.FAMILLE.COLS;

        // Familles déjà assignées
        const assignedFamilyIds = new Set(
            livraisonData
                .filter(row => {
                    const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
                    return row[LC.OCCASION] === occasion &&
                        rowDate === dateLivraison &&
                        row[LC.ID_LIVREUR];
                })
                .map(row => row[LC.ID_FAMILLE])
        );

        // Familles non assignées et validées
        return familleData
            .filter(row => {
                const familleId = row[FC.ID];
                const etat = row[FC.ETAT];
                return !assignedFamilyIds.has(familleId) && etat === 'Validé';
            })
            .map(row => enrichFamilyData(row));
    };

    const getAvailableDrivers = (dateLivraison) => {
        const livreurData = getCachedSheetData(SHEET_DEF.LIVREUR.NAME);
        const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);

        const LC = SHEET_DEF.LIVRAISON.COLS;
        const LVC = SHEET_DEF.LIVREUR.COLS;

        // Compter les assignations par livreur
        const driverLoadMap = new Map();
        livraisonData.forEach(row => {
            const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
            if (rowDate === dateLivraison && row[LC.ID_LIVREUR]) {
                const count = driverLoadMap.get(row[LC.ID_LIVREUR]) || 0;
                driverLoadMap.set(row[LC.ID_LIVREUR], count + 1);
            }
        });

        return livreurData.map(row => ({
            id: row[LVC.ID],
            nom: row[LVC.NOM],
            prenom: row[LVC.PRENOM],
            secteur: row[LVC.SECTEUR],
            currentLoad: driverLoadMap.get(row[LVC.ID]) || 0
        }));
    };

    const groupFamiliesBySector = (families) => {
        const groups = {};
        families.forEach(family => {
            const secteur = family.quartier?.nom || 'Non défini';
            if (!groups[secteur]) groups[secteur] = [];
            groups[secteur].push(family);
        });
        return groups;
    };

    const createOptimizedRoutes = (families, drivers, maxPerDriver) => {
        const routes = [];
        const remainingFamilies = [...families];

        // Trier par charge actuelle (moins chargé en premier)
        drivers.sort((a, b) => a.currentLoad - b.currentLoad);

        for (const driver of drivers) {
            if (remainingFamilies.length === 0) break;

            const availableCapacity = maxPerDriver - driver.currentLoad;
            if (availableCapacity <= 0) continue;

            const assignedFamilies = remainingFamilies.splice(0, availableCapacity);
            const orderedFamilies = optimizeRouteOrder(assignedFamilies);

            orderedFamilies.forEach((family, index) => {
                routes.push({
                    driverId: driver.id,
                    familyId: family.id,
                    routeOrder: index + 1,
                    nombreParts: family.nombreParts,
                    avecEnfant: family.needsToys
                });
            });
        }

        return routes;
    };

    const optimizeRouteOrder = (families) => {
        if (families.length <= 1) return families;

        const ordered = [];
        const remaining = [...families];

        let current = remaining.shift();
        ordered.push(current);

        while (remaining.length > 0) {
            let nearestIndex = 0;
            let minDistance = Infinity;

            remaining.forEach((family, index) => {
                const distance = calculateDistance(
                    current.latitude, current.longitude,
                    family.latitude, family.longitude
                );

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });

            current = remaining.splice(nearestIndex, 1)[0];
            ordered.push(current);
        }

        return ordered;
    };

    const writeAssignments = (assignments, occasion, dateLivraison) => {
        if (assignments.length === 0) return;

        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(SHEET_DEF.LIVRAISON.NAME);

        const data = assignments.map(assignment => [
            assignment.familyId,
            new Date(dateLivraison),
            occasion,
            assignment.driverId,
            null, // ID_BINOME
            assignment.nombreParts,
            assignment.avecEnfant,
            false, // PRETE
            false, // EN_COURS
            false, // LIVRE
            null, // NOTE
            `Route ${assignment.routeOrder}` // COMMENTAIRE
        ]);

        const lastRow = sheet.getLastRow();
        sheet.getRange(lastRow + 1, 1, data.length, data[0].length).setValues(data);

        invalidateCache(SHEET_DEF.LIVRAISON.NAME);
        console.log(`✅ ${data.length} assignations écrites`);
    };

    const calculateInventoryNeeds = (occasion, dateLivraison) => {
        const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
        const LC = SHEET_DEF.LIVRAISON.COLS;

        let totalParts = 0;
        let totalToys = 0;
        let totalHygiene = 0;
        let totalFamilies = 0;

        livraisonData.forEach(row => {
            const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
            if (row[LC.OCCASION] === occasion && rowDate === dateLivraison) {
                totalFamilies++;
                totalParts += row[LC.NOMBRE_PART] || 0;
                if (row[LC.AVEC_ENFANT]) totalToys++;
                totalHygiene++; // Un kit par famille
            }
        });

        return {
            totalFamilies,
            totalParts,
            totalToyKits: totalToys,
            totalHygieneKits: totalHygiene
        };
    };

    const batchUpdateStatus = (updates) => {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = ss.getSheetByName(SHEET_DEF.LIVRAISON.NAME);
        const data = sheet.getDataRange().getValues();

        const LC = SHEET_DEF.LIVRAISON.COLS;
        const cellUpdates = [];

        updates.forEach(update => {
            const rowIndex = data.findIndex((row, idx) => {
                if (idx === 0) return false;
                const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
                return row[LC.ID_FAMILLE] === update.familleId &&
                    row[LC.OCCASION] === update.occasion &&
                    rowDate === update.date;
            });

            if (rowIndex > 0) {
                if (update.prete !== undefined) {
                    cellUpdates.push({
                        row: rowIndex + 1,
                        col: LC.PRETE + 1,
                        value: update.prete
                    });
                }
                if (update.enCours !== undefined) {
                    cellUpdates.push({
                        row: rowIndex + 1,
                        col: LC.EN_COURS + 1,
                        value: update.enCours
                    });
                }
                if (update.livre !== undefined) {
                    cellUpdates.push({
                        row: rowIndex + 1,
                        col: LC.LIVRE + 1,
                        value: update.livre
                    });
                }
            }
        });

        // Appliquer les mises à jour
        cellUpdates.forEach(update => {
            sheet.getRange(update.row, update.col).setValue(update.value);
        });

        invalidateCache(SHEET_DEF.LIVRAISON.NAME);
        return cellUpdates.length;
    };

    // Interface publique
    return {
        assignDeliveries,
        getUnassignedFamilies,
        getAvailableDrivers,
        calculateInventoryNeeds,
        batchUpdateStatus,
        optimizeRouteOrder
    };
})();