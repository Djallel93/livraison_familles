function getFamilyDetails(idFamille){
    if (typeof idFamille !== "number") {
        console.error("Paramètres invalides fournis à getFamilyDetails");
        return null;
    }

    const familleData = getSheetDataByName(SHEET_DEF.FAMILLE.SHEET_NAME);
    const familleIdx = getColumnIndex("FAMILLE", "ID");

    const famille = familleData.find((row) => row[familleIdx] === idFamille);

    if (famille) {
        console.log(`La famille ${idFamille} existe dans la feuille famille`);
        return {
            id: famille[getColumnIndex("FAMILLE", "ID")],
            nom: famille[getColumnIndex("FAMILLE", "NOM")],
            prenomContact: famille[getColumnIndex("FAMILLE", "PRENOM_CONTACT")],
            circonstances: famille[getColumnIndex("FAMILLE", "CIRCONSTANCES")],
            nombreAdulte: famille[getColumnIndex("FAMILLE", "NOMBRE_ADULTE")],
            nombreEnfant: famille[getColumnIndex("FAMILLE", "NOMBRE_ENFANT")],
            adresse: famille[getColumnIndex("FAMILLE", "ADRESSE")],
            idQuartier: famille[getColumnIndex("FAMILLE", "ID_QUARTIER")],
            telephone: formatNumeroTelephone(famille[getColumnIndex("FAMILLE", "TELEPHONE")]),
            accepteDenrées: famille[getColumnIndex("FAMILLE", "ACCEPTE_DENRÉES")],
            etat: famille[getColumnIndex("FAMILLE", "ETAT")],
            premierContact: famille[getColumnIndex("FAMILLE", "PREMIER_CONTACT")],
            specifites: famille[getColumnIndex("FAMILLE", "SPECIFITES")],
        };
    }

    console.error(`La famille ${id} n'existe pas dans la feuille famille`);
    return null;
}

function formatNumeroTelephone(numero) {
    // Convertir le nombre en chaîne de caractères
    var numeroString = numero.toString();
    console.log("String : " + numeroString);
    console.log("length : " + numeroString.length);

    // Vérifier si la longueur du numéro est correcte
    if (numeroString.length !== 9) {
        throw new Error("Le numéro doit comporter 9 chiffres.");
    }

    // Formater le numéro de téléphone
    var numeroFormate =
        "+33 (0) " +
        numeroString.substr(0, 1) +
        " " +
        numeroString.substr(1, 2) +
        " " +
        numeroString.substr(3, 2) +
        " " +
        numeroString.substr(5, 2) +
        " " +
        numeroString.substr(7, 2);

    return numeroFormate;
}