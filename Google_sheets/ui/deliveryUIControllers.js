/**
 * Contrôleurs pour l'interface de sélection des familles
 * Backend pour les dialogues HTML
 */

/**
 * Affiche le dialogue de sélection des familles
 */
function showFamilySelectionDialog() {
    const occasions = dataService.getOccasions();

    const template = HtmlService.createTemplateFromFile('ui/familySelection');
    template.occasions = occasions;

    const html = template.evaluate()
        .setWidth(950)
        .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(html, '📋 Sélection des familles pour livraison');
}

/**
 * Récupère toutes les familles validées
 * @returns {Array<Object>} Liste des familles validées
 */
function getValidatedFamilies() {
    try {
        const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
        const FC = SHEET_DEF.FAMILLE.COLS;

        const validatedFamilies = [];

        familleData.forEach(row => {
            const etat = row[FC.ETAT];

            // Seulement les familles avec état "Validé"
            if (etat === 'Validé') {
                const idQuartier = row[FC.ID_QUARTIER];
                const quartier = idQuartier ? dataService.getQuartierDetails(idQuartier) : null;

                validatedFamilies.push({
                    id: row[FC.ID],
                    nom: row[FC.NOM],
                    prenomContact: row[FC.PRENOM_CONTACT],
                    nombreAdulte: row[FC.NOMBRE_ADULTE] || 0,
                    nombreEnfant: row[FC.NOMBRE_ENFANT] || 0,
                    adresse: row[FC.ADRESSE],
                    email: row[FC.EMAIL],
                    telephone: row[FC.TELEPHONE],
                    seDeplace: row[FC.SE_DEPLACE] || false,
                    quartierNom: quartier?.nom || 'Non défini',
                    latitude: quartier?.latitude,
                    longitude: quartier?.longitude
                });
            }
        });

        // Trier par distance (plus proche en premier) si coordonnées disponibles
        const associationCoords = GeocodingService.getAssociationCoordinates();
        if (associationCoords) {
            validatedFamilies.sort((a, b) => {
                const distA = a.latitude && a.longitude ?
                    calculateDistance(associationCoords.lat, associationCoords.lng, a.latitude, a.longitude) :
                    Infinity;
                const distB = b.latitude && b.longitude ?
                    calculateDistance(associationCoords.lat, associationCoords.lng, b.latitude, b.longitude) :
                    Infinity;
                return distA - distB;
            });
        }

        console.log(`${validatedFamilies.length} familles validées trouvées`);
        return validatedFamilies;

    } catch (error) {
        logError(error, 'getValidatedFamilies');
        throw error;
    }
}

/**
 * Crée les livraisons pour les familles sélectionnées
 * @param {Array<number>} familyIds - IDs des familles
 * @param {string} occasion - Occasion
 * @param {string} date - Date de livraison
 * @returns {Object} Résultat
 */
function createDeliveriesForFamilies(familyIds, occasion, date) {
    try {
        console.log(`Création de ${familyIds.length} livraisons pour ${occasion}`);

        const livraisonSheet = getSheetByName(SHEET_DEF.LIVRAISON.NAME);
        const rowsToAdd = [];

        familyIds.forEach(familyId => {
            const famille = dataService.getFamilyDetails(familyId);
            if (!famille) {
                console.warn(`Famille ${familyId} introuvable`);
                return;
            }

            const nombreParts = famille.nombreAdulte + famille.nombreEnfant;
            const avecEnfant = famille.nombreEnfant > 0;

            rowsToAdd.push([
                familyId,                    // ID_FAMILLE
                new Date(date),              // DATE_LIVRAISONS
                occasion,                    // OCCASION
                null,                        // ID_LIVREUR (assigné plus tard)
                null,                        // ID_BINOME
                nombreParts,                 // NOMBRE_PART
                avecEnfant,                  // AVEC_ENFANT
                false,                       // PRETE
                false,                       // EN_COURS
                false,                       // LIVRE
                null,                        // NOTE
                'En attente d\'assignation'  // COMMENTAIRE
            ]);
        });

        if (rowsToAdd.length > 0) {
            appendRows(SHEET_DEF.LIVRAISON.NAME, rowsToAdd);
            invalidateCache(SHEET_DEF.LIVRAISON.NAME);
        }

        console.log(`${rowsToAdd.length} livraisons créées`);

        return {
            success: true,
            count: rowsToAdd.length,
            message: `${rowsToAdd.length} livraison(s) créée(s)`
        };

    } catch (error) {
        logError(error, 'createDeliveriesForFamilies');
        throw error;
    }
}

/**
 * Valide les données d'une famille
 * @param {Object} formData - Données du formulaire
 * @returns {Object} {valid: boolean, errors: Array}
 */
function validateFamilyData(formData) {
    const errors = [];

    // Nom obligatoire
    if (!formData.nom || formData.nom.trim().length < 2) {
        errors.push('Nom de famille manquant ou trop court');
    }

    // Prénom obligatoire
    if (!formData.prenom || formData.prenom.trim().length < 2) {
        errors.push('Prénom manquant ou trop court');
    }

    // Téléphone obligatoire et valide
    if (!formData.telephone) {
        errors.push('Numéro de téléphone manquant');
    } else if (!validatePhoneNumber(formData.telephone)) {
        errors.push('Numéro de téléphone invalide (9 ou 10 chiffres requis)');
    }

    // Email valide (si fourni)
    if (formData.email && !validateEmail(formData.email)) {
        errors.push('Adresse email invalide');
    }

    // Adresse obligatoire
    if (!formData.adresse || formData.adresse.trim().length < 10) {
        errors.push('Adresse manquante ou trop courte');
    }

    // Nombre d'adultes
    if (!formData.nombreAdulte || formData.nombreAdulte < 1) {
        errors.push('Au moins un adulte requis');
    }

    // Nombre d'enfants (peut être 0)
    if (formData.nombreEnfant === undefined || formData.nombreEnfant < 0) {
        errors.push('Nombre d\'enfants invalide');
    }

    return {
        valid: errors.length === 0,
        errors: errors
    };
}

/**
 * Contrôleurs pour les actions du menu
 */

function assignDeliveriesAuto(occasion, dateLivraison, maxFamilies) {
    try {
        const maxPerDriver = parseInt(maxFamilies) || CONFIG.DEFAULT_MAX_FAMILIES_PER_DRIVER;
        const result = DeliveryService.assignDeliveries(occasion, dateLivraison, maxPerDriver);

        if (result.success) {
            SpreadsheetApp.getUi().alert('Succès', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
        } else {
            SpreadsheetApp.getUi().alert('Erreur', result.message, SpreadsheetApp.getUi().ButtonSet.OK);
        }

        return result;
    } catch (error) {
        SpreadsheetApp.getUi().alert('Erreur', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
        throw error;
    }
}

function notifyAllLivreurs(occasion, dateLivraison) {
    try {
        const results = sendEnhancedNotificationsToAll(occasion, dateLivraison);
        return results;
    } catch (error) {
        logError(error, 'notifyAllLivreurs');
        throw error;
    }
}

function notifyLivreur(livreurId, occasion, dateLivraison) {
    try {
        sendEnhancedNotification(livreurId, occasion, dateLivraison);
        return { success: true };
    } catch (error) {
        logError(error, 'notifyLivreur');
        throw error;
    }
}

function generateAllDeliveryDoc(occasion, dateLivraison) {
    try {
        const results = DocumentService.generateAllDeliveryDocs(occasion, dateLivraison);
        return results;
    } catch (error) {
        logError(error, 'generateAllDeliveryDoc');
        throw error;
    }
}

function generateDeliveryDoc(livreurId, occasion, dateLivraison) {
    try {
        const url = DocumentService.generateDeliveryDoc(livreurId, occasion, dateLivraison);
        return { success: true, url: url };
    } catch (error) {
        logError(error, 'generateDeliveryDoc');
        throw error;
    }
}

function generateDashboard(occasion, dateLivraison) {
    try {
        const url = DocumentService.generateDashboard(occasion, dateLivraison);
        return { success: true, url: url };
    } catch (error) {
        logError(error, 'generateDashboard');
        throw error;
    }
}

function generateRouteMapForDriver(livreurId, occasion, dateLivraison) {
    try {
        const url = DocumentService.generateRouteMap(livreurId, occasion, dateLivraison);
        return { success: true, url: url };
    } catch (error) {
        logError(error, 'generateRouteMapForDriver');
        throw error;
    }
}

function sendAdminReportManual(occasion, dateLivraison) {
    try {
        notificationService.sendAdminReport(occasion, dateLivraison);
        return { success: true };
    } catch (error) {
        logError(error, 'sendAdminReportManual');
        throw error;
    }
}