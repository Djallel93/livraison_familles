/**
 * Service de gestion du cache
 * Améliore les performances en mettant en cache les données des feuilles
 */

const myCacheService = (() => {
    const CACHE_DURATION = 3600; // 1 heure en secondes
    const CACHE_PREFIX = 'SHEET_DATA_';

    /**
     * Récupère les données d'une feuille avec cache
     * @param {string} sheetName - Nom de la feuille
     * @returns {Array<Array>} Données de la feuille (sans header)
     */
    const getCachedSheetData = (sheetName) => {
        try {
            const cache = CacheService.getScriptCache();
            const cacheKey = CACHE_PREFIX + sheetName;

            // Essayer de récupérer depuis le cache
            const cached = cache.get(cacheKey);
            if (cached) {
                console.log(`📦 Cache HIT: ${sheetName}`);
                return JSON.parse(cached);
            }

            // Cache MISS - charger depuis la feuille
            console.log(`💾 Cache MISS: ${sheetName} - Loading from sheet`);
            const data = getSheetDataByName(sheetName);

            // Mettre en cache
            try {
                cache.put(cacheKey, JSON.stringify(data), CACHE_DURATION);
            } catch (cacheError) {
                // Si les données sont trop grandes pour le cache, continuer sans cache
                console.warn(`⚠️ Cache trop volumineux pour ${sheetName}: ${cacheError.message}`);
            }

            return data;

        } catch (error) {
            logError(error, `getCachedSheetData(${sheetName})`);
            // En cas d'erreur, charger directement depuis la feuille
            return getSheetDataByName(sheetName);
        }
    };

    /**
     * Invalide le cache d'une feuille spécifique
     * @param {string} sheetName - Nom de la feuille
     */
    const invalidateCache = (sheetName) => {
        try {
            const cache = CacheService.getScriptCache();
            const cacheKey = CACHE_PREFIX + sheetName;
            cache.remove(cacheKey);
            console.log(`🗑️ Cache invalidé: ${sheetName}`);
        } catch (error) {
            console.warn(`Erreur invalidation cache: ${error.message}`);
        }
    };

    /**
     * Invalide tout le cache
     */
    const invalidateAllCache = () => {
        try {
            const cache = CacheService.getScriptCache();
            cache.removeAll([]);
            console.log('🗑️ Tout le cache a été invalidé');
        } catch (error) {
            console.warn(`Erreur invalidation totale cache: ${error.message}`);
        }
    };

    /**
     * Précharge le cache pour toutes les feuilles principales
     */
    const preloadCache = () => {
        try {
            console.log('⏳ Préchargement du cache...');

            const sheetsToCache = [
                SHEET_DEF.FAMILLE.NAME,
                SHEET_DEF.LIVREUR.NAME,
                SHEET_DEF.RESPONSABLE.NAME,
                SHEET_DEF.LIVRAISON.NAME,
                SHEET_DEF.QUARTIER.NAME,
                SHEET_DEF.SECTEUR.NAME,
                SHEET_DEF.VILLE.NAME
            ];

            let loaded = 0;
            sheetsToCache.forEach(sheetName => {
                try {
                    getCachedSheetData(sheetName);
                    loaded++;
                } catch (error) {
                    console.warn(`Erreur préchargement ${sheetName}: ${error.message}`);
                }
            });

            console.log(`✅ ${loaded}/${sheetsToCache.length} feuilles préchargées`);
            return loaded;

        } catch (error) {
            logError(error, 'preloadCache');
            return 0;
        }
    };

    /**
     * Obtient des statistiques sur le cache
     * @returns {Object} Statistiques du cache
     */
    const getCacheStats = () => {
        try {
            const cache = CacheService.getScriptCache();
            const sheets = [
                SHEET_DEF.FAMILLE.NAME,
                SHEET_DEF.LIVREUR.NAME,
                SHEET_DEF.RESPONSABLE.NAME,
                SHEET_DEF.LIVRAISON.NAME,
                SHEET_DEF.QUARTIER.NAME,
                SHEET_DEF.SECTEUR.NAME,
                SHEET_DEF.VILLE.NAME
            ];

            const stats = {
                cached: 0,
                notCached: 0,
                details: {}
            };

            sheets.forEach(sheetName => {
                const cacheKey = CACHE_PREFIX + sheetName;
                const cached = cache.get(cacheKey);

                if (cached) {
                    stats.cached++;
                    const data = JSON.parse(cached);
                    stats.details[sheetName] = {
                        cached: true,
                        rows: data.length,
                        sizeKB: (cached.length / 1024).toFixed(2)
                    };
                } else {
                    stats.notCached++;
                    stats.details[sheetName] = {
                        cached: false
                    };
                }
            });

            return stats;

        } catch (error) {
            logError(error, 'getCacheStats');
            return null;
        }
    };

    /**
     * Rafraîchit le cache d'une feuille
     * @param {string} sheetName - Nom de la feuille
     */
    const refreshCache = (sheetName) => {
        invalidateCache(sheetName);
        return getCachedSheetData(sheetName);
    };

    /**
     * Rafraîchit le cache de toutes les feuilles
     */
    const refreshAllCache = () => {
        invalidateAllCache();
        return preloadCache();
    };

    // Interface publique
    return {
        getCachedSheetData,
        invalidateCache,
        invalidateAllCache,
        preloadCache,
        getCacheStats,
        refreshCache,
        refreshAllCache
    };
})();

// Rendre les fonctions accessibles globalement
function getCachedSheetData(sheetName) {
    return myCacheService.getCachedSheetData(sheetName);
}

function invalidateCache(sheetName) {
    return myCacheService.invalidateCache(sheetName);
}

function invalidateAllCache() {
    return myCacheService.invalidateAllCache();
}

function preloadCache() {
    return myCacheService.preloadCache();
}

function getCacheStats() {
    return myCacheService.getCacheStats();
}

function refreshCache(sheetName) {
    return myCacheService.refreshCache(sheetName);
}

function refreshAllCache() {
    return myCacheService.refreshAllCache();
}

/**
 * Affiche les statistiques du cache (à appeler depuis le menu)
 */
function showCacheStats() {
    const stats = getCacheStats();
    const ui = SpreadsheetApp.getUi();

    if (!stats) {
        ui.alert('Erreur', 'Impossible de récupérer les stats du cache', ui.ButtonSet.OK);
        return;
    }

    let message = `Feuilles en cache: ${stats.cached}\n`;
    message += `Feuilles non cachées: ${stats.notCached}\n\n`;
    message += 'Détails:\n';

    for (const [sheetName, info] of Object.entries(stats.details)) {
        if (info.cached) {
            message += `✅ ${sheetName}: ${info.rows} lignes (${info.sizeKB} KB)\n`;
        } else {
            message += `❌ ${sheetName}: Non caché\n`;
        }
    }

    ui.alert('Statistiques du cache', message, ui.ButtonSet.OK);
}

/**
 * Trigger pour précharger le cache à l'ouverture
 * (Optionnel - peut ralentir l'ouverture)
 */
function onOpenPreloadCache() {
    try {
        // Précharger en arrière-plan sans bloquer
        myCacheService.preloadCache();
    } catch (error) {
        console.warn('Erreur préchargement cache à l\'ouverture:', error.message);
    }
}