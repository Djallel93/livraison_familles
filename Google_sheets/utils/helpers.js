/**
 * Fonctions utilitaires générales
 * Format de données, validation, formatage
 */

/**
 * Formate un numéro de téléphone au format français
 * @param {string|number} numero - Numéro à formater
 * @returns {string|null} Numéro formaté ou null
 */
function formatNumeroTelephone(numero) {
    if (!numero) return null;

    const numeroString = numero.toString().replace(/\D/g, '');

    // Vérifier la longueur (9 chiffres attendus)
    if (numeroString.length !== 9) {
        console.warn(`Numéro de téléphone invalide: ${numero} (longueur: ${numeroString.length})`);
        return numero.toString(); // Retourner le numéro original si invalide
    }

    // Formater: +33 X XX XX XX XX
    return `+33 ${numeroString.substr(0, 1)} ${numeroString.substr(1, 2)} ${numeroString.substr(3, 2)} ${numeroString.substr(5, 2)} ${numeroString.substr(7, 2)}`;
}

/**
 * Formate une date pour l'affichage
 * @param {string|Date} dateString - Date à formater
 * @returns {string} Date formatée
 */
function formatDate(dateString) {
    const date = dateString instanceof Date ? dateString : new Date(dateString);

    if (isNaN(date.getTime())) {
        console.warn(`Date invalide: ${dateString}`);
        return dateString.toString();
    }

    return date.toLocaleDateString(
        CONFIG.DATE_FORMAT.locale,
        CONFIG.DATE_FORMAT.options
    );
}

/**
 * Formate une date au format ISO (YYYY-MM-DD)
 * @param {Date} date - Date à formater
 * @returns {string} Date au format ISO
 */
function formatDateISO(date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        console.warn(`Date invalide pour formatage ISO: ${date}`);
        return null;
    }

    return date.toISOString().split('T')[0];
}

/**
 * Valide un numéro de téléphone
 * @param {string} phone - Numéro à valider
 * @returns {boolean} True si valide
 */
function validatePhoneNumber(phone) {
    if (!phone) return false;

    const cleaned = phone.toString().replace(/\D/g, '');
    return cleaned.length === 9 || cleaned.length === 10;
}

/**
 * Valide une adresse email
 * @param {string} email - Email à valider
 * @returns {boolean} True si valide
 */
function validateEmail(email) {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Valide une adresse postale
 * @param {string} address - Adresse à valider
 * @returns {boolean} True si valide
 */
function validateAddress(address) {
    return address && address.trim().length > 5;
}

/**
 * Calcule la distance entre deux coordonnées GPS (formule de Haversine)
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @returns {number} Distance en kilomètres
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) {
        return Infinity;
    }

    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Convertit des degrés en radians
 * @param {number} degrees - Degrés
 * @returns {number} Radians
 */
function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Crée ou récupère un dossier Google Drive
 * @param {GoogleAppsScript.Drive.Folder} parentFolder - Dossier parent
 * @param {string} folderName - Nom du dossier
 * @returns {GoogleAppsScript.Drive.Folder} Dossier créé ou existant
 */
function createOrGetFolder(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);

    if (folders.hasNext()) {
        return folders.next();
    }

    return parentFolder.createFolder(folderName);
}

/**
 * Extrait l'ID d'un fichier depuis une URL Google Drive
 * @param {string} url - URL du fichier
 * @returns {string|null} ID du fichier ou null
 */
function extractFileIdFromUrl(url) {
    // Format: https://drive.google.com/open?id=FILE_ID
    let match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);

    if (match) {
        return match[1];
    }

    // Formats alternatifs
    const fallbackPatterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of fallbackPatterns) {
        match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    console.warn(`Impossible d'extraire l'ID du fichier depuis l'URL: ${url}`);
    return null;
}

/**
 * Extrait l'extension d'un nom de fichier
 * @param {string} fileName - Nom du fichier
 * @returns {string} Extension avec le point (ex: ".pdf")
 */
function getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
}

/**
 * Extrait plusieurs URLs de fichiers depuis une chaîne
 * @param {string} cellValue - Valeur de cellule contenant des URLs
 * @returns {Array<string>} Liste d'URLs
 */
function extractFileUrls(cellValue) {
    if (!cellValue) return [];

    const urls = [];
    const urlString = cellValue.toString();

    // Séparer par 'https://drive.google.com'
    const urlParts = urlString.split('https://drive.google.com').filter(part => part.length > 0);

    urlParts.forEach(part => {
        const fullUrl = 'https://drive.google.com' + part;
        urls.push(fullUrl);
    });

    return urls;
}

/**
 * Vérifie si une valeur est un nombre valide
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} True si c'est un nombre valide
 */
function isValidNumber(value) {
    return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Vérifie si une date est valide
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} True si c'est une date valide
 */
function isValidDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return !isNaN(date.getTime());
}

/**
 * Nettoie et normalise une chaîne de caractères
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
function cleanString(str) {
    if (!str) return '';

    return str.toString().trim();
}

/**
 * Gère les erreurs de manière cohérente
 * @param {Error} error - Erreur à logger
 * @param {string} context - Contexte de l'erreur
 */
function logError(error, context) {
    const errorMessage = `[ERREUR - ${context}] ${error.message}`;
    console.error(errorMessage);
    console.error(error.stack);
}