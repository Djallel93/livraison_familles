/**
 * Service de géocodage d'adresses
 * Trouve les coordonnées GPS et associe aux quartiers
 */

const GeocodingService = (() => {

    const GEOCODING_CACHE_KEY = 'GEOCODING_CACHE';
    const CACHE_DURATION = 86400; // 24 heures en secondes

    /**
     * Géocode une adresse et trouve le quartier correspondant
     * @param {string} address - Adresse complète
     * @returns {Object|null} {id, nom, latitude, longitude, codePostal, ville}
     */
    const geocodeAndFindQuartier = (address) => {
        if (!address || address.trim().length < 5) {
            console.warn('Adresse invalide pour géocodage');
            return null;
        }

        try {
            // Vérifier le cache
            const cached = getCachedGeocode(address);
            if (cached) {
                console.log('Géocodage depuis cache');
                return cached;
            }

            // Géocoder l'adresse
            const coords = geocodeAddress(address);
            if (!coords) {
                console.warn(`Géocodage échoué pour: ${address}`);
                return null;
            }

            // Trouver le quartier le plus proche
            const quartier = findNearestQuartier(coords.lat, coords.lng);

            if (quartier) {
                const result = {
                    id: quartier.id,
                    nom: quartier.nom,
                    latitude: coords.lat,
                    longitude: coords.lng,
                    codePostal: quartier.codePostal,
                    ville: quartier.ville
                };

                // Mettre en cache
                cacheGeocode(address, result);

                return result;
            }

            return null;

        } catch (error) {
            logError(error, 'geocodeAndFindQuartier');
            return null;
        }
    };

    /**
     * Géocode une adresse avec Google Maps API
     * @param {string} address - Adresse à géocoder
     * @returns {Object|null} {lat, lng}
     */
    const geocodeAddress = (address) => {
        try {
            const geocoder = Maps.newGeocoder();
            geocoder.setLanguage('fr');
            geocoder.setRegion('fr');

            const response = geocoder.geocode(address);

            if (response.status === 'OK' && response.results.length > 0) {
                const location = response.results[0].geometry.location;

                console.log(`Géocodage réussi: ${address} -> ${location.lat}, ${location.lng}`);

                return {
                    lat: location.lat,
                    lng: location.lng,
                    formattedAddress: response.results[0].formatted_address
                };
            }

            console.warn(`Géocodage échoué: ${response.status}`);
            return null;

        } catch (error) {
            logError(error, 'geocodeAddress');
            return null;
        }
    };

    /**
     * Trouve le quartier le plus proche d'une coordonnée
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @returns {Object|null} Quartier le plus proche
     */
    const findNearestQuartier = (lat, lng) => {
        try {
            const quartierData = getCachedSheetData(SHEET_DEF.QUARTIER.NAME);
            const QC = SHEET_DEF.QUARTIER.COLS;

            let nearest = null;
            let minDistance = Infinity;

            quartierData.forEach(row => {
                const quartierLat = row[QC.LATITUDE];
                const quartierLng = row[QC.LOGITUDE]; // Note: typo dans config

                if (quartierLat && quartierLng) {
                    const distance = calculateDistance(lat, lng, quartierLat, quartierLng);

                    if (distance < minDistance) {
                        minDistance = distance;

                        const villeData = dataService.getVilleDetails(row[QC.ID_VILLE]);

                        nearest = {
                            id: row[QC.ID],
                            nom: row[QC.NOM],
                            latitude: quartierLat,
                            longitude: quartierLng,
                            distance: distance,
                            codePostal: villeData?.codePostal || '',
                            ville: villeData?.nom || ''
                        };
                    }
                }
            });

            if (nearest) {
                console.log(`Quartier trouvé: ${nearest.nom} (${nearest.distance.toFixed(2)} km)`);
            }

            return nearest;

        } catch (error) {
            logError(error, 'findNearestQuartier');
            return null;
        }
    };

    /**
     * Valide qu'une adresse est dans la zone de service
     * @param {string} address - Adresse à valider
     * @param {number} maxDistanceKm - Distance maximale acceptée (défaut: 50km)
     * @returns {Object} {valid: boolean, distance: number, message: string}
     */
    const validateServiceArea = (address, maxDistanceKm = 50) => {
        try {
            const coords = geocodeAddress(address);
            if (!coords) {
                return {
                    valid: false,
                    distance: null,
                    message: 'Adresse non trouvée'
                };
            }

            // Coordonnées de l'association (depuis config)
            const associationCoords = getAssociationCoordinates();
            if (!associationCoords) {
                return {
                    valid: true, // Pas de validation si pas de coord
                    distance: null,
                    message: 'Zone non configurée'
                };
            }

            const distance = calculateDistance(
                coords.lat,
                coords.lng,
                associationCoords.lat,
                associationCoords.lng
            );

            if (distance <= maxDistanceKm) {
                return {
                    valid: true,
                    distance: distance,
                    message: `Dans la zone de service (${distance.toFixed(1)} km)`
                };
            } else {
                return {
                    valid: false,
                    distance: distance,
                    message: `Hors zone de service (${distance.toFixed(1)} km, max: ${maxDistanceKm} km)`
                };
            }

        } catch (error) {
            logError(error, 'validateServiceArea');
            return {
                valid: false,
                distance: null,
                message: error.message
            };
        }
    };

    /**
     * Récupère les coordonnées de l'association
     */
    const getAssociationCoordinates = () => {
        const scriptProperties = PropertiesService.getScriptProperties();
        const lat = parseFloat(scriptProperties.getProperty('ASSOCIATION_LAT'));
        const lng = parseFloat(scriptProperties.getProperty('ASSOCIATION_LNG'));

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            return { lat, lng };
        }

        return null;
    };

    /**
     * Configure les coordonnées de l'association
     */
    const setAssociationCoordinates = (lat, lng) => {
        const scriptProperties = PropertiesService.getScriptProperties();
        scriptProperties.setProperty('ASSOCIATION_LAT', lat.toString());
        scriptProperties.setProperty('ASSOCIATION_LNG', lng.toString());
        console.log(`Coordonnées association configurées: ${lat}, ${lng}`);
    };

    /**
     * Cache un résultat de géocodage
     */
    const cacheGeocode = (address, result) => {
        try {
            const cache = CacheService.getScriptCache();
            const cacheKey = `${GEOCODING_CACHE_KEY}_${hashString(address)}`;
            cache.put(cacheKey, JSON.stringify(result), CACHE_DURATION);
        } catch (error) {
            console.warn('Erreur mise en cache géocodage:', error.message);
        }
    };

    /**
     * Récupère un géocodage depuis le cache
     */
    const getCachedGeocode = (address) => {
        try {
            const cache = CacheService.getScriptCache();
            const cacheKey = `${GEOCODING_CACHE_KEY}_${hashString(address)}`;
            const cached = cache.get(cacheKey);

            if (cached) {
                return JSON.parse(cached);
            }

            return null;
        } catch (error) {
            console.warn('Erreur lecture cache géocodage:', error.message);
            return null;
        }
    };

    /**
     * Génère un hash simple d'une chaîne
     */
    const hashString = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    };

    /**
     * Batch géocode plusieurs adresses
     * @param {Array<string>} addresses - Liste d'adresses
     * @returns {Array<Object>} Résultats
     */
    const batchGeocode = (addresses) => {
        const results = [];

        addresses.forEach((address, index) => {
            try {
                const result = geocodeAndFindQuartier(address);
                results.push({
                    index: index,
                    address: address,
                    success: result !== null,
                    result: result
                });

                // Pause pour éviter les limites API
                if (index < addresses.length - 1) {
                    Utilities.sleep(200);
                }
            } catch (error) {
                results.push({
                    index: index,
                    address: address,
                    success: false,
                    error: error.message
                });
            }
        });

        return results;
    };

    /**
     * Géocode toutes les familles sans quartier assigné
     */
    const geocodeAllFamiliesWithoutQuartier = () => {
        try {
            const familleData = getCachedSheetData(SHEET_DEF.FAMILLE.NAME);
            const FC = SHEET_DEF.FAMILLE.COLS;
            const familleSheet = getSheetByName(SHEET_DEF.FAMILLE.NAME);

            let updated = 0;
            let failed = 0;

            familleData.forEach((row, index) => {
                const rowNum = index + 2; // +2 pour header et base 1
                const idQuartier = row[FC.ID_QUARTIER];
                const adresse = row[FC.ADRESSE];

                if (!idQuartier && adresse) {
                    try {
                        const result = geocodeAndFindQuartier(adresse);

                        if (result) {
                            familleSheet.getRange(rowNum, FC.ID_QUARTIER + 1)
                                .setValue(result.id);
                            updated++;
                            console.log(`Famille ${row[FC.ID]}: quartier ${result.nom} assigné`);
                        } else {
                            failed++;
                            console.warn(`Famille ${row[FC.ID]}: géocodage échoué`);
                        }

                        // Pause pour éviter limites API
                        Utilities.sleep(200);

                    } catch (error) {
                        failed++;
                        console.error(`Erreur famille ${row[FC.ID]}: ${error.message}`);
                    }
                }
            });

            invalidateCache(SHEET_DEF.FAMILLE.NAME);

            return {
                success: updated,
                failed: failed,
                message: `${updated} famille(s) géocodée(s), ${failed} échec(s)`
            };

        } catch (error) {
            logError(error, 'geocodeAllFamiliesWithoutQuartier');
            throw error;
        }
    };

    // Interface publique
    return {
        geocodeAndFindQuartier,
        geocodeAddress,
        findNearestQuartier,
        validateServiceArea,
        setAssociationCoordinates,
        getAssociationCoordinates,
        batchGeocode,
        geocodeAllFamiliesWithoutQuartier
    };
})();