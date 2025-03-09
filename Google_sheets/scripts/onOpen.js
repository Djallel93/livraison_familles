function onOpen() {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu("Fonctions Personnalisées")
        .addItem("Notification des livreurs", "showNotificationDialog")
        .addToUi();
}

function showNotificationDialog() {
    const ui = SpreadsheetApp.getUi();

    // Demande l'occasion
    const occasionResponse = ui.prompt("Notification des livreurs", "Entrez l'occasion :", ui.ButtonSet.OK_CANCEL);
    if (occasionResponse.getSelectedButton() !== ui.Button.OK) return; // Stop si annulé
    const occasion = occasionResponse.getResponseText().trim();

    // Demande la date de livraison
    const dateResponse = ui.prompt("Notification des livreurs", "Entrez la date de livraison (YYYY-MM-DD) :", ui.ButtonSet.OK_CANCEL);
    if (dateResponse.getSelectedButton() !== ui.Button.OK) return; // Stop si annulé
    const dateLivraison = dateResponse.getResponseText().trim();

    // Vérification des entrées
    if (!occasion || !dateLivraison) {
        ui.alert("Erreur", "Veuillez entrer des valeurs valides.", ui.ButtonSet.OK);
        return;
    }

    notifyAllLivreurs(occasion, dateLivraison);

    ui.alert("Succès", "Les notifications ont été envoyées.", ui.ButtonSet.OK);
}