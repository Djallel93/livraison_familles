/**
 * Service de génération de QR codes pour les livraisons
 * Utilise l'API Google Charts pour générer les QR codes
 */

const QRCodeService = (() => {

    const QR_API_BASE = 'https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=';

    /**
     * Génère une URL de QR code pour une livraison
     * @param {number} familyId - ID de la famille
     * @param {string} occasion - Occasion
     * @param {string} date - Date de livraison (YYYY-MM-DD)
     * @param {string} status - Statut à mettre à jour
     * @returns {string} URL du QR code
     */
    const generateQRCodeUrl = (familyId, occasion, date, status) => {
        const apiUrl = getApiUrl();
        if (!apiUrl) {
            throw new Error('URL de l\'API non configurée');
        }

        const scriptProperties = PropertiesService.getScriptProperties();
        const token = scriptProperties.getProperty('API_TOKEN');

        // Construire l'URL de l'API avec paramètres courts
        const apiCallUrl = `${apiUrl}?a=update_status&t=${token}&fid=${familyId}&occ=${encodeURIComponent(occasion)}&d=${date}&s=${status}`;

        // Générer l'URL du QR code
        const qrUrl = QR_API_BASE + encodeURIComponent(apiCallUrl);

        return qrUrl;
    };

    /**
     * Génère tous les QR codes pour une livraison (préparation + livraison)
     * @param {number} familyId - ID de la famille
     * @param {string} occasion - Occasion
     * @param {string} date - Date de livraison
     * @returns {Object} URLs des QR codes
     */
    const generateAllQRCodes = (familyId, occasion, date) => {
        return {
            prepared: generateQRCodeUrl(familyId, occasion, date, 'prepared'),
            in_progress: generateQRCodeUrl(familyId, occasion, date, 'in_progress'),
            delivered: generateQRCodeUrl(familyId, occasion, date, 'delivered'),
            failed: generateQRCodeUrl(familyId, occasion, date, 'failed')
        };
    };

    /**
     * Génère une feuille avec tous les QR codes pour une occasion
     * @param {string} occasion - Occasion
     * @param {string} date - Date de livraison
     */
    const generateQRCodeSheet = (occasion, date) => {
        try {
            const ss = SpreadsheetApp.getActiveSpreadsheet();
            const sheetName = `QR_${occasion}_${date}`;

            // Supprimer l'ancienne feuille si elle existe
            let qrSheet = ss.getSheetByName(sheetName);
            if (qrSheet) {
                ss.deleteSheet(qrSheet);
            }

            qrSheet = ss.insertSheet(sheetName);

            // En-têtes
            const headers = [
                'ID Famille', 'Nom', 'Adresse', 'Parts',
                'QR Préparé', 'QR En cours', 'QR Livré', 'QR Échec'
            ];
            qrSheet.appendRow(headers);

            // Style des en-têtes
            const headerRange = qrSheet.getRange(1, 1, 1, headers.length);
            headerRange.setFontWeight('bold');
            headerRange.setBackground('#4CAF50');
            headerRange.setFontColor('#FFFFFF');

            // Récupérer les livraisons
            const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
            const LC = SHEET_DEF.LIVRAISON.COLS;

            let rowNumber = 2;

            livraisonData.forEach(row => {
                const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));

                if (row[LC.OCCASION] === occasion && rowDate === date) {
                    const familyId = row[LC.ID_FAMILLE];
                    const famille = DataService.getFamilyDetails(familyId);

                    if (!famille) return;

                    const qrCodes = generateAllQRCodes(familyId, occasion, date);

                    // Données de la ligne
                    const rowData = [
                        familyId,
                        famille.nom,
                        `${famille.adresse}, ${famille.codePostal} ${famille.ville}`,
                        row[LC.NOMBRE_PART]
                    ];

                    qrSheet.getRange(rowNumber, 1, 1, 4).setValues([rowData]);

                    // Insérer les images QR codes
                    insertQRImage(qrSheet, rowNumber, 5, qrCodes.prepared);
                    insertQRImage(qrSheet, rowNumber, 6, qrCodes.in_progress);
                    insertQRImage(qrSheet, rowNumber, 7, qrCodes.delivered);
                    insertQRImage(qrSheet, rowNumber, 8, qrCodes.failed);

                    // Ajuster la hauteur de ligne pour les QR codes
                    qrSheet.setRowHeight(rowNumber, 150);

                    rowNumber++;
                }
            });

            // Ajuster les colonnes
            qrSheet.autoResizeColumns(1, 4);
            qrSheet.setColumnWidths(5, 4, 160); // Colonnes QR codes

            console.log(`QR codes générés dans la feuille: ${sheetName}`);

            return {
                success: true,
                sheetName: sheetName,
                totalRows: rowNumber - 2
            };

        } catch (error) {
            logError(error, 'generateQRCodeSheet');
            throw error;
        }
    };

    /**
     * Insère une image QR code dans une cellule
     * @param {Sheet} sheet - Feuille
     * @param {number} row - Numéro de ligne
     * @param {number} col - Numéro de colonne
     * @param {string} qrUrl - URL du QR code
     */
    const insertQRImage = (sheet, row, col, qrUrl) => {
        try {
            // Créer une formule IMAGE pour afficher le QR code
            const formula = `=IMAGE("${qrUrl}", 1)`;
            sheet.getRange(row, col).setFormula(formula);
        } catch (error) {
            console.warn(`Erreur insertion QR code: ${error.message}`);
            // En cas d'échec, afficher l'URL
            sheet.getRange(row, col).setValue(qrUrl);
        }
    };

    /**
     * Génère un document PDF avec les QR codes pour impression
     * @param {string} occasion - Occasion
     * @param {string} date - Date de livraison
     * @returns {string} URL du PDF
     */
    const generateQRCodePDF = (occasion, date) => {
        try {
            const docName = `QR_Codes_${occasion}_${date}`;
            const doc = DocumentApp.create(docName);
            const body = doc.getBody();

            // Titre
            const title = body.appendParagraph(`QR Codes - ${occasion}`);
            title.setHeading(DocumentApp.ParagraphHeading.HEADING1);
            body.appendParagraph(`Date: ${formatDate(date)}`);
            body.appendHorizontalRule();

            // Récupérer les livraisons
            const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
            const LC = SHEET_DEF.LIVRAISON.COLS;

            livraisonData.forEach(row => {
                const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));

                if (row[LC.OCCASION] === occasion && rowDate === date) {
                    const familyId = row[LC.ID_FAMILLE];
                    const famille = DataService.getFamilyDetails(familyId);

                    if (!famille) return;

                    // Section pour chaque famille
                    body.appendPageBreak();

                    const familyTitle = body.appendParagraph(`Famille ${famille.nom} (ID: ${familyId})`);
                    familyTitle.setHeading(DocumentApp.ParagraphHeading.HEADING2);

                    body.appendParagraph(`Adresse: ${famille.adresse}, ${famille.codePostal} ${famille.ville}`);
                    body.appendParagraph(`Parts: ${row[LC.NOMBRE_PART]}`);
                    body.appendParagraph('');

                    const qrCodes = generateAllQRCodes(familyId, occasion, date);

                    // Créer un tableau 2x2 pour les QR codes
                    const qrTable = body.appendTable();

                    // Ligne 1
                    const row1 = qrTable.appendTableRow();
                    const cell1 = row1.appendTableCell('Préparé');
                    const cell2 = row1.appendTableCell('En cours');

                    // Ligne 2 avec les QR codes
                    const row2 = qrTable.appendTableRow();
                    addQRToCell(row2.appendTableCell(), qrCodes.prepared);
                    addQRToCell(row2.appendTableCell(), qrCodes.in_progress);

                    // Ligne 3
                    const row3 = qrTable.appendTableRow();
                    const cell5 = row3.appendTableCell('Livré');
                    const cell6 = row3.appendTableCell('Échec');

                    // Ligne 4 avec les QR codes
                    const row4 = qrTable.appendTableRow();
                    addQRToCell(row4.appendTableCell(), qrCodes.delivered);
                    addQRToCell(row4.appendTableCell(), qrCodes.failed);
                }
            });

            console.log(`PDF QR codes créé: ${doc.getUrl()}`);
            return doc.getUrl();

        } catch (error) {
            logError(error, 'generateQRCodePDF');
            throw error;
        }
    };

    /**
     * Ajoute un QR code dans une cellule de tableau
     */
    const addQRToCell = (cell, qrUrl) => {
        try {
            // Note: Google Docs API ne supporte pas directement l'insertion d'images depuis URL
            // On ajoute l'URL comme texte
            cell.appendParagraph(qrUrl);
        } catch (error) {
            console.warn(`Erreur ajout QR: ${error.message}`);
        }
    };

    /**
     * Génère les QR codes pour tous les livreurs et envoie par email
     * @param {string} occasion - Occasion
     * @param {string} date - Date de livraison
     */
    const generateAndSendQRCodes = (occasion, date) => {
        try {
            const assignments = notificationService.getDriverAssignments(occasion, date);
            const results = { success: 0, failed: 0 };

            for (const [driverId, deliveries] of Object.entries(assignments)) {
                try {
                    const driver = DataService.getLivreurDetailsById(Number(driverId));

                    if (!driver || !driver.email) {
                        results.failed++;
                        continue;
                    }

                    sendQRCodeEmail(driver, deliveries, occasion, date);
                    results.success++;

                } catch (error) {
                    results.failed++;
                    logError(error, `sendQRCodes driver ${driverId}`);
                }
            }

            return results;

        } catch (error) {
            logError(error, 'generateAndSendQRCodes');
            throw error;
        }
    };

    /**
     * Envoie les QR codes par email à un livreur
     */
    const sendQRCodeEmail = (driver, deliveries, occasion, date) => {
        const subject = `QR Codes - ${occasion} - ${formatDate(date)}`;

        let htmlBody = `
<!DOCTYPE html>
<html>
<head>
<style>
body { font-family: Arial, sans-serif; }
.qr-container { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
.qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 10px; }
.qr-item { text-align: center; }
.qr-item img { width: 150px; height: 150px; }
</style>
</head>
<body>
<h2>Vos QR Codes de livraison</h2>
<p>Bonjour ${driver.prenom},</p>
<p>Voici les QR codes pour vos livraisons du ${formatDate(date)} (${occasion}).</p>
`;

        deliveries.forEach(delivery => {
            const qrCodes = generateAllQRCodes(delivery.id, occasion, date);

            htmlBody += `
<div class="qr-container">
<h3>Famille ${delivery.nom} (ID: ${delivery.id})</h3>
<p>${delivery.adresse}</p>
<div class="qr-grid">
<div class="qr-item">
<img src="${qrCodes.prepared}" alt="QR Préparé"/>
<p>Préparé</p>
</div>
<div class="qr-item">
<img src="${qrCodes.in_progress}" alt="QR En cours"/>
<p>En cours</p>
</div>
<div class="qr-item">
<img src="${qrCodes.delivered}" alt="QR Livré"/>
<p>Livré</p>
</div>
<div class="qr-item">
<img src="${qrCodes.failed}" alt="QR Échec"/>
<p>Échec</p>
</div>
</div>
</div>
`;
        });

        htmlBody += `
<p><strong>Instructions:</strong> Scannez le QR code correspondant à chaque étape de la livraison.</p>
</body>
</html>`;

        MailApp.sendEmail({
            to: driver.email,
            subject: subject,
            htmlBody: htmlBody,
            name: CONFIG.EMAIL_SENDER_NAME
        });

        console.log(`QR codes envoyés à ${driver.email}`);
    };

    // Interface publique
    return {
        generateQRCodeUrl,
        generateAllQRCodes,
        generateQRCodeSheet,
        generateQRCodePDF,
        generateAndSendQRCodes,
        sendQRCodeEmail
    };
})();