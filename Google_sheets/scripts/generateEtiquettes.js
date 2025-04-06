function generateEtiquettes() {
    // Ouvre le classeur actif et les feuilles
    var sourceSheet = SpreadsheetApp.getActiveSpreadsheet();
    const livraisonSheet = getSheetByName(SHEET_DEF.LIVRAISON.SHEET_NAME);
    var livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);
    var targetSheet = sourceSheet.getSheetByName("Etiquettes");

    // Si la feuille "Etiquettes" n'existe pas, créez-la
    if (!targetSheet) {
        targetSheet = sourceSheet.insertSheet("Etiquettes");
    } else {
        targetSheet.clear(); // Si elle existe déjà, on la vide
    }

    const idFamilleColIndex = getColumnIndex("LIVRAISON", "ID_FAMILLE");
    const nbrPartColIndex = getColumnIndex("LIVRAISON", "NOMBRE_PART");

    let currentRow = 1;
    let currentCol = 1; // On commence à la première colonne

    // Parcours chaque ligne de données
    livraisonData.forEach(row => {
        var idFamille = row[idFamilleColIndex];
        var nombrePart = row[nbrPartColIndex]; // Nombre de parts

        // Crée les étiquettes pour chaque part
        for (var j = 1; j <= nombrePart; j++) {
            // Insère l'ID et la fraction dans la feuille "Etiquettes"
            targetSheet
                .getRange(currentRow, currentCol)
                .setValue(idFamille);
            targetSheet
                .getRange(currentRow, currentCol + 1)
                .setValue(j + "/" + nombrePart);

            // Applique une taille de police
            targetSheet
                .getRange(currentRow, currentCol)
                .setFontSize(100);
            targetSheet
                .getRange(currentRow, currentCol + 1)
                .setFontSize(25);

            // Applique les bordures autour des cellules de l'étiquette
            targetSheet
                .getRange(currentRow, currentCol, 1, 2)
                .setBorder(true, true, true, true, false, false);

            // Ajuste la position pour la prochaine étiquette
            currentCol += 2;  // On passe de 2 colonnes pour chaque étiquette

            // Si on atteint la 6ème colonne, on passe à la ligne suivante
            if (currentCol > 6) {
                currentCol = 1; // On réinitialise la colonne à 1
                currentRow++;    // On passe à la ligne suivante
            }
        }
    });

    // Ajuste la largeur des colonnes pour une meilleure lisibilité
    targetSheet.autoResizeColumns(1, 12);
}