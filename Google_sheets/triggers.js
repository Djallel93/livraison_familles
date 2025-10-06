/**
 * Gestion des triggers Google Apps Script
 * onOpen, onEdit, onFormSubmit
 */

/**
 * Trigger onOpen - Créer le menu personnalisé
 */
function onOpen() {
    const ui = SpreadsheetApp.getUi();

    ui.createMenu('🚚 Gestion Livraisons')
        .addSubMenu(
            ui.createMenu('📋 Préparation')
                .addItem('Générer les étiquettes', 'generateEtiquettes')
                .addItem('Assigner automatiquement les livreurs', 'showAssignmentDialog')
                .addItem('Voir les besoins en inventaire', 'showInventoryNeeds')
                .addSeparator()
                .addItem('Générer les QR codes', 'showQRCodeDialog')
        )
        .addSubMenu(
            ui.createMenu('🧪 Données de Test')
                .addItem('Générer données de test', 'generateSampleData')
                .addItem('Supprimer données de test', 'clearAllData')
        )
        .addSubMenu(
            ui.createMenu('📄 Fiches de livraison')
                .addItem('Créer toutes les fiches', 'showDialogGenerateAll')
                .addItem('Créer une fiche pour un livreur', 'showDialogGenerate')
                .addItem('Créer un itinéraire optimisé', 'showDialogRouteMap')
        )
        .addSubMenu(
            ui.createMenu('📧 Notifications')
                .addItem('✨ Notifier tous les livreurs (avec QR)', 'showDialogEnhancedNotifyAll')
                .addItem('✨ Notifier un livreur (avec QR)', 'showDialogEnhancedNotify')
                .addSeparator()
                .addItem('Notifier tous les livreurs (classique)', 'showDialogNotifyAll')
                .addItem('Notifier un livreur (classique)', 'showDialogNotify')
                .addSeparator()
                .addItem('Envoyer rapport aux admins', 'showDialogAdminReport')
                .addItem('Tester email amélioré', 'testEnhancedEmail')
        )
        .addSubMenu(
            ui.createMenu('📊 Rapports & Statistiques')
                .addItem('Générer le tableau de bord', 'showDialogDashboard')
                .addItem('Exporter les statistiques', 'exportStatistics')
                .addItem('Voir l\'état d\'avancement', 'showDeliveryStatus')
        )
        .addSubMenu(
            ui.createMenu('👥 Contacts')
                .addItem('Synchroniser tous les contacts', 'syncAllContactsMenu')
                .addItem('Créer contact pour une famille', 'createContactForFamily')
        )
        .addSubMenu(
            ui.createMenu('🔧 API & Configuration')
                .addItem('Afficher infos API', 'showApiInfo')
                .addItem('Configurer URL API', 'configureApiUrl')
                .addItem('Régénérer token API', 'regenerateApiToken')
        )
        .addSeparator()
        .addItem('⚙️ Paramètres', 'showSettings')
        .addItem('🔄 Rafraîchir le cache', 'clearAllCache')
        .addToUi();
}

/**
 * Trigger onEdit - Mise à jour automatique lors de l'édition
 */
function onEdit(e) {
    const sheet = e.source.getActiveSheet();
    const range = e.range;

    // Mise à jour du nombre de parts automatiquement
    updateNbrPartOnEdit(sheet, range);
}

/**
 * Met à jour automatiquement le nombre de parts lors de l'édition d'un ID famille
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - Feuille modifiée
 * @param {GoogleAppsScript.Spreadsheet.Range} range - Plage modifiée
 */
function updateNbrPartOnEdit(sheet, range) {
    const sheetName = sheet.getName();
    const livraisonSheetName = SHEET_DEF.LIVRAISON.NAME;

    // Vérifier qu'on est sur la feuille livraison
    if (sheetName !== livraisonSheetName) return;

    const column = range.getColumn();
    const row = range.getRow();

    // Vérifier si c'est la colonne ID_FAMILLE (colonne 1) et pas l'en-tête
    if (column !== 1 || row === 1) return;

    const idFamille = range.getValue();

    if (!idFamille || typeof idFamille !== 'number') return;

    console.log(`Mise à jour automatique pour la famille ${idFamille}`);

    const famille = dataService.getFamilyDetails(idFamille);

    if (!famille) {
        console.warn(`Famille ${idFamille} introuvable`);
        return;
    }

    const nombrePart = famille.nombreAdulte + famille.nombreEnfant;

    // Mettre à jour la colonne NOMBRE_PART
    sheet.getRange(row, SHEET_DEF.LIVRAISON.COLS.NOMBRE_PART + 1)
        .setValue(nombrePart);

    console.log(`${nombrePart} part(s) attribuée(s) à la famille ${famille.nom}`);

    // Mettre à jour la colonne AVEC_ENFANT si nécessaire
    if (famille.nombreEnfant > 0) {
        sheet.getRange(row, SHEET_DEF.LIVRAISON.COLS.AVEC_ENFANT + 1)
            .setValue(true);
        console.log(`Famille avec ${famille.nombreEnfant} enfant(s)`);
    }

    // Invalider le cache
    invalidateCache(SHEET_DEF.LIVRAISON.NAME);
}

/**
 * Trigger onFormSubmit - Traitement des soumissions de formulaire
 * Automatiquement déclenché quand une personne soumet le formulaire
 */
function onFormSubmit(e) {
    try {
        console.log('Nouvelle soumission de formulaire détectée');

        const formResponses = e.namedValues;

        // 1. Organiser les fichiers dans Google Drive
        processFormSubmission(formResponses);

        // 2. Créer le contact Google automatiquement
        try {
            const contactResourceName = ContactService.createContactFromForm(formResponses);
            if (contactResourceName) {
                console.log(`✅ Contact créé: ${contactResourceName}`);
            }
        } catch (contactError) {
            // Ne pas bloquer le traitement si la création du contact échoue
            console.error(`Erreur création contact: ${contactError.message}`);
            logError(contactError, 'onFormSubmit - createContact');
        }

    } catch (error) {
        logError(error, 'onFormSubmit');
    }
}

/**
 * Traite une soumission de formulaire (organisation des fichiers)
 * @param {Object} formResponses - Réponses du formulaire
 */
function processFormSubmission(formResponses) {
    const nom = formResponses['Nom de famille ']?.[0] || '';
    const prenom = formResponses['Prénom de la personne à contacter ']?.[0] || '';
    const pieceIdentiteType = formResponses['Type de pièce d\'identité ']?.[0] || '';
    const justificatifIdentite = formResponses['Justificatif d\'identité ou de résidence ']?.[0] || '';
    const attestationCaf = formResponses['Attestation de la CAF (paiement et/ou quotient familial) ']?.[0] || '';
    const justificatifRessources = formResponses['Veuillez soumettre tous justificatif de ressources ']?.[0] || '';

    if (!nom || !prenom) {
        //TODO : en cas d'update du formulaire seul les nouveau champs sont transmit. 
        // verifer si la famille existe avec le mail fournit
        console.warn('Nom ou prénom manquant, organisation des fichiers ignorée');
        return;
    }

    // Créer le dossier parent "Dossier Familles"
    const parentFolder = createOrGetFolder(DriveApp.getRootFolder(), 'Dossier Familles');

    // Créer le dossier principal pour cette famille
    const mainFolderName = `${nom}_${prenom}`;
    const mainFolder = createOrGetFolder(parentFolder, mainFolderName);

    // Organiser les fichiers par type
    organizeIdentityFiles(justificatifIdentite, pieceIdentiteType, mainFolder);
    organizeCafFiles(attestationCaf, mainFolder);
    organizeResourceFiles(justificatifRessources, mainFolder);

    console.log(`✅ Fichiers organisés pour : ${mainFolderName}`);
}

/**
 * Organise les fichiers d'identité
 */
function organizeIdentityFiles(justificatifIdentite, pieceIdentiteType, mainFolder) {
    if (!justificatifIdentite) return;

    const identityFolder = createOrGetFolder(mainFolder, 'Justificatif_Identité');
    const files = extractFileUrls(justificatifIdentite);

    files.forEach(fileUrl => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const newFileName = pieceIdentiteType || 'Justificatif_Identite';
                const extension = getFileExtension(file.getName());

                file.makeCopy(`${newFileName}${extension}`, identityFolder);
                console.log(`Fichier d'identité copié : ${newFileName}${extension}`);
            }
        } catch (error) {
            logError(error, 'organizeIdentityFiles');
        }
    });
}

/**
 * Organise les fichiers CAF
 */
function organizeCafFiles(attestationCaf, mainFolder) {
    if (!attestationCaf) return;

    const cafFolder = createOrGetFolder(mainFolder, 'Attestation_CAF');
    const files = extractFileUrls(attestationCaf);

    files.forEach(fileUrl => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const extension = getFileExtension(file.getName());

                file.makeCopy(`Attestation_CAF${extension}`, cafFolder);
                console.log(`Attestation CAF copiée`);
            }
        } catch (error) {
            logError(error, 'organizeCafFiles');
        }
    });
}

/**
 * Organise les fichiers de ressources
 */
function organizeResourceFiles(justificatifRessources, mainFolder) {
    if (!justificatifRessources) return;

    const resourceFolder = createOrGetFolder(mainFolder, 'Justificatif_ressources');
    const files = extractFileUrls(justificatifRessources);

    files.forEach((fileUrl, index) => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const extension = getFileExtension(file.getName());

                const fileName = files.length > 1
                    ? `Justificatif_ressources_${index + 1}${extension}`
                    : `Justificatif_ressources${extension}`;

                file.makeCopy(fileName, resourceFolder);
                console.log(`Justificatif de ressources copié : ${fileName}`);
            }
        } catch (error) {
            logError(error, 'organizeResourceFiles');
        }
    });
}