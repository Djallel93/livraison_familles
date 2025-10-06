//Test Form
//https://docs.google.com/forms/d/e/1FAIpQLSeq4eAXHtatfkYuJfmJcJUZKtkuDjG9Vh8iV5Vpv8kHzoy2dQ/viewform?usp=pp_url&entry.539546559=J'accepte+les+termes+et+conditions+concernant+la+collecte+et+le+traitement+de+mes+donn%C3%A9es+personnelles.&entry.35203781=asdfasdf&entry.1584708515=asdfasdf&entry.1845584820=0123456789&entry.725085572=Organisation&entry.1217281205=115&entry.1664545685=Adresse,+Code+postale,+Ville&entry.163296825=2&entry.1174320112=3&entry.642162858=asdfasdfasdf&entry.704065237=Titre+de+s%C3%A9jour+/+R%C3%A9c%C3%A9piss%C3%A9&entry.1269559835=Partiellemet&entry.83322886=4&entry.1718168332=March%C3%A9&entry.1718168332=Livraison&entry.1718168332=Batiment&entry.1141152855=Association&entry.1141152855=Restau+du+coeur

/**
 * Script pour générer des données de test
 * À exécuter une seule fois depuis l'éditeur Apps Script
 */

function generateSampleData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    console.log('🚀 Génération des données de test...');

    // 1. Villes
    createSampleVilles(ss);

    // 2. Quartiers
    createSampleQuartiers(ss);

    // 3. Responsables
    createSampleResponsables(ss);

    // 4. Livreurs
    createSampleLivreurs(ss);

    // 5. Familles
    createSampleFamilles(ss);

    // 6. Livraisons
    createSampleLivraisons(ss);

    // 7. Auxiliaires
    createSampleAux(ss);

    console.log('✅ Données de test générées avec succès !');

    SpreadsheetApp.getUi().alert(
        'Succès',
        'Données de test générées !\n\n' +
        '5 villes\n' +
        '10 quartiers\n' +
        '3 responsables\n' +
        '5 livreurs\n' +
        '20 familles\n' +
        '20 livraisons\n\n' +
        'Vous pouvez maintenant tester le système.',
        SpreadsheetApp.getUi().ButtonSet.OK
    );
}

// ==========================================
// VILLES
// ==========================================
function createSampleVilles(ss) {
    let sheet = ss.getSheetByName('ville');
    if (!sheet) {
        sheet = ss.insertSheet('ville');
    } else {
        sheet.clear();
    }

    const headers = ['id', 'nom', 'code_postal', 'département', 'pays'];
    const data = [
        [1, 'Nantes', '44000', 'Loire-Atlantique', 'France'],
        [2, 'Rezé', '44400', 'Loire-Atlantique', 'France'],
        [3, 'Saint-Herblain', '44800', 'Loire-Atlantique', 'France'],
        [4, 'Orvault', '44700', 'Loire-Atlantique', 'France'],
        [5, 'Sautron', '44880', 'Loire-Atlantique', 'France']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    // Style
    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Villes créées');
}

// ==========================================
// QUARTIERS
// ==========================================
function createSampleQuartiers(ss) {
    let sheet = ss.getSheetByName('quartier');
    if (!sheet) {
        sheet = ss.insertSheet('quartier');
    } else {
        sheet.clear();
    }

    const headers = ['id', 'nom', 'latitude', 'longitude', 'id_ville'];
    const data = [
        [1, 'Centre-ville Nantes', 47.2184, -1.5536, 1],
        [2, 'Beaulieu', 47.2281, -1.5683, 1],
        [3, 'Malakoff', 47.2131, -1.5331, 1],
        [4, 'Doulon', 47.2486, -1.5111, 1],
        [5, 'Pont-Rousseau', 47.1833, -1.5500, 2],
        [6, 'Trentemoult', 47.1972, -1.5750, 2],
        [7, 'Bellevue', 47.2389, -1.6000, 3],
        [8, 'La Bottière', 47.2703, -1.5264, 4],
        [9, 'Centre Sautron', 47.2631, -1.6703, 5],
        [10, 'La Chapelle', 47.2400, -1.5400, 1]
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Quartiers créés');
}

// ==========================================
// RESPONSABLES
// ==========================================
function createSampleResponsables(ss) {
    let sheet = ss.getSheetByName('responsable');
    if (!sheet) {
        sheet = ss.insertSheet('responsable');
    } else {
        sheet.clear();
    }

    const headers = ['id', 'nom', 'prénom', 'mail', 'téléphone', 'secteur', 'rôle'];
    const data = [
        [1, 'Benali', 'Karim', 'karim.benali@amana.fr', '612345678', 'Nantes Centre', 'Responsable'],
        [2, 'Martin', 'Sophie', 'sophie.martin@amana.fr', '623456789', 'Nantes Nord', 'Responsable'],
        [3, 'Chakir', 'Fatima', 'fatima.chakir@amana.fr', '634567890', 'Périphérie', 'Coordinatrice']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Responsables créés');
}

// ==========================================
// LIVREURS
// ==========================================
function createSampleLivreurs(ss) {
    let sheet = ss.getSheetByName('livreur');
    if (!sheet) {
        sheet = ss.insertSheet('livreur');
    } else {
        sheet.clear();
    }

    const headers = ['id', 'nom', 'prénom', 'mail', 'téléphone', 'type_vehicule', 'secteur', 'id_responsable', 'rôle'];
    const data = [
        [1, 'Alami', 'Youssef', 'youssef.alami@gmail.com', '645678901', 'Voiture', 'Nantes Centre', 1, 'Livreur'],
        [2, 'Dubois', 'Pierre', 'pierre.dubois@gmail.com', '656789012', 'Voiture', 'Nantes Nord', 2, 'Livreur'],
        [3, 'El Amrani', 'Amina', 'amina.elamrani@gmail.com', '667890123', 'Scooter', 'Nantes Centre', 1, 'Livreur'],
        [4, 'Lemoine', 'Jean', 'jean.lemoine@gmail.com', '678901234', 'Voiture', 'Périphérie', 3, 'Livreur'],
        [5, 'Mansouri', 'Rachid', 'rachid.mansouri@gmail.com', '689012345', 'Camionnette', 'Périphérie', 3, 'Livreur']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Livreurs créés');
}

// ==========================================
// FAMILLES
// ==========================================
function createSampleFamilles(ss) {
    let sheet = ss.getSheetByName('famille');
    if (!sheet) {
        sheet = ss.insertSheet('famille');
    } else {
        sheet.clear();
    }

    const headers = [
        'id', 'nom', 'prénom_contact', 'Zakat_el_fitr', 'Sadaqa',
        'nombre_adulte', 'nombre_enfant', 'adresse', 'id_quartier',
        'se_deplace', 'email', 'téléphone', 'téléphone_bis',
        'Identité', 'CAF', 'circonstances', 'ressentit', 'spécificités', 'état_dossier'
    ];

    const data = [
        [1, 'Alaoui', 'Fatima', false, true, 2, 3, '12 rue de la République', 1, false, 'f.alaoui@gmail.com', '601234567', '602345678', 'CNI', 'Oui', 'Famille nombreuse, sans emploi', 'Bonne', 'Enfants en bas âge', 'Validé'],
        [2, 'Benkirane', 'Mohammed', true, false, 1, 0, '45 avenue des Tilleuls', 2, true, 'm.benkirane@gmail.com', '612345679', '', 'Passeport', 'Oui', 'Étudiant isolé', 'Correcte', '', 'Validé'],
        [3, 'Chakir', 'Aicha', false, true, 2, 2, '78 rue du Commerce', 3, false, 'a.chakir@gmail.com', '623456780', '624567891', 'CNI', 'Oui', 'Mère célibataire', 'Difficile', 'Allergie noix', 'Validé'],
        [4, 'Diallo', 'Ibrahim', true, true, 3, 4, '23 impasse des Roses', 4, false, 'i.diallo@gmail.com', '634567891', '', 'Titre séjour', 'En cours', 'Grande famille', 'Bonne', '2 enfants handicapés', 'Validé'],
        [5, 'El Idrissi', 'Khadija', false, false, 1, 1, '56 boulevard Liberté', 5, true, 'k.elidrissi@gmail.com', '645678902', '', 'CNI', 'Oui', 'Veuve avec enfant', 'Moyenne', '', 'Validé'],
        [6, 'Fathi', 'Hassan', true, false, 2, 0, '89 rue Victor Hugo', 6, true, 'h.fathi@gmail.com', '656789013', '', 'CNI', 'Oui', 'Couple retraité', 'Bonne', 'Diabète', 'Validé'],
        [7, 'Ghali', 'Samira', false, true, 1, 2, '34 avenue Jean Jaurès', 7, false, 's.ghali@gmail.com', '667890124', '668901235', 'CNI', 'Oui', 'Mère au foyer', 'Difficile', '', 'Validé'],
        [8, 'Hamidi', 'Youssef', true, true, 2, 1, '67 rue Voltaire', 8, false, 'y.hamidi@gmail.com', '678901235', '', 'CNI', 'Oui', 'Famille jeune', 'Moyenne', '', 'Validé'],
        [9, 'Idrissi', 'Nadia', false, false, 3, 3, '12 place de la Paix', 9, false, 'n.idrissi@gmail.com', '689012346', '690123457', 'Passeport', 'Oui', 'Famille nombreuse', 'Bonne', 'Enfants scolarisés', 'Validé'],
        [10, 'Jamal', 'Omar', true, false, 1, 0, '90 rue Gambetta', 10, true, 'o.jamal@gmail.com', '690123457', '', 'CNI', 'Non', 'Étudiant', 'Correcte', '', 'Validé'],
        [11, 'Karim', 'Leila', false, true, 2, 2, '45 avenue Carnot', 1, false, 'l.karim@gmail.com', '601234568', '', 'CNI', 'Oui', 'Famille monoparentale', 'Difficile', '', 'Validé'],
        [12, 'Lamrani', 'Said', true, true, 3, 2, '78 rue Diderot', 2, false, 's.lamrani@gmail.com', '612345680', '613456791', 'CNI', 'Oui', 'Père au chômage', 'Moyenne', '', 'Validé'],
        [13, 'Mansour', 'Fatima', false, false, 1, 3, '23 boulevard Zola', 3, false, 'f.mansour@gmail.com', '623456781', '', 'Titre séjour', 'En cours', 'Mère seule 3 enfants', 'Difficile', 'Enfant asthmatique', 'Validé'],
        [14, 'Naji', 'Ahmed', true, false, 2, 1, '56 rue Rousseau', 4, true, 'a.naji@gmail.com', '634567892', '', 'CNI', 'Oui', 'Couple jeune', 'Bonne', '', 'Validé'],
        [15, 'Ouardi', 'Rachida', false, true, 2, 4, '89 avenue Hugo', 5, false, 'r.ouardi@gmail.com', '645678903', '646789014', 'CNI', 'Oui', 'Grande famille', 'Moyenne', '', 'Validé'],
        [16, 'Qasmi', 'Khalid', true, true, 1, 0, '34 rue Molière', 6, true, 'k.qasmi@gmail.com', '656789014', '', 'Passeport', 'Non', 'Personne âgée seule', 'Difficile', 'Mobilité réduite', 'Validé'],
        [17, 'Rami', 'Salma', false, false, 2, 2, '67 place République', 7, false, 's.rami@gmail.com', '667890125', '', 'CNI', 'Oui', 'Famille récemment arrivée', 'Bonne', '', 'Validé'],
        [18, 'Saadi', 'Mustapha', true, false, 3, 1, '12 rue Lafayette', 8, false, 'm.saadi@gmail.com', '678901236', '679012347', 'CNI', 'Oui', 'Famille étendue', 'Moyenne', '', 'Validé'],
        [19, 'Tazi', 'Amina', false, true, 1, 2, '90 avenue Foch', 9, false, 'a.tazi@gmail.com', '689012347', '', 'Titre séjour', 'En cours', 'Mère célibataire', 'Difficile', '', 'Validé'],
        [20, 'Wahbi', 'Hassan', true, true, 2, 3, '45 boulevard Clemenceau', 10, false, 'h.wahbi@gmail.com', '690123458', '', 'CNI', 'Oui', 'Famille nombreuse', 'Moyenne', 'Jumeaux', 'Validé']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Familles créées');
}

// ==========================================
// LIVRAISONS
// ==========================================
function createSampleLivraisons(ss) {
    let sheet = ss.getSheetByName('livraison');
    if (!sheet) {
        sheet = ss.insertSheet('livraison');
    } else {
        sheet.clear();
    }

    const headers = [
        'id_famille', 'date_livraison', 'occasion', 'id_livreur', 'id_binome',
        'nombre_part', 'avec_enfant', 'prête', 'en_cours', 'livré', 'note', 'commentaire'
    ];

    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const data = [
        // Livraisons pour "Ramadan 2025" - prochaine semaine
        [1, nextWeek, 'Ramadan 2025', 1, null, 5, true, false, false, false, null, 'Route 1'],
        [2, nextWeek, 'Ramadan 2025', 1, null, 1, false, false, false, false, null, 'Route 2'],
        [3, nextWeek, 'Ramadan 2025', 1, null, 4, true, false, false, false, null, 'Route 3'],
        [4, nextWeek, 'Ramadan 2025', 1, null, 7, true, false, false, false, null, 'Route 4'],

        [5, nextWeek, 'Ramadan 2025', 2, null, 2, true, false, false, false, null, 'Route 1'],
        [6, nextWeek, 'Ramadan 2025', 2, null, 2, false, false, false, false, null, 'Route 2'],
        [7, nextWeek, 'Ramadan 2025', 2, null, 3, true, false, false, false, null, 'Route 3'],
        [8, nextWeek, 'Ramadan 2025', 2, null, 3, true, false, false, false, null, 'Route 4'],

        [9, nextWeek, 'Ramadan 2025', 3, null, 6, true, false, false, false, null, 'Route 1'],
        [10, nextWeek, 'Ramadan 2025', 3, null, 1, false, false, false, false, null, 'Route 2'],
        [11, nextWeek, 'Ramadan 2025', 3, null, 4, true, false, false, false, null, 'Route 3'],
        [12, nextWeek, 'Ramadan 2025', 3, null, 5, true, false, false, false, null, 'Route 4'],

        [13, nextWeek, 'Ramadan 2025', 4, null, 4, true, false, false, false, null, 'Route 1'],
        [14, nextWeek, 'Ramadan 2025', 4, null, 3, true, false, false, false, null, 'Route 2'],
        [15, nextWeek, 'Ramadan 2025', 4, null, 6, true, false, false, false, null, 'Route 3'],
        [16, nextWeek, 'Ramadan 2025', 4, null, 1, false, false, false, false, null, 'Route 4'],

        [17, nextWeek, 'Ramadan 2025', 5, null, 4, true, false, false, false, null, 'Route 1'],
        [18, nextWeek, 'Ramadan 2025', 5, null, 4, true, false, false, false, null, 'Route 2'],
        [19, nextWeek, 'Ramadan 2025', 5, null, 3, true, false, false, false, null, 'Route 3'],
        [20, nextWeek, 'Ramadan 2025', 5, null, 5, true, false, false, false, null, 'Route 4']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Livraisons créées');
}

// ==========================================
// AUXILIAIRES
// ==========================================
function createSampleAux(ss) {
    let sheet = ss.getSheetByName('aux');
    if (!sheet) {
        sheet = ss.insertSheet('aux');
    } else {
        sheet.clear();
    }

    const headers = ['user_group', 'occasion', 'livreur'];
    const data = [
        ['admin', 'Ramadan 2025', null],
        ['admin', 'Aïd al-Fitr 2025', null],
        ['admin', 'Aïd al-Adha 2025', null],
        ['livreur', null, 'Tous']
    ];

    sheet.appendRow(headers);
    data.forEach(row => sheet.appendRow(row));

    sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#4CAF50')
        .setFontColor('#FFFFFF');

    sheet.autoResizeColumns(1, headers.length);
    console.log('✓ Auxiliaires créés');
}

// ==========================================
// FONCTION DE NETTOYAGE
// ==========================================
function clearAllData() {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
        'Supprimer toutes les données ?',
        'Cette action supprimera toutes les feuilles de données de test. Continuer ?',
        ui.ButtonSet.YES_NO
    );

    if (response !== ui.Button.YES) {
        return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['ville', 'quartier', 'responsable', 'livreur', 'famille', 'livraison', 'aux'];

    sheets.forEach(sheetName => {
        const sheet = ss.getSheetByName(sheetName);
        if (sheet) {
            ss.deleteSheet(sheet);
            console.log(`✓ ${sheetName} supprimée`);
        }
    });

    ui.alert('Succès', 'Toutes les données de test ont été supprimées.', ui.ButtonSet.OK);
}