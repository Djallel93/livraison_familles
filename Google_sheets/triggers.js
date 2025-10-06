/**
 * Creates custom menu on spreadsheet open
 */
function onOpen() {
    onOpenPreloadCache();

    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📦 AMANA')
        .addSubMenu(ui.createMenu('📋 Livraisons')
            .addItem('👨‍👩‍👧‍👦 Sélectionner les familles', 'showFamilySelectionDialog')
            .addItem('⚙️ Assigner automatiquement', 'showAssignmentDialog')
            .addItem('🗂️ Générer toutes les fiches', 'showDialogGenerateAll')
            .addItem('📄 Générer une fiche', 'showDialogGenerate')
            .addItem('📦 Voir besoins inventaire', 'showInventoryNeeds')
            .addItem('📊 État d\'avancement', 'showDeliveryStatus'))
        .addSubMenu(ui.createMenu('📧 Notifications')
            .addItem('📨 Notifier tous (avec QR)', 'showDialogEnhancedNotifyAll')
            .addItem('👤 Notifier un livreur', 'showDialogEnhancedNotify')
            .addItem('🧾 Rapport administrateur', 'showDialogAdminReport'))
        .addSubMenu(ui.createMenu('📄 Documents')
            .addItem('📊 Tableau de bord', 'showDialogDashboard')
            .addItem('🗺️ Itinéraire livreur', 'showDialogRouteMap')
            .addItem('📈 Exporter statistiques', 'exportStatistics'))
        .addSubMenu(ui.createMenu('📱 QR Codes')
            .addItem('🔲 Générer QR codes', 'showQRCodeDialog'))
        .addSubMenu(ui.createMenu('👥 Contacts')
            .addItem('🔄 Synchroniser tous', 'syncAllContactsMenu')
            .addItem('➕ Créer un contact', 'createContactForFamily'))
        .addSubMenu(ui.createMenu('🗺️ Géocodage')
            .addItem('📍 Géocoder familles sans quartier', 'geocodeAllFamiliesMenu')
            .addItem('⚙️ Configurer coordonnées association', 'setAssociationCoordsMenu'))
        .addSubMenu(ui.createMenu('⚙️ Configuration')
            .addItem('🚀 Configuration initiale', 'initialSetup')
            .addItem('🔗 Configurer URL API', 'configureApiUrl')
            .addItem('🔐 Régénérer token API', 'regenerateApiToken')
            .addItem('ℹ️ Infos API', 'showApiInfo')
            .addItem('📁 Configurer dossier Drive', 'configureDriveFolder')
            .addItem('⏱️ Installer triggers', 'setupTriggers')
            .addItem('📊 Stats cache', 'showCacheStats'))
        .addSeparator()
        .addItem('🔄 Rafraîchir le cache', 'refreshAllCache')
        .addToUi();
}

/**
 * Initial setup - Run ONCE after migration
 */
function initialSetup() {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
        'Configuration initiale',
        'Cette action va configurer votre système. Avez-vous:\n' +
        '1. Créé un dossier Drive pour les documents\n' +
        '2. Vos formulaires Google Forms prêts\n' +
        '3. Déployé la Web App\n\n' +
        'Continuer?',
        ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
        return;
    }

    const scriptProperties = PropertiesService.getScriptProperties();

    // Generate API token
    const token = Utilities.getUuid();
    scriptProperties.setProperty('API_TOKEN', token);

    // Show configuration instructions
    const message =
        '✅ Token API généré!\n\n' +
        `Token: ${token}\n\n` +
        '⚠️ SAUVEGARDEZ CE TOKEN!\n\n' +
        'Prochaines étapes:\n' +
        '1. Menu → Géocodage → Configurer coordonnées association\n' +
        '2. Menu → Configuration → Configurer dossier Drive\n' +
        '3. Menu → Configuration → Installer triggers\n' +
        '4. Déployez en Web App et configurez l\'URL API';

    ui.alert('Configuration', message, ui.ButtonSet.OK);
}

/**
 * Setup triggers - Run after initial setup
 */
function setupTriggers() {
    const ui = SpreadsheetApp.getUi();

    // Get form IDs
    const familyFormResult = ui.prompt(
        'ID Formulaire Famille',
        'Entrez l\'ID du formulaire famille (depuis l\'URL):',
        ui.ButtonSet.OK_CANCEL
    );

    if (familyFormResult.getSelectedButton() !== ui.Button.OK) {
        return;
    }

    const driverFormResult = ui.prompt(
        'ID Formulaire Livreur',
        'Entrez l\'ID du formulaire livreur (depuis l\'URL):',
        ui.ButtonSet.OK_CANCEL
    );

    if (driverFormResult.getSelectedButton() !== ui.Button.OK) {
        return;
    }

    const familyFormId = familyFormResult.getResponseText().trim();
    const driverFormId = driverFormResult.getResponseText().trim();

    // Save form IDs
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('FAMILY_FORM_ID', familyFormId);
    scriptProperties.setProperty('DRIVER_FORM_ID', driverFormId);

    // Remove existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));

    try {
        // Create family form trigger
        ScriptApp.newTrigger('onFamilyFormSubmit')
            .forForm(familyFormId)
            .onFormSubmit()
            .create();

        // Create driver form trigger
        ScriptApp.newTrigger('onDriverFormSubmit')
            .forForm(driverFormId)
            .onFormSubmit()
            .create();

        ui.alert('Succès', '✅ Triggers installés avec succès!', ui.ButtonSet.OK);

    } catch (error) {
        ui.alert('Erreur', 'Erreur installation triggers:\n' + error.message, ui.ButtonSet.OK);
    }
}