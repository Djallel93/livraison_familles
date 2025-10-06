/**
 * Service de gestion des fichiers Google Drive
 * Organise les documents des familles dans des dossiers structurés
 */

const DriveService = (() => {

    /**
     * Organise les documents d'une famille
     * @param {number} familyId - ID de la famille
     * @param {Object} formData - Données du formulaire
     * @param {Object} namedValues - Valeurs nommées du formulaire
     * @returns {Object} Liens vers les dossiers organisés
     */
    const organizeFamilyDocuments = (familyId, formData, namedValues) => {
        try {
            // Récupérer le dossier racine depuis config
            const rootFolderId = PropertiesService.getScriptProperties()
                .getProperty('DRIVE_ROOT_FOLDER_ID');

            if (!rootFolderId) {
                console.warn('Dossier racine Drive non configuré');
                return { identite: null, caf: null };
            }

            const rootFolder = DriveApp.getFolderById(rootFolderId);

            // Créer la structure: Familles / Famille_{ID}_{Nom}
            const familiesFolder = createOrGetFolder(rootFolder, 'Familles');
            const familyFolderName = `Famille_${familyId}_${formData.nom}`;
            const familyFolder = createOrGetFolder(familiesFolder, familyFolderName);

            // Sous-dossiers
            const identiteFolder = createOrGetFolder(familyFolder, 'Identité');
            const cafFolder = createOrGetFolder(familyFolder, 'CAF');
            const autresFolder = createOrGetFolder(familyFolder, 'Autres');

            const result = {
                identite: null,
                caf: null,
                autres: null
            };

            // Organiser documents d'identité
            const identiteUrls = extractFileUrls(formData.identiteUrls);
            if (identiteUrls.length > 0) {
                organizeFiles(identiteUrls, identiteFolder, 'Identité');
                result.identite = identiteFolder.getUrl();
            }

            // Organiser documents CAF
            const cafUrls = extractFileUrls(formData.cafUrls);
            if (cafUrls.length > 0) {
                organizeFiles(cafUrls, cafFolder, 'CAF');
                result.caf = cafFolder.getUrl();
            }

            // Organiser autres justificatifs
            const autresUrls = extractFileUrls(formData.justificatifsRessources);
            if (autresUrls.length > 0) {
                organizeFiles(autresUrls, autresFolder, 'Justificatif');
                result.autres = autresFolder.getUrl();
            }

            console.log(`✅ Documents organisés pour famille ${familyId}`);
            return result;

        } catch (error) {
            logError(error, 'organizeFamilyDocuments');
            return { identite: null, caf: null, autres: null };
        }
    };

    /**
     * Organise des fichiers dans un dossier
     * @param {Array<string>} fileUrls - URLs des fichiers
     * @param {Folder} targetFolder - Dossier cible
     * @param {string} prefix - Préfixe pour nommer les fichiers
     */
    const organizeFiles = (fileUrls, targetFolder, prefix) => {
        fileUrls.forEach((url, index) => {
            try {
                const fileId = extractFileIdFromUrl(url);
                if (!fileId) {
                    console.warn(`ID fichier non trouvé: ${url}`);
                    return;
                }

                const file = DriveApp.getFileById(fileId);
                const extension = getFileExtension(file.getName());
                const newName = `${prefix}_${index + 1}${extension}`;

                // Créer une copie dans le dossier cible
                const copiedFile = file.makeCopy(newName, targetFolder);

                console.log(`Fichier copié: ${newName}`);

            } catch (error) {
                console.warn(`Erreur copie fichier ${url}: ${error.message}`);
            }
        });
    };

    /**
     * Configure le dossier racine Drive
     * @param {string} folderId - ID du dossier racine
     */
    const setRootFolder = (folderId) => {
        try {
            // Vérifier que le dossier existe
            const folder = DriveApp.getFolderById(folderId);

            PropertiesService.getScriptProperties()
                .setProperty('DRIVE_ROOT_FOLDER_ID', folderId);

            console.log(`Dossier racine configuré: ${folder.getName()}`);
            return true;

        } catch (error) {
            logError(error, 'setRootFolder');
            return false;
        }
    };

    /**
     * Crée la structure de dossiers initiale
     */
    const createInitialStructure = () => {
        try {
            const rootFolderId = PropertiesService.getScriptProperties()
                .getProperty('DRIVE_ROOT_FOLDER_ID');

            if (!rootFolderId) {
                throw new Error('Dossier racine non configuré');
            }

            const rootFolder = DriveApp.getFolderById(rootFolderId);

            // Créer les dossiers principaux
            createOrGetFolder(rootFolder, 'Familles');
            createOrGetFolder(rootFolder, 'Livraisons');
            createOrGetFolder(rootFolder, 'Documents_générés');
            createOrGetFolder(rootFolder, 'Archives');

            console.log('✅ Structure de dossiers créée');
            return true;

        } catch (error) {
            logError(error, 'createInitialStructure');
            return false;
        }
    };

    /**
     * Archive les documents d'une livraison
     * @param {string} occasion - Nom de l'occasion
     * @param {string} date - Date de livraison
     */
    const archiveDeliveryDocuments = (occasion, date) => {
        try {
            const rootFolderId = PropertiesService.getScriptProperties()
                .getProperty('DRIVE_ROOT_FOLDER_ID');

            if (!rootFolderId) return;

            const rootFolder = DriveApp.getFolderById(rootFolderId);
            const livraisons = createOrGetFolder(rootFolder, 'Livraisons');
            const archives = createOrGetFolder(rootFolder, 'Archives');

            const deliveryFolderName = `${occasion}_${date}`;
            const deliveryFolders = livraisons.getFoldersByName(deliveryFolderName);

            if (deliveryFolders.hasNext()) {
                const deliveryFolder = deliveryFolders.next();
                const archivedName = `${deliveryFolderName}_archivé_${new Date().getTime()}`;

                // Créer copie dans archives
                const archivedFolder = deliveryFolder.makeCopy(archivedName, archives);

                // Supprimer l'original
                deliveryFolder.setTrashed(true);

                console.log(`Documents archivés: ${deliveryFolderName}`);
            }

        } catch (error) {
            logError(error, 'archiveDeliveryDocuments');
        }
    };

    /**
     * Nettoie les anciens fichiers temporaires
     * @param {number} daysOld - Nombre de jours
     */
    const cleanupOldTemporaryFiles = (daysOld = 30) => {
        try {
            const rootFolderId = PropertiesService.getScriptProperties()
                .getProperty('DRIVE_ROOT_FOLDER_ID');

            if (!rootFolderId) return 0;

            const rootFolder = DriveApp.getFolderById(rootFolderId);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);

            let deletedCount = 0;

            // Parcourir les fichiers
            const files = rootFolder.getFiles();
            while (files.hasNext()) {
                const file = files.next();
                const lastUpdated = file.getLastUpdated();

                if (lastUpdated < cutoffDate && file.getName().includes('temp')) {
                    file.setTrashed(true);
                    deletedCount++;
                }
            }

            console.log(`${deletedCount} fichiers temporaires supprimés`);
            return deletedCount;

        } catch (error) {
            logError(error, 'cleanupOldTemporaryFiles');
            return 0;
        }
    };

    /**
     * Récupère les statistiques d'utilisation Drive
     */
    const getDriveUsageStats = () => {
        try {
            const rootFolderId = PropertiesService.getScriptProperties()
                .getProperty('DRIVE_ROOT_FOLDER_ID');

            if (!rootFolderId) {
                return null;
            }

            const rootFolder = DriveApp.getFolderById(rootFolderId);

            const stats = {
                totalFiles: 0,
                totalFolders: 0,
                totalSize: 0,
                byType: {}
            };

            // Fonction récursive pour compter
            const countRecursive = (folder) => {
                const files = folder.getFiles();
                while (files.hasNext()) {
                    const file = files.next();
                    stats.totalFiles++;
                    stats.totalSize += file.getSize();

                    const mimeType = file.getMimeType();
                    if (!stats.byType[mimeType]) {
                        stats.byType[mimeType] = 0;
                    }
                    stats.byType[mimeType]++;
                }

                const subFolders = folder.getFolders();
                while (subFolders.hasNext()) {
                    stats.totalFolders++;
                    countRecursive(subFolders.next());
                }
            };

            countRecursive(rootFolder);

            // Convertir taille en MB
            stats.totalSizeMB = (stats.totalSize / (1024 * 1024)).toFixed(2);

            return stats;

        } catch (error) {
            logError(error, 'getDriveUsageStats');
            return null;
        }
    };

    // Interface publique
    return {
        organizeFamilyDocuments,
        organizeFiles,
        setRootFolder,
        createInitialStructure,
        archiveDeliveryDocuments,
        cleanupOldTemporaryFiles,
        getDriveUsageStats
    };
})();