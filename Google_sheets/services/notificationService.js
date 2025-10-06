/**
 * Service de gestion des notifications
 * Gère l'envoi d'emails aux livreurs et responsables
 */

class NotificationService {
    constructor() {
        this.emailQuota = MailApp.getRemainingDailyQuota();
    }

    /**
     * Notifie tous les livreurs assignés pour une occasion
     * @param {string} occasion - Nom de l'occasion
     * @param {string} dateLivraison - Date de livraison
     * @returns {Object} Résultats des notifications
     */
    notifyAllDrivers(occasion, dateLivraison) {
        console.log(`📧 Notification de tous les livreurs: ${occasion} le ${dateLivraison}`);

        const assignments = this.getDriverAssignments(occasion, dateLivraison);
        const results = { success: 0, failed: 0, errors: [] };

        for (const [driverId, deliveries] of Object.entries(assignments)) {
            try {
                this.notifyDriver(driverId, occasion, dateLivraison, deliveries);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ driverId, error: error.message });
                logError(error, `notifyDriver(${driverId})`);
            }
        }

        console.log(`✅ ${results.success} livreur(s) notifié(s), ${results.failed} échec(s)`);
        return results;
    }

    /**
     * Récupère les assignations groupées par livreur
     * @param {string} occasion - Nom de l'occasion
     * @param {string} dateLivraison - Date de livraison
     * @returns {Object} Assignations par livreur
     */
    getDriverAssignments(occasion, dateLivraison) {
        const livraisonData = myCacheService.getCachedSheetData(SHEET_DEF.LIVRAISON.SHEET_NAME);

        const idLivreurIdx = getColumnIndex('LIVRAISON', 'ID_LIVREUR');
        const idFamilleIdx = getColumnIndex('LIVRAISON', 'ID_FAMILLE');
        const occasionIdx = getColumnIndex('LIVRAISON', 'OCCASION');
        const dateIdx = getColumnIndex('LIVRAISON', 'DATE_LIVRAISONS');
        const livreIdx = getColumnIndex('LIVRAISON', 'LIVRE');
        const nbrPartIdx = getColumnIndex('LIVRAISON', 'NOMBRE_PART');

        const assignments = {};

        livraisonData.forEach(row => {
            const rowDate = formatDateISO(new Date(row[dateIdx]));
            const driverId = row[idLivreurIdx];

            // Ignorer si pas de livreur ou déjà livré
            if (!driverId || row[livreIdx] === true) return;

            if (row[occasionIdx] === occasion && rowDate === dateLivraison) {
                if (!assignments[driverId]) {
                    assignments[driverId] = [];
                }

                const familyData = dataService.getFamilyDetails(row[idFamilleIdx]);
                if (familyData) {
                    assignments[driverId].push({
                        ...familyData,
                        nombreParts: row[nbrPartIdx]
                    });
                }
            }
        });

        return assignments;
    }

    /**
     * Notifie un livreur spécifique
     * @param {number} driverId - ID du livreur
     * @param {string} occasion - Nom de l'occasion
     * @param {string} dateLivraison - Date de livraison
     * @param {Array<Object>} [deliveries] - Liste des livraisons (optionnel)
     */
    notifyDriver(driverId, occasion, dateLivraison, deliveries = null) {
        const driverInfo = dataService.getLivreurDetailsById(Number(driverId));

        if (!driverInfo) {
            throw new Error(`Livreur ${driverId} introuvable`);
        }

        // Récupérer les livraisons si non fournies
        if (!deliveries) {
            const allAssignments = this.getDriverAssignments(occasion, dateLivraison);
            deliveries = allAssignments[driverId] || [];
        }

        if (deliveries.length === 0) {
            console.warn(`Aucune livraison pour le livreur ${driverId}`);
            return;
        }

        const responsableInfo = driverInfo.responsable
            ? dataService.getResponsableDetailsById(driverInfo.responsable)
            : null;

        const subject = `🚚 Livraisons ${occasion} - ${formatDate(dateLivraison)}`;
        const htmlBody = this.generateDriverEmailHTML(driverInfo, deliveries, occasion, dateLivraison, responsableInfo);
        const plainBody = this.generateDriverEmailPlain(driverInfo, deliveries, occasion, dateLivraison, responsableInfo);

        // Vérifier le quota
        if (this.emailQuota <= 0) {
            throw new Error('Quota d\'emails quotidien dépassé');
        }

        const options = {
            name: CONFIG.EMAIL_SENDER_NAME,
            htmlBody: htmlBody,
            noReply: false
        };

        MailApp.sendEmail(driverInfo.email, subject, plainBody, options);
        this.emailQuota--;

        console.log(`✅ Email envoyé à ${driverInfo.prenom} ${driverInfo.nom}`);
    }

    /**
     * Génère le corps HTML de l'email pour un livreur
     */
    generateDriverEmailHTML(driver, deliveries, occasion, date, responsable) {
        const totalParts = deliveries.reduce((sum, d) => sum + d.nombreParts, 0);
        const withChildren = deliveries.filter(d => d.nombreEnfant > 0).length;

        let html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 20px; background: #fff; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    .delivery { border: 1px solid #e0e0e0; padding: 15px; margin: 10px 0; border-radius: 8px; background: #fafafa; }
    .delivery-header { font-weight: bold; color: #4CAF50; margin-bottom: 10px; font-size: 16px; }
    .info-row { margin: 8px 0; font-size: 14px; }
    .label { font-weight: 600; color: #555; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; margin-top: 20px; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge-children { background: #FFE082; color: #F57F17; }
    .emoji { font-size: 18px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚚 Vos Livraisons - ${occasion}</h1>
    <p style="margin: 5px 0; font-size: 18px;">${formatDate(date)}</p>
  </div>
  
  <div class="content">
    <p>السلام عليكم و رحمة الله و بركاته</p>
    <p>Cher/Chère <strong>${driver.prenom} ${driver.nom}</strong>,</p>
    <p>Voici la liste des familles à livrer pour l'occasion de <strong>${occasion}</strong>.</p>
    
    <div class="summary">
      <h3 style="margin-top: 0;">📊 Résumé de vos livraisons</h3>
      <div class="info-row">✅ Nombre de familles : <strong>${deliveries.length}</strong></div>
      <div class="info-row">📦 Total de parts : <strong>${totalParts}</strong></div>
      <div class="info-row">👶 Familles avec enfants : <strong>${withChildren}</strong></div>
    </div>
    
    <h3>📍 Détails des livraisons</h3>`;

        deliveries.forEach((delivery, index) => {
            html += `
    <div class="delivery">
      <div class="delivery-header">
        Livraison ${index + 1} - Famille #${delivery.id} - ${delivery.nom}
        ${delivery.nombreEnfant > 0 ? '<span class="badge badge-children">👶 Avec enfants</span>' : ''}
      </div>
      <div class="info-row"><span class="label">📍 Adresse :</span> ${delivery.adresse}, ${delivery.codePostal} ${delivery.ville}</div>
      <div class="info-row"><span class="label">📞 Téléphone :</span> ${delivery.telephone || 'Non renseigné'}</div>
      ${delivery.telephoneBis ? `<div class="info-row"><span class="label">📱 Tél. 2 :</span> ${delivery.telephoneBis}</div>` : ''}
      <div class="info-row"><span class="label">📦 Parts :</span> <strong>${delivery.nombreParts}</strong></div>
      ${delivery.nombreEnfant > 0 ? `<div class="info-row" style="color: #F57F17;"><span class="label">⚠️ Enfants :</span> <strong>${delivery.nombreEnfant} enfant(s) - PRÉVOIR DES JOUETS 🎁</strong></div>` : ''}
    </div>`;
        });

        html += `
  </div>
  
  <div class="footer">
    ${responsable ? `<p style="font-size: 14px;">📞 <strong>Contactez ${responsable.prenom} ${responsable.nom}</strong> après chaque livraison :<br>${responsable.telephone}</p>` : ''}
    <p style="margin-top: 15px;">Merci pour votre aide précieuse ! 🙏</p>
    <p style="font-size: 16px; margin-top: 10px;">بارك الله فيك</p>
  </div>
</body>
</html>`;

        return html;
    }

    /**
     * Génère le corps texte de l'email pour un livreur
     */
    generateDriverEmailPlain(driver, deliveries, occasion, date, responsable) {
        const totalParts = deliveries.reduce((sum, d) => sum + d.nombreParts, 0);

        let text = `السلام عليكم و رحمة الله و بركاته\n\n`;
        text += `Cher/Chère ${driver.prenom} ${driver.nom},\n\n`;
        text += `Voici la liste des familles à livrer pour l'occasion de "${occasion}".\n`;
        text += `Date de livraison : ${formatDate(date)}\n\n`;
        text += `=== RÉSUMÉ ===\n`;
        text += `Nombre de familles : ${deliveries.length}\n`;
        text += `Total de parts : ${totalParts}\n\n`;
        text += `=== LIVRAISONS ===\n\n`;

        deliveries.forEach((delivery, index) => {
            text += `📍 Livraison ${index + 1} - Famille #${delivery.id}\n`;
            text += `Nom : ${delivery.nom}\n`;
            text += `Adresse : ${delivery.adresse}, ${delivery.codePostal} ${delivery.ville}\n`;
            text += `Téléphone : ${delivery.telephone || 'Non renseigné'}\n`;
            if (delivery.telephoneBis) {
                text += `Tél. 2 : ${delivery.telephoneBis}\n`;
            }
            text += `Nombre de parts : ${delivery.nombreParts}\n`;
            if (delivery.nombreEnfant > 0) {
                text += `⚠️ ${delivery.nombreEnfant} enfant(s) - PRÉVOIR DES JOUETS\n`;
            }
            text += `\n`;
        });

        if (responsable) {
            text += `\n📞 Contactez ${responsable.prenom} ${responsable.nom} (${responsable.telephone}) après chaque livraison.\n`;
        }
        text += `\nMerci pour votre aide !\n\nبارك الله فيك`;

        return text;
    }

    /**
     * Envoie un rapport aux administrateurs
     * @param {string} occasion - Nom de l'occasion
     * @param {string} dateLivraison - Date de livraison
     */
    sendAdminReport(occasion, dateLivraison) {
        const superAdminEmail = dataService.getSuperAdminEmail();

        if (!superAdminEmail) {
            throw new Error('Email du super admin introuvable');
        }

        const inventory = deliveryService.calculateInventoryNeeds(occasion, dateLivraison);
        const assignments = this.getDriverAssignments(occasion, dateLivraison);

        const subject = `📊 Rapport - ${occasion} (${formatDate(dateLivraison)})`;

        let body = `Rapport de livraison pour ${occasion}\n`;
        body += `Date : ${formatDate(dateLivraison)}\n\n`;
        body += `=== STATISTIQUES ===\n`;
        body += `Familles : ${inventory.totalFamilies}\n`;
        body += `Parts totales : ${inventory.totalParts}\n`;
        body += `Kits jouets : ${inventory.totalToyKits}\n`;
        body += `Kits hygiène : ${inventory.totalHygieneKits}\n`;
        body += `Livreurs assignés : ${Object.keys(assignments).length}\n\n`;
        body += `=== RÉPARTITION PAR LIVREUR ===\n`;

        for (const [driverId, deliveries] of Object.entries(assignments)) {
            const driver = dataService.getLivreurDetailsById(Number(driverId));
            if (driver) {
                const totalParts = deliveries.reduce((sum, d) => sum + d.nombreParts, 0);
                body += `• ${driver.nom} ${driver.prenom} : ${deliveries.length} familles (${totalParts} parts)\n`;
            }
        }

        MailApp.sendEmail(superAdminEmail, subject, body);
        console.log(`✅ Rapport envoyé au super admin: ${superAdminEmail}`);
    }
}

// Instance singleton
const notificationService = new NotificationService();