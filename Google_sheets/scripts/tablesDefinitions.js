const SHEET_DEF = {
  RESPONSABLE: {
    SHEET_NAME: "reponsable",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      PRENOM: { INDEX: 3, TYPE: "string" },
      MAIL: { INDEX: 4, TYPE: "string" },
      TELEPHONE: { INDEX: 5, TYPE: "string" },
      SECTEUR: { INDEX: 6, TYPE: "string" },
      ROLE: { INDEX: 7, TYPE: "string" },
    },
  },
  LIVREUR: {
    SHEET_NAME: "livreur",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      PRENOM: { INDEX: 3, TYPE: "string" },
      MAIL: { INDEX: 4, TYPE: "string" },
      TELEPHONE: { INDEX: 5, TYPE: "string" },
      TYPE_VEHICULE: { INDEX: 6, TYPE: "string" },
      SECTEUR: { INDEX: 7, TYPE: "string" },
      ID_RESPONSABLE: { INDEX: 8, TYPE: "number" },
    },
  },
  FAMILLE: {
    SHEET_NAME: "famille",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      PRENOM_CONTACT: { INDEX: 3, TYPE: "string" },
      ZAKAT_EL_FITR: { INDEX: 4, TYPE: "boolean" },
      SADAQA: { INDEX: 5, TYPE: "boolean" },
      NOMBRE_ADULTE: { INDEX: 6, TYPE: "number" },
      NOMBRE_ENFANT: { INDEX: 7, TYPE: "number" },
      ADRESSE: { INDEX: 8, TYPE: "string" },
      ID_QUARTIER: { INDEX: 9, TYPE: "number" },
      SE_DEPLACE: { INDEX: 10, TYPE: "boolean" },
      TELEPHONE: { INDEX: 11, TYPE: "string" },
      TELEPHONE_BIS: { INDEX: 12, TYPE: "string" },
      CIRCONSTANCES: { INDEX: 13, TYPE: "string" },
      ETAT: { INDEX: 14, TYPE: "string" },
      PREMIER_CONTACT: { INDEX: 15, TYPE: "string" },
      RESSENTIT: { INDEX: 16, TYPE: "string" },
      SPECIFITES: { INDEX: 17, TYPE: "string" },
    }
  },
  LIVRAISON: {
    SHEET_NAME: "livraison",
    COLUMNS: {
      ID_FAMILLE: { INDEX: 1, TYPE: "number" },
      DATE_LIVRAISONS: { INDEX: 2, TYPE: "date" },
      OCCASION: { INDEX: 3, TYPE: "string" },
      ID_LIVREUR: { INDEX: 4, TYPE: "number" },
      ID_BINOME: { INDEX: 5, TYPE: "number" },
      NOMBRE_PART: { INDEX: 6, TYPE: "number" },
      AVEC_ENFANT: { INDEX: 7, TYPE: "boolean" },
      PRETE: { INDEX: 8, TYPE: "boolean" },
      EN_COURS: { INDEX: 9, TYPE: "boolean" },
      LIVRE: { INDEX: 10, TYPE: "boolean" },
      NOTE: { INDEX: 11, TYPE: "number" },
      COMMENTAIRE: { INDEX: 12, TYPE: "string" },
    }
  },
  QUARTIER: {
    SHEET_NAME: "quartier",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      LATITUDE: { INDEX: 3, TYPE: "number" },
      LOGITUDE: { INDEX: 4, TYPE: "number" },
      ID_VILLE: { INDEX: 5, TYPE: "number" }
    },
  },
  VILLE: {
    SHEET_NAME: "ville",
    COLUMNS: {
      ID: { INDEX: 1, TYPE: "number" },
      NOM: { INDEX: 2, TYPE: "string" },
      CODE_POSTAL: { INDEX: 3, TYPE: "number" },
      DEPARTEMENT: { INDEX: 4, TYPE: "string" },
      PAYS: { INDEX: 5, TYPE: "string" },
    },
  },
  AUX: {
    SHEET_NAME: "aux",
    COLUMNS: {
      USER_GROUP: { INDEX: 1, TYPE: "string" },
      OCCASION: { INDEX: 2, TYPE: "string" },
      LIVREURE: { INDEX: 2, TYPE: "string" },
    }
  },
  QUESTIONS_FORM: {
    HORODATEUR: "Horodateur",
    EMAIL: "Adresse e-mail",
    PROTECTION_DONNEES: "Protection des données personnelles",
    NOM: "Nom de famille",
    PRENOM: "Prénom de la personne à contacter",
    NUM_TEL: "Numéro de téléphone de la personne à contacter",
    HEBERGE: "Êtes-vous actuellement hébergé(e) par une personne ou une organisation ?",
    HEBERGE_PAR: "Par qui êtes-vous hébergé(e) ?",
    ADRESSE: "Adresse",
    NBR_ADULTES: "Combien d'adultes vivent actuellement dans votre foyer ?",
    NBR_ENFANTS: "Combien d'enfants vivent actuellement dans votre foyer ?",
    DESCRIPTION_SITUATION: "Décrivez brièvement votre situation actuelle",
    PIECE_IDENTITE_TYPE: "Type de pièce d'identité",
    PIECE_IDENTITE_JUSTIFICATIF: "Justificatif d’identité ou de résidence",
    ATTESTATION_CAF: "Attestation de la CAF (paiement et/ou quotient familial)",
    TRAVAIL: "Travaillez-vous actuellement, vous ou votre conjoint(e) ?",
    TRAVAIL_NBR_JOUR: "Combien de jours par semaine travaillez-vous ?",
    TRAVAIL_SECTEUR: "Dans quel secteur travaillez-vous ?",
    AUTRES_AIDES: "Percevez-vous actuellement des aides d'autres organismes ?",
    AUTRES_AIDES_JUSTIFICATIF: "Veuillez soumettre tous justificatif de ressources",
  },
}

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

function getFormQuestion(namedValues, question) {
  return namedValues[question][0];
}