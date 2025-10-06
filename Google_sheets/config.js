/**
 * Configuration globale du système
 * Définit les constantes, paramètres et structure des feuilles
 */

// ============================================
// CONFIGURATION GÉNÉRALE
// ============================================

const CONFIG = {
    // Nom de l'association
    ASSOCIATION_NAME: 'AMANA',

    // Email de l'expéditeur
    EMAIL_SENDER_NAME: 'AMANA - Pôle sociale',

    // Paramètres de livraison
    DEFAULT_MAX_FAMILIES_PER_DRIVER: 20,
    MAX_DELIVERY_DISTANCE_KM: 50,

    // Format de date
    DATE_FORMAT: {
        locale: 'fr-FR',
        options: {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    },

    // Durée du cache (en secondes)
    CACHE_DURATION: 3600, // 1 heure

    // Paramètres de validation
    VALIDATION: {
        MIN_PHONE_LENGTH: 9,
        MAX_PHONE_LENGTH: 10,
        MIN_ADDRESS_LENGTH: 10,
        MIN_NAME_LENGTH: 2
    }
};

// ============================================
// DÉFINITION DES FEUILLES
// ============================================

const SHEET_DEF = {
    // Feuille Famille
    FAMILLE: {
        NAME: 'Famille',
        SHEET_NAME: 'Famille',
        COLS: {
            ID: 0,
            NOM: 1,
            PRENOM_CONTACT: 2,
            ZAKAT_EL_FITR: 3,
            SADAQA: 4,
            NOMBRE_ADULTE: 5,
            NOMBRE_ENFANT: 6,
            ADRESSE: 7,
            ID_QUARTIER: 8,
            SE_DEPLACE: 9,
            EMAIL: 10,
            TELEPHONE: 11,
            TELEPHONE_BIS: 12,
            IDENTITE: 13,
            CAF: 14,
            CIRCONSTANCES: 15,
            RESSENTIT: 16,
            SPECIFITES: 17,
            ETAT: 18,
            DATE_CREATION: 19
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            PRENOM_CONTACT: { INDEX: 3, TYPE: 'string' },
            ZAKAT_EL_FITR: { INDEX: 4, TYPE: 'boolean' },
            SADAQA: { INDEX: 5, TYPE: 'boolean' },
            NOMBRE_ADULTE: { INDEX: 6, TYPE: 'number' },
            NOMBRE_ENFANT: { INDEX: 7, TYPE: 'number' },
            ADRESSE: { INDEX: 8, TYPE: 'string' },
            ID_QUARTIER: { INDEX: 9, TYPE: 'number' },
            SE_DEPLACE: { INDEX: 10, TYPE: 'boolean' },
            EMAIL: { INDEX: 11, TYPE: 'string' },
            TELEPHONE: { INDEX: 12, TYPE: 'string' },
            TELEPHONE_BIS: { INDEX: 13, TYPE: 'string' },
            IDENTITE: { INDEX: 14, TYPE: 'string' },
            CAF: { INDEX: 15, TYPE: 'string' },
            CIRCONSTANCES: { INDEX: 16, TYPE: 'string' },
            RESSENTIT: { INDEX: 17, TYPE: 'string' },
            SPECIFITES: { INDEX: 18, TYPE: 'string' },
            ETAT: { INDEX: 19, TYPE: 'string' },
            DATE_CREATION: { INDEX: 20, TYPE: 'date' }
        }
    },

    // Feuille Livreur
    LIVREUR: {
        NAME: 'Livreur',
        SHEET_NAME: 'Livreur',
        COLS: {
            ID: 0,
            NOM: 1,
            PRENOM: 2,
            MAIL: 3,
            TELEPHONE: 4,
            TYPE_VEHICULE: 5,
            SECTEUR: 6,
            ID_RESPONSABLE: 7,
            ROLE: 8
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            PRENOM: { INDEX: 3, TYPE: 'string' },
            MAIL: { INDEX: 4, TYPE: 'string' },
            TELEPHONE: { INDEX: 5, TYPE: 'string' },
            TYPE_VEHICULE: { INDEX: 6, TYPE: 'string' },
            SECTEUR: { INDEX: 7, TYPE: 'string' },
            ID_RESPONSABLE: { INDEX: 8, TYPE: 'number' },
            ROLE: { INDEX: 9, TYPE: 'string' }
        }
    },

    // Feuille Responsable
    RESPONSABLE: {
        NAME: 'responsable',
        SHEET_NAME: 'responsable',
        COLS: {
            ID: 0,
            NOM: 1,
            PRENOM: 2,
            MAIL: 3,
            TELEPHONE: 4,
            SECTEUR: 5,
            ROLE: 6
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            PRENOM: { INDEX: 3, TYPE: 'string' },
            MAIL: { INDEX: 4, TYPE: 'string' },
            TELEPHONE: { INDEX: 5, TYPE: 'string' },
            SECTEUR: { INDEX: 6, TYPE: 'string' },
            ROLE: { INDEX: 7, TYPE: 'string' }
        }
    },

    // Feuille Livraison
    LIVRAISON: {
        NAME: 'Livraison',
        SHEET_NAME: 'Livraison',
        COLS: {
            ID_FAMILLE: 0,
            DATE_LIVRAISONS: 1,
            OCCASION: 2,
            ID_LIVREUR: 3,
            ID_BINOME: 4,
            NOMBRE_PART: 5,
            AVEC_ENFANT: 6,
            PRETE: 7,
            EN_COURS: 8,
            LIVRE: 9,
            NOTE: 10,
            COMMENTAIRE: 11
        },
        COLUMNS: {
            ID_FAMILLE: { INDEX: 1, TYPE: 'number' },
            DATE_LIVRAISONS: { INDEX: 2, TYPE: 'date' },
            OCCASION: { INDEX: 3, TYPE: 'string' },
            ID_LIVREUR: { INDEX: 4, TYPE: 'number' },
            ID_BINOME: { INDEX: 5, TYPE: 'number' },
            NOMBRE_PART: { INDEX: 6, TYPE: 'number' },
            AVEC_ENFANT: { INDEX: 7, TYPE: 'boolean' },
            PRETE: { INDEX: 8, TYPE: 'boolean' },
            EN_COURS: { INDEX: 9, TYPE: 'boolean' },
            LIVRE: { INDEX: 10, TYPE: 'boolean' },
            NOTE: { INDEX: 11, TYPE: 'number' },
            COMMENTAIRE: { INDEX: 12, TYPE: 'string' }
        }
    },

    // Feuille Quartier
    QUARTIER: {
        NAME: 'Quartier',
        SHEET_NAME: 'Quartier',
        COLS: {
            ID: 0,
            NOM: 1,
            LATITUDE: 2,
            LOGITUDE: 3, // Note: typo dans votre structure
            ID_VILLE: 4
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            LATITUDE: { INDEX: 3, TYPE: 'number' },
            LOGITUDE: { INDEX: 4, TYPE: 'number' },
            ID_VILLE: { INDEX: 5, TYPE: 'number' }
        }
    },

    // Feuille Secteur
    SECTEUR: {
        NAME: 'Secteur',
        SHEET_NAME: 'Secteur',
        COLS: {
            ID: 0,
            NOM: 1,
            LATITUDE: 2,
            LONGITUDE: 3,
            ID_VILLE: 4
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            LATITUDE: { INDEX: 3, TYPE: 'number' },
            LONGITUDE: { INDEX: 4, TYPE: 'number' },
            ID_VILLE: { INDEX: 5, TYPE: 'number' }
        }
    },

    // Feuille Ville
    VILLE: {
        NAME: 'Ville',
        SHEET_NAME: 'Ville',
        COLS: {
            ID: 0,
            NOM: 1,
            CODE_POSTAL: 2,
            DEPARTEMENT: 3,
            PAYS: 4
        },
        COLUMNS: {
            ID: { INDEX: 1, TYPE: 'number' },
            NOM: { INDEX: 2, TYPE: 'string' },
            CODE_POSTAL: { INDEX: 3, TYPE: 'string' },
            DEPARTEMENT: { INDEX: 4, TYPE: 'string' },
            PAYS: { INDEX: 5, TYPE: 'string' }
        }
    },

    // Feuille Auxiliaire (occasions, etc.)
    AUX: {
        NAME: 'Auxiliaire',
        SHEET_NAME: 'Auxiliaire',
        COLUMNS: {
            OCCASION: { INDEX: 1, TYPE: 'string' }
        }
    }
};

// ============================================
// STATUTS DE LIVRAISON
// ============================================

const DELIVERY_STATUS = {
    PENDING: 'pending',
    PREPARED: 'prepared',
    IN_PROGRESS: 'in_progress',
    DELIVERED: 'delivered',
    FAILED: 'failed'
};

const DELIVERY_STATUS_FR = {
    pending: 'En attente',
    prepared: 'Préparée',
    in_progress: 'En cours',
    delivered: 'Livrée',
    failed: 'Échec'
};

// ============================================
// ÉTATS DES DOSSIERS
// ============================================

const FAMILY_STATUS = {
    NEW: 'Nouveau',
    PENDING: 'En attente de validation',
    TO_VERIFY: 'À vérifier',
    VALIDATED: 'Validé',
    REJECTED: 'Rejeté',
    ARCHIVED: 'Archivé'
};

// ============================================
// RÔLES
// ============================================

const ROLES = {
    SUPER_ADMIN: 'super admin',
    ADMIN: 'admin',
    RESPONSABLE: 'responsable',
    LIVREUR: 'livreur'
};

// ============================================
// TYPES DE VÉHICULES
// ============================================

const VEHICLE_TYPES = {
    CAR: 'Voiture',
    VAN: 'Utilitaire',
    BIKE: 'Vélo',
    SCOOTER: 'Scooter',
    FOOT: 'À pied'
};

// ============================================
// OCCASIONS (peut être étendu)
// ============================================

const OCCASIONS = [
    'Ramadan',
    'Aïd el-Fitr',
    'Aïd el-Adha',
    'Distribution mensuelle',
    'Distribution exceptionnelle'
];

// ============================================
// HELPER: Récupérer l'URL de l'API
// ============================================

function getApiUrl() {
    const scriptProperties = PropertiesService.getScriptProperties();
    return scriptProperties.getProperty('API_URL');
}

// ============================================
// HELPER: Récupérer le token API
// ============================================

function getApiToken() {
    const scriptProperties = PropertiesService.getScriptProperties();
    let token = scriptProperties.getProperty('API_TOKEN');

    if (!token) {
        // Générer un nouveau token
        token = Utilities.getUuid();
        scriptProperties.setProperty('API_TOKEN', token);
        console.warn(`Nouveau token API généré: ${token}`);
    }

    return token;
}