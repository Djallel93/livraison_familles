/**
 * Service de gestion des contacts Google
 * Crée automatiquement des contacts lors des soumissions de formulaire
 */

const ContactService = (() => {

    /**
     * Crée ou met à jour un contact Google pour une famille
     * @param {Object} familyData - Données de la famille
     * @returns {string} ID du contact créé/mis à jour
     */
    const createOrUpdateContact = (familyData) => {
        try {
            const contactName = `${familyData.prenom} ${familyData.nom}`;

            // Vérifier si le contact existe déjà
            //TODO: by email
            const existingContact = findContactByName(contactName);

            if (existingContact) {
                console.log(`Contact existant trouvé: ${contactName}`);
                return updateExistingContact(existingContact, familyData);
            }

            // Créer un nouveau contact
            return createNewContact(familyData);

        } catch (error) {
            logError(error, 'createOrUpdateContact');
            throw error;
        }
    };

    /**
     * Recherche un contact par nom
     * @param {string} name - Nom complet
     * @returns {Object|null} Contact trouvé ou null
     */
    const findContactByName = (name) => {
        try {
            const contacts = People.People.searchContacts({
                query: name,
                readMask: 'names,phoneNumbers,emailAddresses,addresses'
            });

            if (contacts.results && contacts.results.length > 0) {
                return contacts.results[0].person;
            }

            return null;
        } catch (error) {
            console.warn(`Erreur recherche contact: ${error.message}`);
            return null;
        }
    };

    /**
     * Crée un nouveau contact
     * @param {Object} familyData - Données de la famille
     * @returns {string} Resource name du contact
     */
    const createNewContact = (familyData) => {
        const contactPerson = buildContactObject(familyData);

        const createdContact = People.People.createContact(contactPerson);

        console.log(`✅ Contact créé: ${familyData.prenom} ${familyData.nom}`);
        return createdContact.resourceName;
    };

    /**
     * Met à jour un contact existant
     * @param {Object} existingContact - Contact existant
     * @param {Object} familyData - Nouvelles données
     * @returns {string} Resource name du contact
     */
    const updateExistingContact = (existingContact, familyData) => {
        const resourceName = existingContact.resourceName;
        const contactPerson = buildContactObject(familyData);

        // Fusionner avec les données existantes
        contactPerson.etag = existingContact.etag;

        const updatedContact = People.People.updateContact(
            contactPerson,
            resourceName,
            {
                updatePersonFields: 'phoneNumbers,emailAddresses,addresses,biographies,organizations'
            }
        );

        console.log(`✅ Contact mis à jour: ${familyData.prenom} ${familyData.nom}`);
        return updatedContact.resourceName;
    };

    /**
     * Construit l'objet contact pour l'API Google People
     * @param {Object} familyData - Données de la famille
     * @returns {Object} Objet contact formaté
     */
    const buildContactObject = (familyData) => {
        const contact = {
            names: [{
                givenName: familyData.prenom || '',
                familyName: familyData.nom || '',
                //TODO: displayName: ID - NomFamille
                displayName: `${familyData.prenom || ''} ${familyData.nom || ''}`.trim()
            }]
        };

        // Numéros de téléphone
        const phoneNumbers = [];
        if (familyData.telephone) {
            phoneNumbers.push({
                value: formatNumeroTelephone(familyData.telephone),
                type: 'mobile'
            });
        }
        if (familyData.telephoneBis) {
            phoneNumbers.push({
                value: formatNumeroTelephone(familyData.telephoneBis),
                type: 'home'
            });
        }
        if (phoneNumbers.length > 0) {
            contact.phoneNumbers = phoneNumbers;
        }

        // Email
        if (familyData.email && validateEmail(familyData.email)) {
            contact.emailAddresses = [{
                value: familyData.email,
                type: 'home'
            }];
        }

        // Adresse
        if (familyData.adresse) {
            contact.addresses = [{
                formattedValue: `${familyData.adresse}, ${familyData.codePostal || ''} ${familyData.ville || ''}`.trim(),
                type: 'home',
                streetAddress: familyData.adresse,
                postalCode: familyData.codePostal || '',
                city: familyData.ville || '',
                country: 'France'
            }];
        }

        // Notes / Biographie
        const notes = buildContactNotes(familyData);
        if (notes) {
            contact.biographies = [{
                value: notes,
                contentType: 'TEXT_PLAIN'
            }];
        }

        // Organisation (AMANA)
        contact.organizations = [{
            name: 'AMANA - Bénéficiaire',
            title: 'Famille assistée'
        }];

        return contact;
    };

    /**
     * Construit les notes du contact
     * @param {Object} familyData - Données de la famille
     * @returns {string} Notes formatées
     */
    const buildContactNotes = (familyData) => {
        const notes = [];

        notes.push(`👥 Famille: ${familyData.nom}`);
        //TODO: get ID
        notes.push(`📋 ID: ${familyData.id || 'N/A'}`);

        if (familyData.nombreAdulte) {
            notes.push(`👤 Adultes: ${familyData.nombreAdulte}`);
        }
        if (familyData.nombreEnfant) {
            notes.push(`👶 Enfants: ${familyData.nombreEnfant}`);
        }

        if (familyData.specifites) {
            notes.push(`⚠️ Spécificités: ${familyData.specifites}`);
        }

        notes.push(`\n📅 Ajouté: ${new Date().toLocaleDateString('fr-FR')}`);

        return notes.join('\n');
    };

    /**
     * Crée un contact depuis une soumission de formulaire
     * @param {Object} formResponses - Réponses du formulaire
     */
    const createContactFromForm = (formResponses) => {
        try {
            // Extraire les données du formulaire
            const familyData = {
                nom: formResponses['Nom de famille ']?.[0] || '',
                prenom: formResponses['Prénom de la personne à contacter ']?.[0] || '',
                telephone: formResponses['Numéro de téléphone de la personne à contacter ']?.[0] || '',
                email: formResponses['Email address ']?.[0] || '',
                adresse: formResponses['Adresse ']?.[0] || '',
                nombreAdulte: parseInt(formResponses['Combien d\'adultes vivent actuellement dans votre foyer ? ']?.[0]) || 0,
                nombreEnfant: parseInt(formResponses['Combien d\'enfants vivent actuellement dans votre foyer ? ']?.[0]) || 0,
                circonstances: formResponses['Décrivez brièvement votre situation actuelle ']?.[0] || ''
            };

            // Valider les données minimales
            if (!familyData.nom || !familyData.prenom) {
                //TODO : en cas d'update du formulaire seul les nouveau champs sont transmit. 
                // verifer si la famille existe avec le mail fournit
                console.warn('Nom ou prénom manquant, création de contact ignorée');
                return null;
            }

            if (!familyData.telephone) {
                console.warn('Téléphone manquant, création de contact ignorée');
                return null;
            }

            // Créer le contact
            const resourceName = createOrUpdateContact(familyData);
            console.log(`✅ Contact créé/mis à jour: ${resourceName}`);

            return resourceName;

        } catch (error) {
            logError(error, 'createContactFromForm');
            return null;
        }
    };

    /**
     * Synchronise tous les contacts depuis la feuille Famille
     */
    const syncAllContacts = () => {
        try {
            const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
            let created = 0;
            let failed = 0;

            familleData.forEach(row => {
                try {
                    const famille = DataService.getFamilyDetails(row[SHEET_DEF.FAMILLE.COLS.ID]);
                    if (famille) {
                        createOrUpdateContact(famille);
                        created++;
                    }
                } catch (error) {
                    failed++;
                    console.error(`Erreur sync famille ${row[SHEET_DEF.FAMILLE.COLS.ID]}: ${error.message}`);
                }
            });

            return {
                success: created,
                failed: failed,
                message: `${created} contact(s) synchronisé(s), ${failed} échec(s)`
            };
        } catch (error) {
            logError(error, 'syncAllContacts');
            throw error;
        }
    };

    // Interface publique
    return {
        createOrUpdateContact,
        createContactFromForm,
        syncAllContacts,
        findContactByName
    };
})();