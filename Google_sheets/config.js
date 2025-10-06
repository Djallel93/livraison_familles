/**
 * Configuration centralisée du système de gestion des livraisons
 */

const CONFIG = {
    EMAIL_QUOTA_WARNING: 50,
    DEFAULT_MAX_FAMILIES_PER_DRIVER: 10,
    MIN_FAMILIES_PER_DRIVER: 1,
    MAX_FAMILIES_PER_DRIVER: 20,
    EMAIL_SENDER_NAME: "AMANA - Gestion des Livraisons",

    DATE_FORMAT: {
        locale: 'fr-FR',
        options: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    }
};

/**
 * Définition des schémas de feuilles Google Sheets
 */
const SHEET_DEF = {
    RESPONSABLE: {
        NAME: "reponsable",
        COLS: {
            ID: 0, NOM: 1, PRENOM: 2, MAIL: 3,
            TELEPHONE: 4, SECTEUR: 5, ROLE: 6
        }
    },

    LIVREUR: {
        NAME: "livreur",
        COLS: {
            ID: 0, NOM: 1, PRENOM: 2, MAIL: 3, TELEPHONE: 4,
            TYPE_VEHICULE: 5, ID_SECTEUR: 6, ID_RESPONSABLE: 7, ROLE: 8
        }
    },

    FAMILLE: {
        NAME: "famille",
        COLS: {
            ID: 0, NOM: 1, PRENOM_CONTACT: 2, ZAKAT_EL_FITR: 3,
            SADAQA: 4, NOMBRE_ADULTE: 5, NOMBRE_ENFANT: 6, ADRESSE: 7,
            ID_QUARTIER: 8, SE_DEPLACE: 9, TELEPHONE: 10, TELEPHONE_BIS: 11,
            CIRCONSTANCES: 12, ETAT: 13, PREMIER_CONTACT: 14,
            RESSENTIT: 15, SPECIFITES: 16
        }
    },

    LIVRAISON: {
        NAME: "livraison",
        COLS: {
            ID_FAMILLE: 0, DATE_LIVRAISONS: 1, OCCASION: 2, ID_LIVREUR: 3,
            ID_BINOME: 4, NOMBRE_PART: 5, AVEC_ENFANT: 6, PRETE: 7,
            EN_COURS: 8, LIVRE: 9, NOTE: 10, COMMENTAIRE: 11
        }
    },

    QUARTIER: {
        NAME: "quartier",
        COLS: {
            ID: 0, NOM: 1, LATITUDE: 2, LONGITUDE: 3, ID_SECTEUR: 4
        }
    },

    SECTEUR: {
        NAME: "quartier",
        COLS: {
            ID: 0, NOM: 1, LATITUDE: 2, LONGITUDE: 3, ID_VILLE: 4
        }
    },

    VILLE: {
        NAME: "ville",
        COLS: {
            ID: 0, NOM: 1, CODE_POSTAL: 2, DEPARTEMENT: 3, PAYS: 4
        }
    },

    AUX: {
        NAME: "aux",
        COLS: {
            USER_GROUP: 0, OCCASION: 1, LIVREURE: 2
        }
    }
};

// ========================================
// Simple Cache Implementation
// ========================================

let _sheetCache = {};
let _cacheSpreadsheetId = null;

/**
 * Charge les données d'une feuille avec cache
 */
function getCachedSheetData(sheetName, forceReload = false) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const currentId = ss.getId();

    // Invalider le cache si on change de spreadsheet
    if (_cacheSpreadsheetId !== currentId) {
        _sheetCache = {};
        _cacheSpreadsheetId = currentId;
    }

    // Retourner le cache si disponible
    if (!forceReload && _sheetCache[sheetName]) {
        console.log(`✓ Cache HIT pour ${sheetName}`);
        return _sheetCache[sheetName];
    }

    console.log(`✗ Cache MISS pour ${sheetName}, chargement...`);
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        throw new Error(`Feuille "${sheetName}" introuvable`);
    }

    const data = sheet.getDataRange().getValues();
    _sheetCache[sheetName] = data.slice(1); // Sans l'en-tête

    return _sheetCache[sheetName];
}

/**
 * Invalide le cache pour une feuille
 */
function invalidateCache(sheetName) {
    if (sheetName) {
        delete _sheetCache[sheetName];
        console.log(`Cache invalidé pour ${sheetName}`);
    } else {
        _sheetCache = {};
        console.log('Tout le cache a été vidé');
    }
}

/**
 * Fonction accessible depuis le menu
 */
function clearAllCache() {
    invalidateCache();
    SpreadsheetApp.getUi().alert(
        'Cache rafraîchi',
        'Le cache a été vidé. Les données seront rechargées à la prochaine utilisation.',
        SpreadsheetApp.getUi().ButtonSet.OK
    );
}