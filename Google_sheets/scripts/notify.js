function notifyAllLivreurs(occasion, dateOccasion) {
    console.log("Notification de tous les livreurs");

    const livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);
    const idLivreurIdx = getColumnIndex("LIVRAISON", "ID_LIVREUR");
    const dateLivraisonColIndex = getColumnIndex("LIVRAISON", "DATE_LIVRAISONS");
    const occasionColIndex = getColumnIndex("LIVRAISON", "OCCASION");
    const livreColIndex = getColumnIndex("LIVRAISON", "LIVRE");
    console.log("dateLivraison recu : " + dateOccasion);


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
                new Date(rawDate).toISOString().split("T")[0] === dateOccasion &&
                row[occasionColIndex] === occasion
            );
        })
        // Keep only unique id_livreur values
        .filter((row, index, self) =>
            index === self.findIndex((r) => r[idLivreurIdx] === row[idLivreurIdx])
        );


    filteredData.forEach(row => {
        console.log("Notification du livreur " + row[idLivreurIdx])
        notifyLivreur(
            row[idLivreurIdx],
            occasion,
            dateOccasion
        );
    });
}

function notifyLivreur(livreurID, occasion, dateOccasion) {

    console.log("Préparation de la notification pour le livreur " + livreurID);
    // Vérifier si les paramètres sont valides
    if (!livreurID || !occasion || !dateOccasion) {
        console.error("Paramètres manquants pour la notification");
        return;
    }

    let formatedLivreurID = Number(livreurID);

    const livreurInfo = getLivreurDetailsById(formatedLivreurID)
    if (!livreurInfo) {
        console.error("Impossible de récupérer les informations du livreur " + livreurID);
        return;
    }

    const responsableInfo = getResponsableDetailsById(livreurInfo.responsable)
    if (!responsableInfo) {
        console.error("Impossible de récupérer les informations du responsable " + livreurInfo.responsable);
        return;
    }

    const livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);
    const idLivreurIdx = getColumnIndex("LIVRAISON", "ID_LIVREUR");
    const idBinomeIdx = getColumnIndex("LIVRAISON", "ID_BINOME");
    const idFamilleColIndex = getColumnIndex("LIVRAISON", "ID_FAMILLE");
    const dateLivraisonColIndex = getColumnIndex("LIVRAISON", "DATE_LIVRAISONS");
    const occasionColIndex = getColumnIndex("LIVRAISON", "OCCASION");
    const nbrPartColIndex = getColumnIndex("LIVRAISON", "NOMBRE_PART");
    const avecEnfantColIndex = getColumnIndex("LIVRAISON", "AVEC_ENFANT");
    const livreColIndex = getColumnIndex("LIVRAISON", "LIVRE");

    const subject = "Familles à livrer - " + occasion;

    let message = `السلام عليكم و رحمة الله و بركاته
        Voici la liste des familles à livrer á l'occasion de '${occasion}'\n\n`;

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
                new Date(rawDate).toISOString().split("T")[0] === dateOccasion &&
                row[occasionColIndex] === occasion
                && idLivreur === formatedLivreurID
            );
        })

        // const binomeInfo = getLivreurDetailsById(filteredData[0][idBinomeIdx])
        // if (!binomeInfo) {
        //     console.error("Impossible de récupérer les informations du livreur " + filteredData[0][idBinomeIdx]);
        //     return;
        // }

    filteredData.forEach(row => {
        let familleInfo = getFamilyDetails(row[idFamilleColIndex]);
        if (!familleInfo) {
            console.error("Impossible de récupérer les informations de la famille " + familleInfo.id);
            return;
        }
        message += `- Famille : ${familleInfo.id}
                    Adresse : ${familleInfo.adresse}, ${familleInfo.codePostal}, ${familleInfo.ville}, 
                    Nombre de part(s) : ${row[nbrPartColIndex]} part(s)
                    ${row[avecEnfantColIndex] ?
                "Avec " + familleInfo.nombreEnfant + " enfant(s)" :
                "Sans enfant"}
                    Numéro Tel: ${familleInfo.telephone ?
                familleInfo.telephone :
                "Inconnu"}
                    ${familleInfo.telephoneBis ?
                "Numéro Tel 2: " + familleInfo.telephoneBis :
                ""}\n`;
    });

    message += "\nMerci de contacter " + responsableInfo.telephone + " après chaque livraison.";

    message += "\nMerci pour votre aide !\n\nبارك الله فيك,";

    const options = {
        name: "AMANA",
        noReply: true,
    };

    console.log("Notification du livreur " + livreurInfo.nom + " " + livreurInfo.prenom);
    // console.log("Notification du binôme " + binomeInfo.nom + " " + binomeInfo.prenom);

    // const destinataires = livreurInfo.email + "," + binomeInfo.email
    try {
        MailApp.sendEmail(livreurInfo.email, subject, message, options);
        console.log("Le mail a été envoyé aux adresses " + destinataires);
    } catch (error) {
        console.error("Échec de l'envoi du mail: " + error.toString());
    }
    return;
}