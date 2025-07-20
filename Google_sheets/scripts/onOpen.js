function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("Fonctions Personnalisées")
        .addItem("Création des étiquettes", "generateEtiquettes")
        .addSubMenu(
            ui
                .createMenu("Fiches")
                .addItem("Création de toutes les fiches", "showNotificationDialogGenerateAll")
                .addItem("Création d'une fiche pour un livreur", "showNotificationDialogGenerate")
        )
        .addSubMenu(
            ui
                .createMenu("Notification")
                .addItem("Notification de tous les livreurs", "showNotificationDialogNotifyAll")
                .addItem("Notification d'un livreur", "showNotificationDialogNotify")
        )
        .addToUi();
}

// Open dialog for notifications
function showNotificationDialogNotify() {
    showNotificationDialog("notify");
}

function showNotificationDialogNotifyAll() {
    showNotificationDialog("notifyAll");
}

// Open dialog for document generation
function showNotificationDialogGenerate() {
    showNotificationDialog("generate");
}

function showNotificationDialogGenerateAll() {
    showNotificationDialog("generateAll");
}

// Generalized function to load the form
function showNotificationDialog(action) {
    const ui = SpreadsheetApp.getUi();
    const sheet = getSheetByName(SHEET_DEF.AUX.SHEET_NAME);

    // Get occasions from the sheet
    const occasions = sheet.getRange("B2:B" + sheet.getLastRow()).getValues()
        .flat()
        .filter(val => val);

    if (occasions.length === 0) {
        ui.alert("Erreur", "Aucune occasion disponible.", ui.ButtonSet.OK);
        return;
    }

    // Pass data to the HTML file
    let htmlTemplate = HtmlService.createTemplateFromFile("dialog");
    htmlTemplate.occasions = occasions;
    htmlTemplate.action = action; // Pass the action ("notify" or "generate")

    let htmlOutput = htmlTemplate.evaluate()
        .setWidth(400)
        .setHeight(400);

    ui.showModalDialog(htmlOutput, "Sélectionnez une occasion et une date");
}


// TODO: Manual function to process all existing submissions (optional)

/*
function processAllSubmissions() {
    try {
        const sheet = SpreadsheetApp.getActiveSheet();
        const data = sheet.getDataRange().getValues();
        const rows = data.slice(1); // Skip header row

        rows.forEach((row, index) => {
            try {
                console.log(`Processing row ${index + 2}...`);
                processFormSubmission(row);
            } catch (error) {
                console.error(`Error processing row ${index + 2}:`, error);
            }
        });

        console.log(`Processed ${rows.length} submissions`);
    } catch (error) {
        console.error('Error in processAllSubmissions:', error);
    }
}
*/