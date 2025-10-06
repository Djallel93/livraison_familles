/**
 * Gestionnaires de soumission de formulaires
 * Traite les nouvelles familles et livreurs
 */

/**
 * Trigger automatique - Soumission formulaire famille
 * @param {Object} e - Event object from form submission
 */
function onFamilyFormSubmit(e) {
    try {
        console.log('📝 Nouvelle soumission formulaire famille');

        const namedValues = e.namedValues;
        const timestamp = new Date();

        // Extraire les données du formulaire
        const formData = extractFamilyFormData(namedValues);

        // Vérifier si c'est une mise à jour (email existant)
        const existingFamily = findFamilyByEmail(formData.email);

        if (existingFamily) {
            handleFamilyUpdate(existingFamily, formData, namedValues);
        } else {
            handleNewFamily(formData, namedValues, timestamp);
        }

        console.log('✅ Soumission traitée avec succès');

    } catch (error) {
        logError(error, 'onFamilyFormSubmit');
        // Envoyer notification d'erreur à l'admin
        notifyAdminError('Erreur soumission formulaire', error.message);
    }
}

/**
 * Extrait les données du formulaire famille
 */
function extractFamilyFormData(namedValues) {
    return {
        email: getFormValue(namedValues, 'Email address ') || '',
        nom: getFormValue(namedValues, 'Nom de famille ') || '',
        prenom: getFormValue(namedValues, 'Prénom de la personne à contacter ') || '',
        telephone: getFormValue(namedValues, 'Numéro de téléphone de la personne à contacter ') || '',
        adresse: getFormValue(namedValues, 'Adresse ') || '',
        nombreAdulte: parseInt(getFormValue(namedValues, 'Combien d\'adultes vivent actuellement dans votre foyer ? ')) || 0,
        nombreEnfant: parseInt(getFormValue(namedValues, 'Combien d\'enfants vivent actuellement dans votre foyer ? ')) || 0,
        circonstances: getFormValue(namedValues, 'Décrivez brièvement votre situation actuelle ') || '',
        heberge: getFormValue(namedValues, 'Êtes-vous actuellement hébergé(e) par une personne ou une organisation ? ') === 'Oui',
        hebergeDetails: getFormValue(namedValues, 'Par qui êtes-vous hébergé(e) ? ') || '',
        typeIdentite: getFormValue(namedValues, 'Type de pièce d\'identité ') || '',
        identiteUrls: getFormValue(namedValues, 'Justificatif d\'identité ou de résidence ') || '',
        cafUrls: getFormValue(namedValues, 'Attestation de la CAF (paiement et/ou quotient familial) ') || '',
        travaille: getFormValue(namedValues, 'Travaillez-vous actuellement, vous ou votre conjoint(e) ? ') === 'Oui',
        joursTravail: getFormValue(namedValues, 'Combien de jours par semaine travaillez-vous ? ') || '',
        secteurTravail: getFormValue(namedValues, 'Dans quel secteur travaillez-vous ? ') || '',
        autresAides: getFormValue(namedValues, 'Percevez-vous actuellement des aides d\'autres organismes ? ') || '',
        justificatifsRessources: getFormValue(namedValues, 'Veuillez soumettre tous justificatif de ressources ') || ''
    };
}

/**
 * Gère une nouvelle famille
 */
function handleNewFamily(formData, namedValues, timestamp) {
    console.log(`👨‍👩‍👧 Nouvelle famille: ${formData.nom}`);

    // Valider les données minimales
    const validation = validateFamilyData(formData);
    if (!validation.valid) {
        console.warn('Validation échouée:', validation.errors);
        // Marquer comme "À vérifier"
        formData.etatDossier = 'À vérifier';
    } else {
        formData.etatDossier = 'En attente de validation';
    }

    // Géocoder l'adresse pour trouver le quartier
    const quartierInfo = geocodeAndFindQuartier(formData.adresse);
    const idQuartier = quartierInfo ? quartierInfo.id : null;

    // Générer nouvel ID
    const newId = getNextFamilyId();

    // Organiser les documents Drive
    const driveFiles = organizeFamilyDocuments(newId, formData, namedValues);

    // Insérer dans la feuille Famille
    const familleSheet = getSheetByName(SHEET_DEF.FAMILLE.NAME);
    const rowData = [
        newId,
        formData.nom,
        formData.prenom,
        '', // Zakat_el_fitr (à compléter manuellement)
        '', // Sadaqa (à compléter manuellement)
        formData.nombreAdulte,
        formData.nombreEnfant,
        formData.adresse,
        idQuartier,
        false, // se_deplace (par défaut)
        formData.email,
        formData.telephone,
        '', // téléphone_bis (vide au départ)
        driveFiles.identite || '', // Lien vers documents identité
        driveFiles.caf || '', // Lien vers documents CAF
        formData.circonstances,
        '', // ressentit (à compléter par admin)
        '', // spécificités (à compléter par admin)
        formData.etatDossier,
        timestamp
    ];

    familleSheet.appendRow(rowData);

    // Invalider le cache
    invalidateCache(SHEET_DEF.FAMILLE.NAME);

    // Créer le contact Google (si données suffisantes)
    if (formData.nom && formData.prenom && formData.telephone) {
        try {
            ContactService.createOrUpdateContact({
                id: newId,
                ...formData,
                codePostal: quartierInfo?.codePostal || '',
                ville: quartierInfo?.ville || ''
            });
        } catch (error) {
            console.warn('Erreur création contact:', error.message);
        }
    }

    // Notifier les admins
    notifyAdminNewFamily(newId, formData);

    console.log(`✅ Famille ${newId} créée`);
}

/**
 * Gère la mise à jour d'une famille existante
 */
function handleFamilyUpdate(existingFamily, formData, namedValues) {
    console.log(`🔄 Mise à jour famille: ${existingFamily.nom}`);

    const familleSheet = getSheetByName(SHEET_DEF.FAMILLE.NAME);
    const data = familleSheet.getDataRange().getValues();

    // Trouver la ligne de la famille
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        if (data[i][getColumnIndex('FAMILLE', 'EMAIL')] === formData.email) {
            rowIndex = i + 1; // +1 car base 1
            break;
        }
    }

    if (rowIndex === -1) {
        console.error('Famille non trouvée pour mise à jour');
        return;
    }

    const familyId = existingFamily.id;
    const updates = [];

    // Vérifier les changements critiques
    const phoneChanged = formData.telephone !== existingFamily.telephone;
    const addressChanged = formData.adresse !== existingFamily.adresse;
    const documentsChanged = formData.identiteUrls || formData.cafUrls;

    // Mettre à jour téléphone
    if (phoneChanged) {
        updates.push({
            row: rowIndex,
            column: 'TELEPHONE',
            value: formData.telephone
        });
    }

    // Mettre à jour adresse et quartier
    if (addressChanged) {
        const quartierInfo = geocodeAndFindQuartier(formData.adresse);
        updates.push({
            row: rowIndex,
            column: 'ADRESSE',
            value: formData.adresse
        });
        if (quartierInfo) {
            updates.push({
                row: rowIndex,
                column: 'ID_QUARTIER',
                value: quartierInfo.id
            });
        }
    }

    // Mettre à jour circonstances
    if (formData.circonstances) {
        updates.push({
            row: rowIndex,
            column: 'CIRCONSTANCES',
            value: formData.circonstances
        });
    }

    // Si documents changés -> remettre en validation
    if (documentsChanged) {
        const driveFiles = organizeFamilyDocuments(familyId, formData, namedValues);

        if (driveFiles.identite) {
            updates.push({
                row: rowIndex,
                column: 'IDENTITE',
                value: driveFiles.identite
            });
        }

        if (driveFiles.caf) {
            updates.push({
                row: rowIndex,
                column: 'CAF',
                value: driveFiles.caf
            });
        }

        updates.push({
            row: rowIndex,
            column: 'ETAT_DOSSIER',
            value: 'En attente de validation'
        });
    }

    // Appliquer les mises à jour
    if (updates.length > 0) {
        updateCells(SHEET_DEF.FAMILLE.NAME, updates);
        invalidateCache(SHEET_DEF.FAMILLE.NAME);
    }

    // Mettre à jour le contact si nécessaire
    if (phoneChanged || addressChanged) {
        try {
            ContactService.createOrUpdateContact({
                id: familyId,
                ...formData,
                ...existingFamily
            });
        } catch (error) {
            console.warn('Erreur mise à jour contact:', error.message);
        }
    }

    // Notifier admin si changements importants
    if (documentsChanged) {
        notifyAdminFamilyUpdate(familyId, 'Nouveaux documents soumis');
    }

    console.log(`✅ Famille ${familyId} mise à jour`);
}

/**
 * Trigger automatique - Soumission formulaire livreur
 */
function onDriverFormSubmit(e) {
    try {
        console.log('🚚 Nouvelle soumission formulaire livreur');

        const namedValues = e.namedValues;

        // Extraire données (adapter selon votre formulaire livreur)
        const driverData = {
            nom: getFormValue(namedValues, 'Nom') || '',
            prenom: getFormValue(namedValues, 'Prénom') || '',
            email: getFormValue(namedValues, 'Email') || '',
            telephone: getFormValue(namedValues, 'Numéro de téléphone ') || '',
            typeVehicule: getFormValue(namedValues, 'Quel type de véhicule possédez-vous ? ') || '',
            secteur: getFormValue(namedValues, 'Secteur') || ''
        };

        // Vérifier si livreur existe déjà
        const existing = findDriverByEmail(driverData.email);
        if (existing) {
            console.log('Livreur déjà enregistré');
            return;
        }

        // Générer nouvel ID
        const newId = getNextDriverId();

        // Trouver secteur
        const secteurId = findSecteurByName(driverData.secteur);

        // Insérer dans feuille Livreur
        const livreurSheet = getSheetByName(SHEET_DEF.LIVREUR.NAME);
        livreurSheet.appendRow([
            newId,
            driverData.nom,
            driverData.prenom,
            driverData.email,
            driverData.telephone,
            driverData.typeVehicule,
            secteurId,
            null // id_responsable (à assigner manuellement)
        ]);

        invalidateCache(SHEET_DEF.LIVREUR.NAME);

        // Notifier admin
        notifyAdminNewDriver(newId, driverData);

        console.log(`✅ Livreur ${newId} créé`);

    } catch (error) {
        logError(error, 'onDriverFormSubmit');
        notifyAdminError('Erreur soumission livreur', error.message);
    }
}

/**
 * Helper: Récupère valeur de formulaire
 */
function getFormValue(namedValues, questionKey) {
    // Chercher la clé exacte ou une clé contenant le texte
    for (const key in namedValues) {
        if (key.includes(questionKey) || questionKey.includes(key)) {
            return namedValues[key][0];
        }
    }
    return null;
}

/**
 * Trouve une famille par email
 */
function findFamilyByEmail(email) {
    if (!email) return null;

    const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
    const emailIndex = getColumnIndex('FAMILLE', 'EMAIL');
    const idIndex = getColumnIndex('FAMILLE', 'ID');

    const famille = familleData.find(row =>
        row[emailIndex]?.toLowerCase() === email.toLowerCase()
    );

    if (!famille) return null;

    return dataService.getFamilyDetails(famille[idIndex]);
}

/**
 * Génère le prochain ID famille
 */
function getNextFamilyId() {
    const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
    const idIndex = getColumnIndex('FAMILLE', 'ID');

    let maxId = 0;
    familleData.forEach(row => {
        const id = row[idIndex];
        if (typeof id === 'number' && id > maxId) {
            maxId = id;
        }
    });

    return maxId + 1;
}

/**
 * Génère le prochain ID livreur
 */
function getNextDriverId() {
    const livreurData = getCachedSheetData(SHEET_DEF.LIVREUR.NAME);
    const idIndex = getColumnIndex('LIVREUR', 'ID');

    let maxId = 0;
    livreurData.forEach(row => {
        const id = row[idIndex];
        if (typeof id === 'number' && id > maxId) {
            maxId = id;
        }
    });

    return maxId + 1;
}

/**
 * Trouve un livreur par email
 */
function findDriverByEmail(email) {
    return dataService.getLivreurDetailsByEmail(email);
}

/**
 * Trouve un secteur par nom
 */
function findSecteurByName(nom) {
    if (!nom) return null;

    const secteurData = getCachedSheetData(SHEET_DEF.SECTEUR.NAME);
    const nomIndex = getColumnIndex('SECTEUR', 'NOM');
    const idIndex = getColumnIndex('SECTEUR', 'ID');

    const secteur = secteurData.find(row =>
        row[nomIndex]?.toLowerCase() === nom.toLowerCase()
    );

    return secteur ? secteur[idIndex] : null;
}

/**
 * Notifie admin nouvelle famille
 */
function notifyAdminNewFamily(familyId, formData) {
    const adminEmail = dataService.getSuperAdminEmail();
    if (!adminEmail) return;

    const subject = `📝 Nouvelle famille enregistrée #${familyId}`;
    const body = `Une nouvelle famille a été enregistrée:\n\n` +
        `ID: ${familyId}\n` +
        `Nom: ${formData.nom}\n` +
        `Contact: ${formData.prenom}\n` +
        `Téléphone: ${formData.telephone}\n` +
        `Email: ${formData.email}\n` +
        `Adultes: ${formData.nombreAdulte}\n` +
        `Enfants: ${formData.nombreEnfant}\n` +
        `Statut: ${formData.etatDossier}\n\n` +
        `Vérifiez les documents et validez le dossier.`;

    MailApp.sendEmail(adminEmail, subject, body);
}

/**
 * Notifie admin mise à jour famille
 */
function notifyAdminFamilyUpdate(familyId, message) {
    const adminEmail = dataService.getSuperAdminEmail();
    if (!adminEmail) return;

    const subject = `🔄 Mise à jour famille #${familyId}`;
    const body = `La famille #${familyId} a été mise à jour:\n\n${message}`;

    MailApp.sendEmail(adminEmail, subject, body);
}

/**
 * Notifie admin nouveau livreur
 */
function notifyAdminNewDriver(driverId, driverData) {
    const adminEmail = dataService.getSuperAdminEmail();
    if (!adminEmail) return;

    const subject = `🚚 Nouveau livreur enregistré #${driverId}`;
    const body = `Un nouveau livreur s'est inscrit:\n\n` +
        `ID: ${driverId}\n` +
        `Nom: ${driverData.nom} ${driverData.prenom}\n` +
        `Email: ${driverData.email}\n` +
        `Téléphone: ${driverData.telephone}\n` +
        `Véhicule: ${driverData.typeVehicule}\n` +
        `Secteur: ${driverData.secteur}`;

    MailApp.sendEmail(adminEmail, subject, body);
}

/**
 * Notifie admin en cas d'erreur
 */
function notifyAdminError(context, errorMessage) {
    const adminEmail = dataService.getSuperAdminEmail();
    if (!adminEmail) return;

    const subject = `⚠️ Erreur système: ${context}`;
    const body = `Une erreur s'est produite:\n\n${errorMessage}`;

    MailApp.sendEmail(adminEmail, subject, body);
}