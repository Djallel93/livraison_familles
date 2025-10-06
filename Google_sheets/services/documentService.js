/**
 * Service de génération de documents
 * Crée des Google Docs pour les livreurs, tableaux de bord et itinéraires
 */

const DocumentService = (() => {

    // ========================================
    // Helpers privés
    // ========================================

    const formatDate = (dateString) => {
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        if (isNaN(date.getTime())) return dateString.toString();
        return date.toLocaleDateString(CONFIG.DATE_FORMAT.locale, CONFIG.DATE_FORMAT.options);
    };

    const styleTable = (table) => {
        const headerRow = table.getRow(0);
        headerRow.editAsText().setBold(true);

        for (let i = 0; i < headerRow.getNumCells(); i++) {
            const cell = headerRow.getCell(i);
            cell.setBackgroundColor('#4CAF50');
            cell.editAsText().setForegroundColor('#FFFFFF');
        }
    };

    // ========================================
    // Méthodes publiques
    // ========================================

    const generateDeliveryDoc = (livreurId, occasion, dateLivraison) => {
        const livreurInfo = DataService.getLivreurDetailsById(Number(livreurId));

        if (!livreurInfo) {
            throw new Error(`Livreur ${livreurId} introuvable`);
        }

        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);
        const deliveries = assignments[livreurId] || [];

        if (deliveries.length === 0) {
            throw new Error(`Aucune livraison assignée au livreur ${livreurId}`);
        }

        const docName = `Livraisons - ${livreurInfo.nom} ${livreurInfo.prenom} - ${occasion}`;
        const doc = DocumentApp.create(docName);
        const body = doc.getBody();

        // En-tête
        const title = body.appendParagraph(`📌 ${livreurInfo.nom} ${livreurInfo.prenom}`);
        title.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        body.appendParagraph(`Occasion : ${occasion}`);
        body.appendParagraph(`Date : ${formatDate(dateLivraison)}`);
        body.appendHorizontalRule();

        // Tableau des livraisons
        const tableData = [
            ['ID', 'Nom', 'Parts', 'Enfants', 'Tél.', 'Tél. Bis']
        ];

        deliveries.forEach(delivery => {
            tableData.push([
                delivery.id.toString(),
                delivery.nom,
                delivery.nombreParts.toString(),
                delivery.nombreEnfant > 0 ? `${delivery.nombreEnfant} enfant(s)` : 'Sans enfant',
                delivery.telephone || 'Inconnu',
                delivery.telephoneBis || ''
            ]);
        });

        const table = body.appendTable(tableData);
        styleTable(table);

        console.log(`✅ Document créé : ${doc.getUrl()}`);
        return doc.getUrl();
    };

    const generateAllDeliveryDocs = (occasion, dateLivraison) => {
        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);
        const results = { success: 0, failed: 0, urls: [] };

        for (const driverId of Object.keys(assignments)) {
            try {
                const url = generateDeliveryDoc(driverId, occasion, dateLivraison);
                results.success++;
                results.urls.push(url);
            } catch (error) {
                results.failed++;
                console.error(`generateDeliveryDoc(${driverId}): ${error.message}`);
            }
        }

        console.log(`✅ ${results.success} document(s) créé(s), ${results.failed} échec(s)`);
        return results;
    };

    const generateDashboard = (occasion, dateLivraison) => {
        console.log(`📊 Génération du tableau de bord : ${occasion} le ${dateLivraison}`);

        const docName = `Tableau de bord - ${occasion} - ${dateLivraison}`;
        const doc = DocumentApp.create(docName);
        const body = doc.getBody();

        // Titre
        const title = body.appendParagraph(`📊 Tableau de Bord - ${occasion}`);
        title.setHeading(DocumentApp.ParagraphHeading.HEADING1);

        body.appendParagraph(`Date : ${formatDate(dateLivraison)}`);
        body.appendHorizontalRule();
        body.appendParagraph('\n');

        // Sections
        addStatisticsSection(body, occasion, dateLivraison);
        addDriverSection(body, occasion, dateLivraison);
        addInventorySection(body, occasion, dateLivraison);
        addStatusSection(body, occasion, dateLivraison);

        console.log(`✅ Tableau de bord créé : ${doc.getUrl()}`);
        return doc.getUrl();
    };

    const addStatisticsSection = (body, occasion, dateLivraison) => {
        const heading = body.appendParagraph('📈 Statistiques Générales');
        heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        const inventory = DeliveryService.calculateInventoryNeeds(occasion, dateLivraison);
        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);

        const tableData = [
            ['Indicateur', 'Valeur'],
            ['Nombre de familles', inventory.totalFamilies.toString()],
            ['Total de parts à préparer', inventory.totalParts.toString()],
            ['Kits jouets nécessaires', inventory.totalToyKits.toString()],
            ['Kits hygiène nécessaires', inventory.totalHygieneKits.toString()],
            ['Nombre de livreurs assignés', Object.keys(assignments).length.toString()]
        ];

        const table = body.appendTable(tableData);
        styleTable(table);
        body.appendParagraph('\n');
    };

    const addDriverSection = (body, occasion, dateLivraison) => {
        const heading = body.appendParagraph('🚚 Répartition par Livreur');
        heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);

        const tableData = [
            ['Livreur', 'Nombre de familles', 'Total de parts', 'Avec enfants']
        ];

        for (const [driverId, deliveries] of Object.entries(assignments)) {
            const driver = DataService.getLivreurDetailsById(Number(driverId));
            if (driver) {
                const withChildren = deliveries.filter(d => d.nombreEnfant > 0).length;
                const totalParts = deliveries.reduce((sum, d) => sum + d.nombreParts, 0);

                tableData.push([
                    `${driver.nom} ${driver.prenom}`,
                    deliveries.length.toString(),
                    totalParts.toString(),
                    withChildren.toString()
                ]);
            }
        }

        const table = body.appendTable(tableData);
        styleTable(table);
        body.appendParagraph('\n');
    };

    const addInventorySection = (body, occasion, dateLivraison) => {
        const heading = body.appendParagraph('📦 Besoins en Inventaire');
        heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        const inventory = DeliveryService.calculateInventoryNeeds(occasion, dateLivraison);

        body.appendParagraph(`À préparer pour cette livraison :`);
        body.appendParagraph(`• ${inventory.totalParts} sacs de nourriture (parts)`);
        body.appendParagraph(`• ${inventory.totalToyKits} kits de jouets pour enfants`);
        body.appendParagraph(`• ${inventory.totalHygieneKits} kits d'hygiène`);
        body.appendParagraph('\n');
    };

    const addStatusSection = (body, occasion, dateLivraison) => {
        const heading = body.appendParagraph('✅ État d\'Avancement');
        heading.setHeading(DocumentApp.ParagraphHeading.HEADING2);

        const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
        const LC = SHEET_DEF.LIVRAISON.COLS;

        let prepared = 0, inProgress = 0, delivered = 0, total = 0;

        livraisonData.forEach(row => {
            const rowDate = new Date(row[LC.DATE_LIVRAISONS]).toISOString().split('T')[0];
            if (row[LC.OCCASION] === occasion && rowDate === dateLivraison) {
                total++;
                if (row[LC.LIVRE]) delivered++;
                else if (row[LC.EN_COURS]) inProgress++;
                else if (row[LC.PRETE]) prepared++;
            }
        });

        const tableData = [
            ['Statut', 'Nombre', 'Pourcentage'],
            ['Préparées', prepared.toString(), `${((prepared / total) * 100).toFixed(1)}%`],
            ['En cours de livraison', inProgress.toString(), `${((inProgress / total) * 100).toFixed(1)}%`],
            ['Livrées', delivered.toString(), `${((delivered / total) * 100).toFixed(1)}%`],
            ['Non préparées', (total - prepared - inProgress - delivered).toString(),
                `${(((total - prepared - inProgress - delivered) / total) * 100).toFixed(1)}%`]
        ];

        const table = body.appendTable(tableData);
        styleTable(table);
        body.appendParagraph('\n');
    };

    const generateRouteMap = (driverId, occasion, dateLivraison) => {
        const driver = DataService.getLivreurDetailsById(Number(driverId));

        if (!driver) {
            throw new Error(`Livreur ${driverId} introuvable`);
        }

        const docName = `Itinéraire - ${driver.nom} ${driver.prenom} - ${occasion}`;
        const doc = DocumentApp.create(docName);
        const body = doc.getBody();

        const title = body.appendParagraph(`🗺️ Itinéraire de Livraison`);
        title.setHeading(DocumentApp.ParagraphHeading.HEADING1);

        body.appendParagraph(`Livreur : ${driver.nom} ${driver.prenom}`);
        body.appendParagraph(`Date : ${formatDate(dateLivraison)}`);
        body.appendHorizontalRule();

        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);
        const deliveries = assignments[driverId] || [];

        if (deliveries.length === 0) {
            body.appendParagraph('Aucune livraison assignée');
            return doc.getUrl();
        }

        // Optimiser l'ordre
        const optimizedDeliveries = DeliveryService.optimizeRouteOrder(deliveries);

        optimizedDeliveries.forEach((delivery, index) => {
            body.appendParagraph(`\nLivraison ${index + 1}`).setBold(true);
            body.appendParagraph(`Famille #${delivery.id} - ${delivery.nom}`);
            body.appendParagraph(`📍 ${delivery.adresse}, ${delivery.codePostal} ${delivery.ville}`);
            body.appendParagraph(`📞 ${delivery.telephone}`);
            body.appendParagraph(`📦 ${delivery.nombreParts} part(s)`);
            if (delivery.nombreEnfant > 0) {
                body.appendParagraph(`👶 ${delivery.nombreEnfant} enfant(s) - Prévoir jouets`);
            }
            body.appendHorizontalRule();
        });

        console.log(`✅ Itinéraire créé : ${doc.getUrl()}`);
        return doc.getUrl();
    };

    const exportStatisticsToSheet = (occasion, dateLivraison) => {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let statsSheet = ss.getSheetByName('Statistiques');

        if (!statsSheet) {
            statsSheet = ss.insertSheet('Statistiques');
            statsSheet.appendRow([
                'Timestamp', 'Occasion', 'Date', 'Familles',
                'Parts', 'Jouets', 'Hygiène', 'Livreurs'
            ]);
        }

        const inventory = DeliveryService.calculateInventoryNeeds(occasion, dateLivraison);
        const assignments = NotificationService.getDriverAssignments(occasion, dateLivraison);

        const rowData = [
            new Date(),
            occasion,
            dateLivraison,
            inventory.totalFamilies,
            inventory.totalParts,
            inventory.totalToyKits,
            inventory.totalHygieneKits,
            Object.keys(assignments).length
        ];

        statsSheet.appendRow(rowData);
        console.log('Statistiques exportées');
    };

    // Interface publique
    return {
        generateDeliveryDoc,
        generateAllDeliveryDocs,
        generateDashboard,
        generateRouteMap,
        exportStatisticsToSheet
    };
})();