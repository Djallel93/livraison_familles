function getQuartierDetails(id_quartier) {
    if (typeof id_quartier !== "number") {
        console.error("Paramètres invalides fournis à getQuartierDetails");
        return null;
    }
    const quartierData = getSheetDataByName(SHEET_DEF.QUARTIER.SHEET_NAME);
    const quartierIndex = getColumnIndex("QUARTIER", "ID");
    const quartier = quartierData.find((row) => row[quartierIndex] === id_quartier);

    if (quartier) {
        console.log(`Le quartier ${id_quartier} existe dans la feuille quartier`);

        let ville = getVilleDetails(quartier[getColumnIndex("QUARTIER", "ID_VILLE")]);
        return {
            id: quartier[getColumnIndex("QUARTIER", "ID")],
            nom: quartier[getColumnIndex("QUARTIER", "NOM")],
            latitude: quartier[getColumnIndex("QUARTIER", "LATITUDE")],
            logitude: quartier[getColumnIndex("QUARTIER", "LOGITUDE")],
            ville: ville.nom,
            codePostal: ville.codePostal,
            departement: ville.departement,
            pays: ville.pays,
        };
    }
}

function getVilleDetails(id_ville) {
    if (typeof id_ville !== "number") {
        console.error("Paramètres invalides fournis à getVilleDetails");
        return null;
    }
    const villeData = getSheetDataByName(SHEET_DEF.VILLE.SHEET_NAME);
    const villeIndex = getColumnIndex("VILLE", "ID");
    const ville = villeData.find((row) => row[villeIndex] === id_ville);

    if (ville) {
        return {
            id: ville[getColumnIndex("VILLE", "ID")],
            nom: ville[getColumnIndex("VILLE", "NOM")],
            codePostal: ville[getColumnIndex("VILLE", "CODE_POSTAL")],
            departement: ville[getColumnIndex("VILLE", "DEPARTEMENT")],
            pays: ville[getColumnIndex("VILLE", "PAYS")],
        };
    }
}