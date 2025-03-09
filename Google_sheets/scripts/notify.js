function notifyAllLivreurs(occasion, dateLivraison) {
    console.log("Notification de tous les livreurs");

    const livraisonData = getSheetDataByName(SHEET_DEF.LIVRAISON.SHEET_NAME);
    const idFamilleColIndex = getColumnIndex("LIVRAISON", "ID_FAMILLE");
    const dateLivraisonColIndex = getColumnIndex("LIVRAISON", "DATE_LIVRAISONS");
    const occasionColIndex = getColumnIndex("LIVRAISON", "OCCASION");
    const livreurColIndex = getColumnIndex("LIVRAISON", "LIVREUR");
    const nbrPartColIndex = getColumnIndex("LIVRAISON", "NOMBRE_PART");
    const avecEnfantColIndex = getColumnIndex("LIVRAISON", "AVEC_ENFANT");

    // Objet pour stocker les infos par livreur
    let livreursData = {};

    livraisonData.forEach(row => {
        if (
            row[occasionColIndex] === occasion
            && row[dateLivraisonColIndex] === dateLivraison
        ) {
            let livreur = row[livreurColIndex];
            let familleObj = {
                id: row[idFamilleColIndex],
                nombre_part: row[nbrPartColIndex],
                avec_enfant: row[avecEnfantColIndex]
            };
            if (!livreursData[livreur]) {
                livreursData[livreur] = {
                    nom: livreur,
                    familles: []
                };
            }
            livreursData[livreur].familles.push(familleObj);
        }
    });

    Object.keys(livreursData).forEach(livreur => {
        notifyLivreur(
            livreursData[livreur].familleObj,
            livreursData[livreur].nom,
            occasion,
            dateLivraison
        );
    });
}


function notifyLivreur(famille, livreur, occasion, dateLivraison) {
    const livreur = getUserDetailsByName(livreur)
    if (!livreur) {
        console.error("Impossible de récupérer les informations du livreur");
        return null;
    }

    const subject = dateLivraison + " - Familles a livrer a - " + occasion;
    let message = `Bonjour ${livreur.nom} ${livreur.prenom},\n\nVoici la liste des familles à livrer pour l'occasion "${occasion}" le ${dateLivraison} :\n\n`;

    livreursData[livreur].familles.forEach(famille => {
        const famille = getFamilyDetails(famille.id);
        if (!famille) {
            console.error("Impossible de récupérer les informations de la famille " + famille.id);
            return null;
        }
        message += `- Famille : ${famille.nom}, 
            ${famille.nombre_part} part(s), 
            ${famille.avec_enfant ?
                "Avec " + famille.nombreEnfant + " enfant(s)" :
                "Sans enfant"}\n`;
    });

    message += "\nMerci pour votre aide !\n\nCordialement,";
    const options = {
        name: "AMANA",
        noReply: true,
    };

    try {
        MailApp.sendEmail(livreur.email, subject, message, options);
    } catch (error) {
        console.error("Échec de l'envoi du mail: " + error.toString());
    }
    return;
}