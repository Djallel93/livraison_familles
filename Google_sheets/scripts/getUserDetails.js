function getUserDetailsByMail(email) {
  if (typeof email !== "string") {
    console.error("Paramètres invalides fournis à getUserDetailsByMail");
    return null;
  }

  const newEmail = email.trim().toLowerCase();
  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);

  const mailIndex = getColumnIndex("LIVREUR", "MAIL");
  const livreur = livreurData.find((row) => row[mailIndex] === newEmail);

  if (livreur) {
    console.log(`Le frère ${email} existe dans la liste des utilisateurs`);
    return {
      nom: livreur[getColumnIndex("LIVREUR", "NOM")],
      prenom: livreur[getColumnIndex("LIVREUR", "PRENOM")],
      email: livreur[mailIndex],
      secteur: livreur[getColumnIndex("LIVREUR", "SECTEUR")],
      role: livreur[getColumnIndex("LIVREUR", "ROLE")],
    };
  }

  console.error(
    `Le frère ${email} n'existe pas dans la liste des utilisateurs`
  );
  return null;
}

function getUserDetailsByName(fullName) {
  if (typeof fullName !== "string") {
    console.error("Paramètres invalides fournis à getUserDetailsByName");
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
    console.log(`Le frère ${fullName} existe dans la liste des utilisateurs`);
    return {
      nom: livreur[getColumnIndex("LIVREUR", "NOM")],
      prenom: livreur[getColumnIndex("LIVREUR", "PRENOM")],
      email: livreur[mailIndex],
      secteur: livreur[getColumnIndex("LIVREUR", "SECTEUR")],
      role: livreur[getColumnIndex("LIVREUR", "ROLE")],
    };
  }
}

function getSuperAdmin() {
  const livreurData = getSheetDataByName(SHEET_DEF.LIVREUR.SHEET_NAME);
  const roleIndex = getColumnIndex("LIVREUR", "ROLE");
  const superAdmin = livreurData.find(
    (row) => row[roleIndex].toLowerCase() === "super admin"
  );

  return superAdmin[getColumnIndex("LIVREUR", "MAIL")]
}
