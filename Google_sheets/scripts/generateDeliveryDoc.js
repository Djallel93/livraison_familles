function generateAllDeliveryDoc(occasion, dateLivraison) {
    const livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);

    const idLivreurIdx = getColumnIndex("LIVRAISON", "ID_LIVREUR");
    const dateLivraisonColIndex = getColumnIndex("LIVRAISON", "DATE_LIVRAISONS");
    const occasionColIndex = getColumnIndex("LIVRAISON", "OCCASION");
    const livreColIndex = getColumnIndex("LIVRAISON", "LIVRE");

    const filteredData = livraisonData
        .filter((row) => {
            const rawDate = row[dateLivraisonColIndex];
            const idLivreur = row[idLivreurIdx];

            // Ignore rows with empty id_livreur
            if (!idLivreur) return false;

            // Ensure the date is valid
            if (!rawDate || isNaN(new Date(rawDate))) return false;

            if (row[livreColIndex] === true) return false;

            return (
                new Date(rawDate).toISOString().split("T")[0] === dateLivraison &&
                row[occasionColIndex] === occasion
            );
        })
        // Keep only unique id_livreur values
        .filter((row, index, self) =>
            index === self.findIndex((r) => r[idLivreurIdx] === row[idLivreurIdx])
        );

    filteredData.forEach(row => {
        console.log("Notification du livreur " + row[idLivreurIdx])
        generateDeliveryDoc(
            row[idLivreurIdx],
            occasion,
            dateLivraison
        );
    });

    console.log("Google Doc généré : " + doc.getUrl());
    return doc.getUrl();
}

function generateDeliveryDoc(livreurID, occasion, dateLivraison) {
    // Vérifier si les paramètres sont valides
    if (!livreurID || !occasion || !dateLivraison) {
        console.error("Paramètres manquants pour la notification");
        return;
    }

    let formatedLivreurID = Number(livreurID);

    const livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);

    const idLivreurIdx = getColumnIndex("LIVRAISON", "ID_LIVREUR");
    const dateLivraisonColIndex = getColumnIndex("LIVRAISON", "DATE_LIVRAISONS");
    const occasionColIndex = getColumnIndex("LIVRAISON", "OCCASION");
    const livreColIndex = getColumnIndex("LIVRAISON", "LIVRE");

    const filteredData = livraisonData
        .filter((row) => {
            const rawDate = row[dateLivraisonColIndex];
            const idLivreur = row[idLivreurIdx];

            // Ignore rows with empty id_livreur
            if (!idLivreur) return false;

            // Ensure the date is valid
            if (!rawDate || isNaN(new Date(rawDate))) return false;

            if (row[livreColIndex] === true) return false;

            return (
                new Date(rawDate).toISOString().split("T")[0] === dateLivraison &&
                row[occasionColIndex] === occasion
                && idLivreur === formatedLivreurID
            );
        })

    const doc = createLivreurTable(filteredData);

    console.log("Google Doc généré : " + doc.getUrl());
    return doc.getUrl();
}

function createLivreurTable(livraisonData) {
    const idLivreurIdx = getColumnIndex("LIVRAISON", "ID_LIVREUR");
    const idFamilleColIndex = getColumnIndex("LIVRAISON", "ID_FAMILLE");
    const nbrPartColIndex = getColumnIndex("LIVRAISON", "NOMBRE_PART");

    const livreurInfo = getLivreurDetailsById(livraisonData[0][idLivreurIdx])
    if (!livreurInfo) {
        console.error("Impossible de récupérer les informations du livreur " + livreurID);
        return null;
    }
    console.log("Création de la fiche du livreur " + livreurInfo.nom + " " + livreurInfo.prenom);
    const docName = `Livraisons - ${livreurInfo.nom} ${livreurInfo.prenom}`;

    const doc = DocumentApp.create(docName);
    const body = doc.getBody();

    body
        .appendParagraph(`📌 ${livreurInfo.nom} ${livreurInfo.prenom}`)
        .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    body.appendParagraph("\n");
    body.appendParagraph("\n");

    console.log("Préparation du tableau");
    let tableData = [
        ["ID", "Nom", "Nombre de parts", "Avec/Sans enfant", "Tél.", "Tél. Bis"]
    ];
    livraisonData.forEach((row) => {

        const familleInfo = getFamilyDetails(row[idFamilleColIndex]);
        if (!familleInfo) {
            console.error("Impossible de récupérer les informations de la famille " + famille.id);
            return;
        }

        tableData.push([
            Number(row[idFamilleColIndex]).toFixed(0),
            familleInfo.nom,
            // `${familleInfo.adresse}, ${familleInfo.codePostal}, ${familleInfo.ville}`,
            Number(row[nbrPartColIndex]).toFixed(0),
            (familleInfo.nombreEnfant > 0) ? `${familleInfo.nombreEnfant} enfant(s)` : "Sans enfant",
            familleInfo.telephone || "Inconnu",
            familleInfo.telephoneBis || ""
        ]);
    });

    // Ajouter le tableau au document
    const table = body.appendTable(tableData);
    table.getRow(0).editAsText().setBold(true);

    body.appendParagraph("\n");

    return doc;
}