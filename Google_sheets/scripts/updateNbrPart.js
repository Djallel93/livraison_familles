function updateNbrPart(currSheet, range) {
    // Vérifier si on est sur la feuille des livraisons
    const currSheetName = currSheet.getName();
    const livraisonSheetName = SHEET_DEF.LIVRAISON.SHEET_NAME

    console.log("Page reçu par updateNbrPart() : " + currSheetName);
    if (currSheetName != livraisonSheetName) return;

    console.log("La page " + livraisonSheetName + " a été modifiée");
    var column = range.getColumn();
    var row = range.getRow();

    // Vérifier si l'ID Famille (colonne A) est modifié
    if ((column !== 1 || row == 1) && !idFamille) return;

    var idFamille = range.getValue();
    console.log("Nouvel idFamille " + idFamille);

    const famille = getFamilyDetails(idFamille);

    console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA");
    if (!famille) return;
    var nombrePart = famille.nombreAdulte + famille.nombreEnfant;
    console.log("La famille " + famille.nom + " existe dans la feuille " + SHEET_DEF.FAMILLE.SHEET_NAME + ". Mise a jour en cours");

    getSheetByName(livraisonSheetName)
        .getRange(row, getRealColumnIndex("LIVRAISON", "NOMBRE_PART"))
        .setValue(nombrePart);
    console.log(nombrePart + " part(s) ont été attribuée(s)");

    if (famille.nombreEnfant > 0) {
        getSheetByName(livraisonSheetName)
            .getRange(row, getRealColumnIndex("LIVRAISON", "AVEC_ENFANT"))
            .setValue(true);
        console.log("Cette famille possède " + famille.nombreEnfant + " enfant(s)");
    }
}
