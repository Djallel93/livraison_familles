/**
 * Service d'accès aux données
 * Centralise toutes les requêtes de données avec cache automatique
 */

class DataService {
    /**
     * Récupère les détails d'une famille par son ID
     * @param {number} idFamille - ID de la famille
     * @returns {Object|null} Détails de la famille ou null
     */
    getFamilyDetails(idFamille) {
        if (typeof idFamille !== 'number') {
            console.error('ID famille invalide:', idFamille);
            return null;
        }

        try {
            const familleData = myCacheService.getCachedSheetData(SHEET_DEF.FAMILLE.SHEET_NAME);
            const familleIdx = getColumnIndex('FAMILLE', 'ID');

            const famille = familleData.find(row => row[familleIdx] === idFamille);

            if (!famille) {
                console.warn(`Famille ${idFamille} introuvable`);
                return null;
            }

            const quartier = this.getQuartierDetails(
                famille[getColumnIndex('FAMILLE', 'ID_QUARTIER')]
            );

            return {
                id: famille[getColumnIndex('FAMILLE', 'ID')],
                nom: famille[getColumnIndex('FAMILLE', 'NOM')],
                prenomContact: famille[getColumnIndex('FAMILLE', 'PRENOM_CONTACT')],
                circonstances: famille[getColumnIndex('FAMILLE', 'CIRCONSTANCES')],
                nombreAdulte: famille[getColumnIndex('FAMILLE', 'NOMBRE_ADULTE')] || 0,
                nombreEnfant: famille[getColumnIndex('FAMILLE', 'NOMBRE_ENFANT')] || 0,
                adresse: famille[getColumnIndex('FAMILLE', 'ADRESSE')],
                codePostal: quartier?.codePostal || '',
                ville: quartier?.ville || '',
                telephone: formatNumeroTelephone(famille[getColumnIndex('FAMILLE', 'TELEPHONE')]),
                telephoneBis: formatNumeroTelephone(famille[getColumnIndex('FAMILLE', 'TELEPHONE_BIS')]),
                se_deplace: famille[getColumnIndex('FAMILLE', 'SE_DEPLACE')],
                etat: famille[getColumnIndex('FAMILLE', 'ETAT')],
                premierContact: famille[getColumnIndex('FAMILLE', 'PREMIER_CONTACT')],
                specifites: famille[getColumnIndex('FAMILLE', 'SPECIFITES')],
                latitude: quartier?.latitude,
                longitude: quartier?.longitude
            };
        } catch (error) {
            logError(error, `getFamilyDetails(${idFamille})`);
            return null;
        }
    }

    /**
     * Récupère les détails d'un livreur par son ID
     * @param {number} id - ID du livreur
     * @returns {Object|null} Détails du livreur ou null
     */
    getLivreurDetailsById(id) {
        if (typeof id !== 'number') {
            console.error('ID livreur invalide:', id);
            return null;
        }

        try {
            const livreurData = myCacheService.getCachedSheetData(SHEET_DEF.LIVREUR.SHEET_NAME);
            const idIndex = getColumnIndex('LIVREUR', 'ID');

            const livreur = livreurData.find(row => row[idIndex] === id);

            if (!livreur) {
                console.warn(`Livreur ${id} introuvable`);
                return null;
            }

            return {
                id: livreur[getColumnIndex('LIVREUR', 'ID')],
                nom: livreur[getColumnIndex('LIVREUR', 'NOM')],
                prenom: livreur[getColumnIndex('LIVREUR', 'PRENOM')],
                email: livreur[getColumnIndex('LIVREUR', 'MAIL')],
                secteur: livreur[getColumnIndex('LIVREUR', 'SECTEUR')],
                responsable: livreur[getColumnIndex('LIVREUR', 'ID_RESPONSABLE')],
                role: livreur[getColumnIndex('LIVREUR', 'ROLE')]
            };
        } catch (error) {
            logError(error, `getLivreurDetailsById(${id})`);
            return null;
        }
    }

    /**
     * Récupère les détails d'un livreur par son email
     * @param {string} email - Email du livreur
     * @returns {Object|null} Détails du livreur ou null
     */
    getLivreurDetailsByEmail(email) {
        if (typeof email !== 'string') {
            console.error('Email invalide:', email);
            return null;
        }

        try {
            const normalizedEmail = email.trim().toLowerCase();
            const livreurData = myCacheService.getCachedSheetData(SHEET_DEF.LIVREUR.SHEET_NAME);
            const mailIndex = getColumnIndex('LIVREUR', 'MAIL');

            const livreur = livreurData.find(row => row[mailIndex]?.toLowerCase() === normalizedEmail);

            if (!livreur) {
                console.warn(`Livreur avec email ${email} introuvable`);
                return null;
            }

            return {
                id: livreur[getColumnIndex('LIVREUR', 'ID')],
                nom: livreur[getColumnIndex('LIVREUR', 'NOM')],
                prenom: livreur[getColumnIndex('LIVREUR', 'PRENOM')],
                email: livreur[mailIndex],
                secteur: livreur[getColumnIndex('LIVREUR', 'SECTEUR')],
                role: livreur[getColumnIndex('LIVREUR', 'ROLE')]
            };
        } catch (error) {
            logError(error, `getLivreurDetailsByEmail(${email})`);
            return null;
        }
    }

    /**
     * Récupère les détails d'un responsable par son ID
     * @param {number} id - ID du responsable
     * @returns {Object|null} Détails du responsable ou null
     */
    getResponsableDetailsById(id) {
        if (typeof id !== 'number') {
            console.error('ID responsable invalide:', id);
            return null;
        }

        try {
            const responsableData = myCacheService.getCachedSheetData(SHEET_DEF.RESPONSABLE.SHEET_NAME);
            const idIndex = getColumnIndex('RESPONSABLE', 'ID');

            const responsable = responsableData.find(row => row[idIndex] === id);

            if (!responsable) {
                console.warn(`Responsable ${id} introuvable`);
                return null;
            }

            return {
                id: responsable[getColumnIndex('RESPONSABLE', 'ID')],
                nom: responsable[getColumnIndex('RESPONSABLE', 'NOM')],
                prenom: responsable[getColumnIndex('RESPONSABLE', 'PRENOM')],
                email: responsable[getColumnIndex('RESPONSABLE', 'MAIL')],
                telephone: formatNumeroTelephone(responsable[getColumnIndex('RESPONSABLE', 'TELEPHONE')]),
                secteur: responsable[getColumnIndex('RESPONSABLE', 'SECTEUR')],
                role: responsable[getColumnIndex('RESPONSABLE', 'ROLE')]
            };
        } catch (error) {
            logError(error, `getResponsableDetailsById(${id})`);
            return null;
        }
    }

    /**
     * Récupère l'email du super admin
     * @returns {string|null} Email du super admin
     */
    getSuperAdminEmail() {
        try {
            const livreurData = myCacheService.getCachedSheetData(SHEET_DEF.LIVREUR.SHEET_NAME);
            const roleIndex = getColumnIndex('LIVREUR', 'ROLE');
            const mailIndex = getColumnIndex('LIVREUR', 'MAIL');

            const superAdmin = livreurData.find(
                row => row[roleIndex]?.toLowerCase() === 'super admin'
            );

            if (!superAdmin) {
                console.error('Super admin introuvable');
                return null;
            }

            return superAdmin[mailIndex];
        } catch (error) {
            logError(error, 'getSuperAdminEmail');
            return null;
        }
    }

    /**
     * Récupère les détails d'un quartier par son ID
     * @param {number} idQuartier - ID du quartier
     * @returns {Object|null} Détails du quartier ou null
     */
    getQuartierDetails(idQuartier) {
        if (typeof idQuartier !== 'number') {
            console.error('ID quartier invalide:', idQuartier);
            return null;
        }

        try {
            const quartierData = myCacheService.getCachedSheetData(SHEET_DEF.QUARTIER.SHEET_NAME);
            const quartierIndex = getColumnIndex('QUARTIER', 'ID');

            const quartier = quartierData.find(row => row[quartierIndex] === idQuartier);

            if (!quartier) {
                console.warn(`Quartier ${idQuartier} introuvable`);
                return null;
            }

            const ville = this.getVilleDetails(quartier[getColumnIndex('QUARTIER', 'ID_VILLE')]);

            return {
                id: quartier[getColumnIndex('QUARTIER', 'ID')],
                nom: quartier[getColumnIndex('QUARTIER', 'NOM')],
                latitude: quartier[getColumnIndex('QUARTIER', 'LATITUDE')],
                longitude: quartier[getColumnIndex('QUARTIER', 'LOGITUDE')],
                ville: ville?.nom || '',
                codePostal: ville?.codePostal || '',
                departement: ville?.departement || '',
                pays: ville?.pays || ''
            };
        } catch (error) {
            logError(error, `getQuartierDetails(${idQuartier})`);
            return null;
        }
    }

    /**
     * Récupère les détails d'une ville par son ID
     * @param {number} idVille - ID de la ville
     * @returns {Object|null} Détails de la ville ou null
     */
    getVilleDetails(idVille) {
        if (typeof idVille !== 'number') {
            console.error('ID ville invalide:', idVille);
            return null;
        }

        try {
            const villeData = myCacheService.getCachedSheetData(SHEET_DEF.VILLE.SHEET_NAME);
            const villeIndex = getColumnIndex('VILLE', 'ID');

            const ville = villeData.find(row => row[villeIndex] === idVille);

            if (!ville) {
                console.warn(`Ville ${idVille} introuvable`);
                return null;
            }

            return {
                id: ville[getColumnIndex('VILLE', 'ID')],
                nom: ville[getColumnIndex('VILLE', 'NOM')],
                codePostal: ville[getColumnIndex('VILLE', 'CODE_POSTAL')],
                departement: ville[getColumnIndex('VILLE', 'DEPARTEMENT')],
                pays: ville[getColumnIndex('VILLE', 'PAYS')]
            };
        } catch (error) {
            logError(error, `getVilleDetails(${idVille})`);
            return null;
        }
    }

    /**
     * Récupère la liste des occasions disponibles
     * @returns {Array<string>} Liste des occasions
     */
    getOccasions() {
        try {
            const auxSheet = getSheetByName(SHEET_DEF.AUX.SHEET_NAME);
            const occasionColIndex = getRealColumnIndex('AUX', 'OCCASION');

            const occasions = auxSheet
                .getRange(2, occasionColIndex, auxSheet.getLastRow() - 1, 1)
                .getValues()
                .flat()
                .filter(val => val && val.toString().trim() !== '');

            return occasions;
        } catch (error) {
            logError(error, 'getOccasions');
            return [];
        }
    }

    /**
     * Valide les données d'une famille
     * @param {Object} familyData - Données de la famille
     * @returns {Object} {valid: boolean, errors: Array<string>}
     */
    validateFamilyData(familyData) {
        const errors = [];

        if (!familyData.nom || familyData.nom.trim() === '') {
            errors.push('Nom manquant');
        }

        if (!validateAddress(familyData.adresse)) {
            errors.push('Adresse invalide ou manquante');
        }

        if (!validatePhoneNumber(familyData.telephone)) {
            errors.push('Numéro de téléphone invalide');
        }

        if (!familyData.nombreAdulte || familyData.nombreAdulte < 1) {
            errors.push('Nombre d\'adultes invalide');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Instance singleton
const dataService = new DataService();