const SHEET_DEF = {
  LIVREUR: {
    SHEET_NAME: "livreur",
    COLUMNS: {
      NOM: { INDEX: 1, TYPE: "string" },
      PRENOM: { INDEX: 2, TYPE: "string" },
      MAIL: { INDEX: 3, TYPE: "string" },
      TELEPHONE: { INDEX: 4, TYPE: "string" },
      SECTEUR: { INDEX: 5, TYPE: "string" }, /////////
      ROLE: { INDEX: 6, TYPE: "string" },
    },
  },
  FAMILLE: {
    SHEET_NAME: "famille",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      PRENOM_CONTACT: { INDEX: 3, TYPE: "string" },
      CIRCONSTANCES: { INDEX: 4, TYPE: "string" },
      NOMBRE_ADULTE: { INDEX: 5, TYPE: "number" },
      NOMBRE_ENFANT: { INDEX: 6, TYPE: "number" },
      ADRESSE: { INDEX: 7, TYPE: "string" },
      ID_QUARTIER: { INDEX: 8, TYPE: "number" },
      TELEPHONE: { INDEX: 9, TYPE: "string" },
      ACCEPTE_DENRÉES: { INDEX: 10, TYPE: "boolean" },
      ETAT: { INDEX: 11, TYPE: "string" },
      PREMIER_CONTACT: { INDEX: 12, TYPE: "string" },
      SPECIFITES: { INDEX: 13, TYPE: "string" },
    }
  },
  QUARTIER: {
    SHEET_NAME: "quartier",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      LATITUDE: { INDEX: 3, TYPE: "number" },
      LOGITUDE: { INDEX: 4, TYPE: "number" },
      VILLE: { INDEX: 5, TYPE: "string" },
      CODE_POSTAL: { INDEX: 6, TYPE: "number" },
      REGION: { INDEX: 7, TYPE: "string" },
      PAYS: { INDEX: 8, TYPE: "string" },
    },
  },
  LIVRAISON: {
    SHEET_NAME: "livraison",
    COLUMNS: {
      ID_FAMILLE: { INDEX: 1, TYPE: "number" },
      DATE_LIVRAISONS: { INDEX: 2, TYPE: "date" },
      OCCASION: { INDEX: 3, TYPE: "string" },
      LIVREUR: { INDEX: 4, TYPE: "string" },
      NOMBRE_PART: { INDEX: 5, TYPE: "number" },
      AVEC_ENFANT: { INDEX: 6, TYPE: "boolean" },
      NOTE: { INDEX: 7, TYPE: "number" },
      COMMENTAIRE: { INDEX: 8, TYPE: "string" },
    },
  },
};

function getSheetByName(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName.trim());
}

function getSheetDataByName(sheetName) {
  return getSheetByName(sheetName).getDataRange().getValues().slice(1);
}

function getSheetDataByID(sheetID, sheetName) {
  const sheet = SpreadsheetApp.openById(sheetID).getSheetByName(
    sheetName.trim()
  );
  return sheet.getDataRange().getValues().slice(1);
}

function getColumnIndex(sheetName, columnName) {
  return getRealColumnIndex(sheetName, columnName) - 1;
}

function getRealColumnIndex(sheetName, columnName) {
  return SHEET_DEF[sheetName.trim()].COLUMNS[columnName.trim()].INDEX;
}

function getColumnType(sheetName, columnName) {
  return SHEET_DEF[sheetName.trim()].COLUMNS[columnName.trim()].TYPE;
}