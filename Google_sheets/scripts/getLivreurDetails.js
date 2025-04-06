function getLivreurDetailsById(id) {
  console.log("type reçu dans getLivreurDetailsById()" + typeof id);

  if (typeof id !== "number") {
    console.error("Paramètres invalides fournis à getLivreurDetailsById");
    return null;
  }

  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);

  const idIndex = getColumnIndex("LIVREUR", "ID");
  const livreur = livreurData.find((row) => row[idIndex] === id);

  if (livreur) {
    console.log(`Le livreur ${id} existe dans la liste des livreurs`);
    return {
      nom: livreur[getColumnIndex("LIVREUR", "NOM")],
      prenom: livreur[getColumnIndex("LIVREUR", "PRENOM")],
      email: livreur[getColumnIndex("LIVREUR", "MAIL")],
      secteur: livreur[getColumnIndex("LIVREUR", "SECTEUR")],
      responsable: livreur[getColumnIndex("LIVREUR", "ID_RESPONSABLE")],
    };
  }

  console.error(
    `Le livreur ${id} n'existe pas dans la liste des livreurs`
  );
  return null;
}

function getLivreurDetailsByMail(email) {
  if (typeof email !== "string") {
    console.error("Paramètres invalides fournis à getLivreurDetailsByMail");
    return null;
  }

  const newEmail = email.trim().toLowerCase();
  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);

  const mailIndex = getColumnIndex("LIVREUR", "MAIL");
  const livreur = livreurData.find((row) => row[mailIndex] === newEmail);

  if (livreur) {
    console.log(`Le livreur ${email} existe dans la liste des livreurs`);
    return {
      nom: livreur[getColumnIndex("LIVREUR", "NOM")],
      prenom: livreur[getColumnIndex("LIVREUR", "PRENOM")],
      email: livreur[mailIndex],
      secteur: livreur[getColumnIndex("LIVREUR", "SECTEUR")],
      role: livreur[getColumnIndex("LIVREUR", "ROLE")],
    };
  }

  console.error(
    `Le livreur ${email} n'existe pas dans la liste des livreurs`
  );
  return null;
}

function getLivreurDetailsByName(fullName) {
  if (typeof fullName !== "string") {
    console.error("Paramètres invalides fournis à getLivreurDetailsByName");
    return null;
  }

  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);
  const nomIndex = getColumnIndex("LIVREUR", "NOM");
  const prenomIndex = getColumnIndex("LIVREUR", "PRENOM");
  const livreur = livreurData.find((row) => {
    const fullNameLivreur = row[nomIndex] + " " + row[prenomIndex];
    return fullNameLivreur === fullName;
  });

  if (livreur) {
    console.log(`Le livreur ${fullName} existe dans la liste des livreurs`);
    return {
      nom: livreur[getColumnIndex("LIVREUR", "NOM")],
      prenom: livreur[getColumnIndex("LIVREUR", "PRENOM")],
      email: livreur[getColumnIndex("LIVREUR", "MAIL")],
      secteur: livreur[getColumnIndex("LIVREUR", "SECTEUR")],
      role: livreur[getColumnIndex("LIVREUR", "ROLE")],
    };
  }
}

function getResponsableDetailsById(id) {
  if (typeof id !== "number") {
    console.error("Paramètres invalides fournis à getLivreurDetailsById");
    return null;
  }

  const responsableData = getSheetDataByName(SHEET_DEF.RESPONSABLE.SHEET_NAME);

  const idIndex = getColumnIndex("RESPONSABLE", "ID");
  const responsable = responsableData.find((row) => row[idIndex] === id);

  if (responsable) {
    console.log(`Le responsable ${id} existe dans la liste des responsables`);
    return {
      nom: responsable[getColumnIndex("RESPONSABLE", "NOM")],
      prenom: responsable[getColumnIndex("RESPONSABLE", "PRENOM")],
      email: responsable[getColumnIndex("RESPONSABLE", "MAIL")],
      telephone: formatNumeroTelephone(responsable[getColumnIndex("RESPONSABLE", "TELEPHONE")]),
      secteur: responsable[getColumnIndex("RESPONSABLE", "TELEPHONE")],
      role: responsable[getColumnIndex("RESPONSABLE", "ROLE")],
    };
  }

  console.error(
    `Le responsable ${id} n'existe pas dans la liste des responsables`
  );
  return null;
}

function getSuperAdmin() {
  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);
  const roleIndex = getColumnIndex("LIVREUR", "ROLE");
  const superAdmin = livreurData.find(
    (row) => row[roleIndex].toLowerCase() === "super admin"
  );

  return superAdmin[getColumnIndex("LIVREUR", "MAIL")]
}
