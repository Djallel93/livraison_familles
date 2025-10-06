/**
 * Service API REST - Logique métier
 */

const ApiService = (() => {

    const handleRequest = (e) => {
        try {
            const token = e.parameter.token || e.parameter.t;
            if (!isValidToken(token)) {
                return createJsonResponse({
                    success: false,
                    error: 'Token invalide'
                }, 401);
            }

            const action = e.parameter.action || e.parameter.a;

            switch (action) {
                case 'update_status':
                    return updateDeliveryStatus(e);
                case 'get_status':
                    return getDeliveryStatus(e);
                case 'batch_update':
                    return batchUpdateStatus(e);
                default:
                    return createJsonResponse({
                        success: false,
                        error: 'Action inconnue'
                    }, 400);
            }
        } catch (error) {
            logError(error, 'ApiService.handleRequest');
            return createJsonResponse({
                success: false,
                error: error.message
            }, 500);
        }
    };

    const updateDeliveryStatus = (e) => {
        const familyId = parseInt(e.parameter.family_id || e.parameter.fid);
        const occasion = e.parameter.occasion || e.parameter.occ;
        const date = e.parameter.date || e.parameter.d;
        const status = e.parameter.status || e.parameter.s;

        if (!familyId || !occasion || !date || !status) {
            return createJsonResponse({
                success: false,
                error: 'Paramètres manquants'
            }, 400);
        }

        const validStatuses = ['prepared', 'in_progress', 'delivered', 'failed'];
        if (!validStatuses.includes(status)) {
            return createJsonResponse({
                success: false,
                error: 'Statut invalide'
            }, 400);
        }

        const result = updateLivraisonStatus(familyId, occasion, date, status);

        if (result.success) {
            return createJsonResponse({
                success: true,
                message: 'Statut mis à jour',
                data: {
                    family_id: familyId,
                    occasion: occasion,
                    date: date,
                    status: status,
                    updated_at: new Date().toISOString()
                }
            });
        } else {
            return createJsonResponse({
                success: false,
                error: result.error
            }, 404);
        }
    };

    const getDeliveryStatus = (e) => {
        const familyId = parseInt(e.parameter.family_id || e.parameter.fid);
        const occasion = e.parameter.occasion || e.parameter.occ;
        const date = e.parameter.date || e.parameter.d;

        if (!familyId || !occasion || !date) {
            return createJsonResponse({
                success: false,
                error: 'Paramètres manquants'
            }, 400);
        }

        const status = getLivraisonStatus(familyId, occasion, date);

        if (status) {
            return createJsonResponse({
                success: true,
                data: status
            });
        } else {
            return createJsonResponse({
                success: false,
                error: 'Livraison non trouvée'
            }, 404);
        }
    };

    const batchUpdateStatus = (e) => {
        if (!e.postData || !e.postData.contents) {
            return createJsonResponse({
                success: false,
                error: 'Méthode POST requise'
            }, 400);
        }

        const data = JSON.parse(e.postData.contents);
        const updates = data.updates;

        if (!Array.isArray(updates) || updates.length === 0) {
            return createJsonResponse({
                success: false,
                error: 'Array "updates" requis'
            }, 400);
        }

        const results = { success: 0, failed: 0, errors: [] };

        updates.forEach((update, index) => {
            try {
                const result = updateLivraisonStatus(
                    update.family_id,
                    update.occasion,
                    update.date,
                    update.status
                );

                if (result.success) {
                    results.success++;
                } else {
                    results.failed++;
                    results.errors.push({ index, error: result.error, update });
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ index, error: error.message, update });
            }
        });

        return createJsonResponse({
            success: true,
            results: results
        });
    };

    const updateLivraisonStatus = (familyId, occasion, date, status) => {
        try {
            const ss = SpreadsheetApp.getActiveSpreadsheet();
            const sheet = ss.getSheetByName(SHEET_DEF.LIVRAISON.NAME);
            const data = sheet.getDataRange().getValues();
            const LC = SHEET_DEF.LIVRAISON.COLS;

            let targetRow = -1;
            for (let i = 1; i < data.length; i++) {
                const rowDate = formatDateISO(new Date(data[i][LC.DATE_LIVRAISONS]));
                if (data[i][LC.ID_FAMILLE] === familyId &&
                    data[i][LC.OCCASION] === occasion &&
                    rowDate === date) {
                    targetRow = i + 1;
                    break;
                }
            }

            if (targetRow === -1) {
                return { success: false, error: 'Livraison non trouvée' };
            }

            let prete = false, enCours = false, livre = false;

            switch (status) {
                case 'prepared':
                    prete = true;
                    break;
                case 'in_progress':
                    prete = true;
                    enCours = true;
                    break;
                case 'delivered':
                    prete = true;
                    enCours = true;
                    livre = true;
                    break;
                case 'failed':
                    sheet.getRange(targetRow, LC.COMMENTAIRE + 1)
                        .setValue('❌ Échec - ' + new Date().toLocaleString('fr-FR'));
                    break;
            }

            if (status !== 'failed') {
                sheet.getRange(targetRow, LC.PRETE + 1).setValue(prete);
                sheet.getRange(targetRow, LC.EN_COURS + 1).setValue(enCours);
                sheet.getRange(targetRow, LC.LIVRE + 1).setValue(livre);
            }

            invalidateCache(SHEET_DEF.LIVRAISON.NAME);
            return { success: true, row: targetRow };

        } catch (error) {
            logError(error, 'updateLivraisonStatus');
            return { success: false, error: error.message };
        }
    };

    const getLivraisonStatus = (familyId, occasion, date) => {
        try {
            const livraisonData = getCachedSheetData(SHEET_DEF.LIVRAISON.NAME);
            const LC = SHEET_DEF.LIVRAISON.COLS;

            const livraison = livraisonData.find(row => {
                const rowDate = formatDateISO(new Date(row[LC.DATE_LIVRAISONS]));
                return row[LC.ID_FAMILLE] === familyId &&
                    row[LC.OCCASION] === occasion &&
                    rowDate === date;
            });

            if (!livraison) return null;

            let status = 'pending';
            if (livraison[LC.LIVRE]) status = 'delivered';
            else if (livraison[LC.EN_COURS]) status = 'in_progress';
            else if (livraison[LC.PRETE]) status = 'prepared';

            const famille = dataService.getFamilyDetails(familyId);

            return {
                family_id: familyId,
                family_name: famille?.nom || 'Inconnu',
                occasion: occasion,
                date: date,
                status: status,
                parts: livraison[LC.NOMBRE_PART],
                with_children: livraison[LC.AVEC_ENFANT] || false,
                driver_id: livraison[LC.ID_LIVREUR]
            };
        } catch (error) {
            logError(error, 'getLivraisonStatus');
            return null;
        }
    };

    const isValidToken = (token) => {
        if (!token) return false;

        const scriptProperties = PropertiesService.getScriptProperties();
        const validToken = scriptProperties.getProperty('API_TOKEN');

        if (!validToken) {
            const newToken = Utilities.getUuid();
            scriptProperties.setProperty('API_TOKEN', newToken);
            console.warn(`Nouveau token: ${newToken}`);
            return token === newToken;
        }

        return token === validToken;
    };

    const createJsonResponse = (data, statusCode = 200) => {
        const output = ContentService.createTextOutput(JSON.stringify(data));
        output.setMimeType(ContentService.MimeType.JSON);
        if (statusCode !== 200) data.http_status = statusCode;
        return output;
    };

    return {
        handleRequest,
        updateDeliveryStatus,
        getDeliveryStatus,
        isValidToken
    };
})();