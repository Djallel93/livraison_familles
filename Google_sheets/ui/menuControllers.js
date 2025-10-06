/**
 * Gestion des contrôleurs de menu
 * Fonctions appelées depuis le menu personnalisé
 */

/**
 * Synchronise tous les contacts depuis le menu
 */
function syncAllContactsMenu() {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
        'Synchroniser les contacts',
        'Cette action va créer/mettre à jour les contacts Google pour toutes les familles. Continuer?',
        ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
        return;
    }

    try {
        const result = ContactService.syncAllContacts();
        ui.alert('Succès', result.message, ui.ButtonSet.OK);
    } catch (error) {
        ui.alert('Erreur', error.message, ui.ButtonSet.OK);
    }
}

/**
 * Crée un contact pour une famille spécifique
 */
function createContactForFamily() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Créer un contact',
        'Entrez l\'ID de la famille:',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const familyId = parseInt(result.getResponseText());

        if (isNaN(familyId)) {
            ui.alert('Erreur', 'ID invalide', ui.ButtonSet.OK);
            return;
        }

        try {
            const famille = dataService.getFamilyDetails(familyId);
            if (!famille) {
                ui.alert('Erreur', `Famille ${familyId} introuvable`, ui.ButtonSet.OK);
                return;
            }

            const resourceName = ContactService.createOrUpdateContact(famille);
            ui.alert('Succès', `Contact créé/mis à jour: ${famille.nom}`, ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

/**
 * Affiche le dialogue pour générer les QR codes
 */
function showQRCodeDialog() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Générer les QR codes',
        'Entrez: Occasion|Date (ex: Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 2) {
            ui.alert('Format invalide. Utilisez: Occasion|YYYY-MM-DD');
            return;
        }

        const [occasion, date] = parts.map(s => s.trim());

        try {
            const sheetResult = QRCodeService.generateQRCodeSheet(occasion, date);
            ui.alert(
                'Succès',
                `${sheetResult.totalRows} QR codes générés dans "${sheetResult.sheetName}"`,
                ui.ButtonSet.OK
            );
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

/**
 * Dialogue pour notifier avec emails améliorés (tous)
 */
function showDialogEnhancedNotifyAll() {
    const ui = SpreadsheetApp.getUi();
    const occasions = dataService.getOccasions();

    if (occasions.length === 0) {
        ui.alert('Erreur', 'Aucune occasion disponible', ui.ButtonSet.OK);
        return;
    }

    const result = ui.prompt(
        'Notifier tous (avec QR codes)',
        'Entrez: Occasion|Date (ex: Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 2) {
            ui.alert('Format invalide');
            return;
        }

        const [occasion, date] = parts.map(s => s.trim());

        try {
            const results = sendEnhancedNotificationsToAll(occasion, date);
            ui.alert(
                'Notifications envoyées',
                `${results.success} email(s) envoyé(s), ${results.failed} échec(s)`,
                ui.ButtonSet.OK
            );
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

/**
 * Dialogue pour notifier un livreur avec email amélioré
 */
function showDialogEnhancedNotify() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Notifier un livreur (avec QR codes)',
        'Entrez: ID_Livreur|Occasion|Date (ex: 1|Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 3) {
            ui.alert('Format invalide');
            return;
        }

        const [livreurId, occasion, date] = parts.map(s => s.trim());

        try {
            sendEnhancedNotification(livreurId, occasion, date);
            ui.alert('Succès', 'Email envoyé avec QR codes', ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

/**
 * Configure l'URL de l'API
 */
function configureApiUrl() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Configurer URL API',
        'Entrez l\'URL de votre Web App déployée:',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const url = result.getResponseText().trim();

        if (!url.startsWith('https://')) {
            ui.alert('Erreur', 'L\'URL doit commencer par https://', ui.ButtonSet.OK);
            return;
        }

        const scriptProperties = PropertiesService.getScriptProperties();
        scriptProperties.setProperty('API_URL', url);
        ui.alert('Succès', 'URL API configurée', ui.ButtonSet.OK);
    }
}

/**
 * Régénère le token API
 */
function regenerateApiToken() {
    const ui = SpreadsheetApp.getUi();

    const response = ui.alert(
        'Régénérer le token',
        'Attention: Les anciens QR codes et liens ne fonctionneront plus. Continuer?',
        ui.ButtonSet.YES_NO
    );

    if (response === ui.Button.YES) {
        const newToken = Utilities.getUuid();
        const scriptProperties = PropertiesService.getScriptProperties();
        scriptProperties.setProperty('API_TOKEN', newToken);

        ui.alert(
            'Token régénéré',
            `Nouveau token: ${newToken}\n\nSauvegardez-le en lieu sûr!`,
            ui.ButtonSet.OK
        );
    }
}

/**
 * Affiche les infos API
 */
function showApiInfo() {
    const ui = SpreadsheetApp.getUi();
    const scriptProperties = PropertiesService.getScriptProperties();

    const apiUrl = scriptProperties.getProperty('API_URL') || 'Non configurée';
    const token = scriptProperties.getProperty('API_TOKEN') || 'Non généré';

    ui.alert(
        'Informations API',
        `URL: ${apiUrl}\n\nToken: ${token}\n\nUtilisez ces informations pour les QR codes et l'API REST.`,
        ui.ButtonSet.OK
    );
}

/**
 * Affiche les dialogues génériques pour les autres actions
 * (Ces fonctions utilisent le fichier dialog.html)
 */
function showAssignmentDialog() {
    showGenericDialog('assign');
}

function showDialogGenerateAll() {
    showGenericDialog('generateAll');
}

function showDialogGenerate() {
    showGenericDialog('generate');
}

function showDialogRouteMap() {
    showGenericDialog('routeMap');
}

function showDialogNotifyAll() {
    showGenericDialog('notifyAll');
}

function showDialogNotify() {
    showGenericDialog('notify');
}

function showDialogAdminReport() {
    showGenericDialog('adminReport');
}

function showDialogDashboard() {
    showGenericDialog('dashboard');
}

function showInventoryNeeds() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Besoins en inventaire',
        'Entrez: Occasion|Date (ex: Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 2) {
            ui.alert('Format invalide');
            return;
        }

        const [occasion, date] = parts.map(s => s.trim());

        try {
            const inventory = DeliveryService.calculateInventoryNeeds(occasion, date);

            const message = `Besoins pour ${occasion} (${date}):\n\n` +
                `Familles: ${inventory.totalFamilies}\n` +
                `Parts totales: ${inventory.totalParts}\n` +
                `Kits jouets: ${inventory.totalToyKits}\n` +
                `Kits hygiène: ${inventory.totalHygieneKits}`;

            ui.alert('Inventaire', message, ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

function showDeliveryStatus() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'État d\'avancement',
        'Entrez: Occasion|Date (ex: Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 2) {
            ui.alert('Format invalide');
            return;
        }

        const [occasion, date] = parts.map(s => s.trim());

        try {
            const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
            const LC = SHEET_DEF.LIVRAISON.COLS;

            let prepared = 0, inProgress = 0, delivered = 0, total = 0;

            livraisonData.forEach(row => {
                const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
                if (row[LC.OCCASION] === occasion && rowDate === date) {
                    total++;
                    if (row[LC.LIVRE]) delivered++;
                    else if (row[LC.EN_COURS]) inProgress++;
                    else if (row[LC.PRETE]) prepared++;
                }
            });

            const message = `État pour ${occasion} (${date}):\n\n` +
                `Total: ${total}\n` +
                `Préparées: ${prepared}\n` +
                `En cours: ${inProgress}\n` +
                `Livrées: ${delivered}\n` +
                `Non préparées: ${total - prepared - inProgress - delivered}`;

            ui.alert('État d\'avancement', message, ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

function exportStatistics() {
    const ui = SpreadsheetApp.getUi();

    const result = ui.prompt(
        'Exporter les statistiques',
        'Entrez: Occasion|Date (ex: Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 2) {
            ui.alert('Format invalide');
            return;
        }

        const [occasion, date] = parts.map(s => s.trim());

        try {
            DocumentService.exportStatisticsToSheet(occasion, date);
            ui.alert('Succès', 'Statistiques exportées dans la feuille "Statistiques"', ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}

function showSettings() {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
        'Paramètres',
        'Utilisez le menu pour configurer:\n' +
        '- API & Configuration pour l\'URL et le token\n' +
        '- Contacts pour la synchronisation\n' +
        '- Rafraîchir le cache si nécessaire',
        ui.ButtonSet.OK
    );
}

function generateEtiquettes() {
    const ui = SpreadsheetApp.getUi();
    ui.alert(
        'Fonctionnalité à venir',
        'La génération d\'étiquettes sera disponible prochainement.',
        ui.ButtonSet.OK
    );
}

/**
 * Fonction générique pour afficher les dialogues HTML
 */
function showGenericDialog(action) {
    const occasions = dataService.getOccasions();

    const template = HtmlService.createTemplateFromFile('ui/dialog');
    template.action = action;
    template.occasions = occasions;

    const html = template.evaluate()
        .setWidth(500)
        .setHeight(600);

    SpreadsheetApp.getUi().showModalDialog(html, getTitleFromAction(action));
}

/**
 * Helper pour obtenir le titre selon l'action
 */
function getTitleFromAction(action) {
    const titles = {
        notify: 'Notifier un livreur',
        notifyAll: 'Notifier tous les livreurs',
        generate: 'Générer une fiche',
        generateAll: 'Générer toutes les fiches',
        assign: 'Assigner les livraisons',
        dashboard: 'Générer le tableau de bord',
        routeMap: 'Générer un itinéraire',
        adminReport: 'Envoyer un rapport'
    };
    return titles[action] || 'Action';
}