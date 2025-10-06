/**
 * Utilitaires pour interagir avec Google Sheets
 * Fournit des fonctions helper pour accéder aux feuilles et colonnes
 */

/**
 * Récupère une feuille par son nom
 * @param {string} sheetName - Nom de la feuille
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheetByName(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName.trim());

    if (!sheet) {
        throw new Error(`Feuille "${sheetName}" introuvable`);
    }

    return sheet;
}

/**
 * Récupère toutes les données d'une feuille (sans l'en-tête)
 * @param {string} sheetName - Nom de la feuille
 * @returns {Array<Array>} Données de la feuille
 */
function getSheetDataByName(sheetName) {
    const sheet = getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    // Retourne toutes les lignes sauf l'en-tête
    return data.slice(1);
}

/**
 * Récupère l'index d'une colonne (base 0) à partir de son nom
 * @param {string} sheetName - Nom de la feuille
 * @param {string} columnName - Nom de la colonne
 * @returns {number} Index de la colonne (base 0)
 */
function getColumnIndex(sheetName, columnName) {
    return getRealColumnIndex(sheetName, columnName) - 1;
}

/**
 * Récupère l'index réel d'une colonne (base 1) à partir de son nom
 * @param {string} sheetName - Nom de la feuille
 * @param {string} columnName - Nom de la colonne
 * @returns {number} Index de la colonne (base 1)
 */
function getRealColumnIndex(sheetName, columnName) {
    const sheetDef = SHEET_DEF[sheetName.trim()];

    if (!sheetDef) {
        throw new Error(`Définition de feuille "${sheetName}" introuvable`);
    }

    const column = sheetDef.COLUMNS[columnName.trim()];

    if (!column) {
        throw new Error(`Colonne "${columnName}" introuvable dans la feuille "${sheetName}"`);
    }

    return column.INDEX;
}

/**
 * Récupère le type d'une colonne
 * @param {string} sheetName - Nom de la feuille
 * @param {string} columnName - Nom de la colonne
 * @returns {string} Type de la colonne
 */
function getColumnType(sheetName, columnName) {
    const sheetDef = SHEET_DEF[sheetName.trim()];

    if (!sheetDef) {
        throw new Error(`Définition de feuille "${sheetName}" introuvable`);
    }

    const column = sheetDef.COLUMNS[columnName.trim()];

    if (!column) {
        throw new Error(`Colonne "${columnName}" introuvable dans la feuille "${sheetName}"`);
    }

    return column.TYPE;
}

/**
 * Met à jour une cellule dans une feuille
 * @param {string} sheetName - Nom de la feuille
 * @param {number} row - Numéro de ligne (base 1)
 * @param {string} columnName - Nom de la colonne
 * @param {*} value - Valeur à insérer
 */
function updateCell(sheetName, row, columnName, value) {
    const sheet = getSheetByName(sheetName);
    const colIndex = getRealColumnIndex(sheetName, columnName);

    sheet.getRange(row, colIndex).setValue(value);
    console.log(`Cellule mise à jour: ${sheetName}[${row}, ${columnName}] = ${value}`);
}

/**
 * Met à jour plusieurs cellules d'un coup
 * @param {string} sheetName - Nom de la feuille
 * @param {Array<{row: number, column: string, value: *}>} updates - Liste des mises à jour
 */
function updateCells(sheetName, updates) {
    const sheet = getSheetByName(sheetName);

    updates.forEach(update => {
        const colIndex = getRealColumnIndex(sheetName, update.column);
        sheet.getRange(update.row, colIndex).setValue(update.value);
    });

    console.log(`${updates.length} cellules mises à jour dans ${sheetName}`);
}

/**
 * Ajoute une ligne à la fin d'une feuille
 * @param {string} sheetName - Nom de la feuille
 * @param {Array} rowData - Données de la ligne
 */
function appendRow(sheetName, rowData) {
    const sheet = getSheetByName(sheetName);
    sheet.appendRow(rowData);

    console.log(`Ligne ajoutée à ${sheetName}`);
}

/**
 * Ajoute plusieurs lignes à la fin d'une feuille
 * @param {string} sheetName - Nom de la feuille
 * @param {Array<Array>} rowsData - Données des lignes
 */
function appendRows(sheetName, rowsData) {
    if (!rowsData || rowsData.length === 0) return;

    const sheet = getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();

    sheet.getRange(lastRow + 1, 1, rowsData.length, rowsData[0].length)
        .setValues(rowsData);

    console.log(`${rowsData.length} lignes ajoutées à ${sheetName}`);
}

/**
 * Récupère une réponse de formulaire Google Forms
 * @param {Object} namedValues - Valeurs nommées du formulaire
 * @param {string} question - Question du formulaire
 * @returns {string} Réponse
 */
function getFormQuestion(namedValues, question) {
    if (!namedValues[question]) {
        console.warn(`Question "${question}" introuvable dans les réponses du formulaire`);
        return null;
    }

    return namedValues[question][0];
}