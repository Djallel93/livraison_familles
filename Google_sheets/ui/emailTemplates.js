/**
 * Extension du service de notification avec boutons de mise à jour
 * Intègre des boutons cliquables dans les emails pour mettre à jour les statuts
 */

/**
 * Génère l'email HTML amélioré avec boutons et QR codes
 */
function generateEnhancedDriverEmail(driver, deliveries, occasion, date, responsable) {
    const scriptProperties = PropertiesService.getScriptProperties();
    const apiUrl = scriptProperties.getProperty('API_URL');
    const token = scriptProperties.getProperty('API_TOKEN');

    const totalParts = deliveries.reduce((sum, d) => sum + d.nombreParts, 0);
    const withChildren = deliveries.filter(d => d.nombreEnfant > 0).length;

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
        <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: #fff; }
        .summary { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50; }
        .delivery { border: 1px solid #e0e0e0; padding: 20px; margin: 15px 0; border-radius: 8px; background: #fafafa; }
        .delivery-header { font-weight: bold; color: #4CAF50; margin-bottom: 15px; font-size: 18px; }
        .info-row { margin: 8px 0; font-size: 14px; }
        .label { font-weight: 600; color: #555; }
        .button-group { display: flex; gap: 10px; margin: 15px 0; flex-wrap: wrap; }
        .btn { 
            padding: 12px 24px; 
            border-radius: 6px; 
            text-decoration: none; 
            color: white; 
            font-weight: bold;
            display: inline-block;
            text-align: center;
            font-size: 14px;
        }
        .btn-prepared { background: #2196F3; }
        .btn-in-progress { background: #FF9800; }
        .btn-delivered { background: #4CAF50; }
        .btn-failed { background: #F44336; }
        .btn:hover { opacity: 0.9; }
        .qr-section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
        .qr-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 10px; }
        .qr-item { text-align: center; padding: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .qr-item img { width: 120px; height: 120px; }
        .qr-label { font-weight: bold; margin-top: 8px; font-size: 12px; }
        .footer { background: #f5f5f5; padding: 20px; text-align: center; margin-top: 20px; border-radius: 0 0 8px 8px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-children { background: #FFE082; color: #F57F17; }
        .instructions { background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196F3; }
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

        <div class="instructions">
        <h4 style="margin-top: 0;">📱 Comment mettre à jour les statuts</h4>
        <p><strong>Méthode 1 (Recommandée):</strong> Scannez les QR codes avec votre téléphone</p>
        <p><strong>Méthode 2 (Alternative):</strong> Cliquez sur les boutons ci-dessous si vous oubliez de scanner</p>
        </div>

        <h3>📍 Détails des livraisons</h3>`;

    // Ajouter chaque livraison
    deliveries.forEach((delivery, index) => {
        const qrCodes = QRCodeService.generateAllQRCodes(delivery.id, occasion, date);

        // URLs pour les boutons (paramètres courts)
        const preparedUrl = `${apiUrl}?a=update_status&t=${token}&fid=${delivery.id}&occ=${encodeURIComponent(occasion)}&d=${date}&s=prepared`;
        const inProgressUrl = `${apiUrl}?a=update_status&t=${token}&fid=${delivery.id}&occ=${encodeURIComponent(occasion)}&d=${date}&s=in_progress`;
        const deliveredUrl = `${apiUrl}?a=update_status&t=${token}&fid=${delivery.id}&occ=${encodeURIComponent(occasion)}&d=${date}&s=delivered`;
        const failedUrl = `${apiUrl}?a=update_status&t=${token}&fid=${delivery.id}&occ=${encodeURIComponent(occasion)}&d=${date}&s=failed`;

        html += `
<div class="delivery">
<div class="delivery-header">
📍 Livraison ${index + 1} - Famille #${delivery.id} - ${delivery.nom}
${delivery.nombreEnfant > 0 ? '<span class="badge badge-children">👶 Avec enfants</span>' : ''}
</div>

<div class="info-row"><span class="label">🏠 Adresse :</span> ${delivery.adresse}, ${delivery.codePostal} ${delivery.ville}</div>
<div class="info-row"><span class="label">📞 Téléphone :</span> ${delivery.telephone || 'Non renseigné'}</div>
${delivery.telephoneBis ? `<div class="info-row"><span class="label">📱 Tél. 2 :</span> ${delivery.telephoneBis}</div>` : ''}
<div class="info-row"><span class="label">📦 Parts :</span> <strong>${delivery.nombreParts}</strong></div>
${delivery.nombreEnfant > 0 ? `<div class="info-row" style="color: #F57F17;"><span class="label">⚠️ Enfants :</span> <strong>${delivery.nombreEnfant} enfant(s) - PRÉVOIR DES JOUETS 🎁</strong></div>` : ''}

<div class="qr-section">
<h4 style="margin: 0 0 10px 0;">🔲 QR Codes (À scanner)</h4>
<div class="qr-grid">
<div class="qr-item">
<img src="${qrCodes.prepared}" alt="QR Préparé"/>
<div class="qr-label" style="color: #2196F3;">✓ Préparé</div>
</div>
<div class="qr-item">
<img src="${qrCodes.in_progress}" alt="QR En cours"/>
<div class="qr-label" style="color: #FF9800;">🚚 En cours</div>
</div>
<div class="qr-item">
<img src="${qrCodes.delivered}" alt="QR Livré"/>
<div class="qr-label" style="color: #4CAF50;">✅ Livré</div>
</div>
<div class="qr-item">
<img src="${qrCodes.failed}" alt="QR Échec"/>
<div class="qr-label" style="color: #F44336;">❌ Échec</div>
</div>
</div>
</div>

<div style="margin-top: 15px;">
<strong>Si vous n'avez pas scanné:</strong>
<div class="button-group">
<a href="${preparedUrl}" class="btn btn-prepared">✓ Préparé</a>
<a href="${inProgressUrl}" class="btn btn-in-progress">🚚 En cours</a>
<a href="${deliveredUrl}" class="btn btn-delivered">✅ Livré</a>
<a href="${failedUrl}" class="btn btn-failed">❌ Échec</a>
</div>
</div>
</div>`;
    });

    html += `
</div>

<div class="footer">
${responsable ? `<p style="font-size: 14px;">📞 <strong>Contactez ${responsable.prenom} ${responsable.nom}</strong> après chaque livraison :<br>${responsable.telephone}</p>` : ''}
<p style="margin-top: 15px;">Merci pour votre aide précieuse ! 🙏</p>
<p style="font-size: 16px; margin-top: 10px;">بارك الله فيك</p>
<p style="font-size: 12px; color: #777; margin-top: 20px;">
En cas de problème avec les liens ou QR codes, contactez l'administrateur.
</p>
</div>
</body>
</html>`;

    return html;
}

/**
 * Envoie un email de notification amélioré à un livreur
 */
function sendEnhancedNotification(driverId, occasion, dateLivraison) {
    try {
        const driver = DataService.getLivreurDetailsById(Number(driverId));

        if (!driver || !driver.email) {
            throw new Error(`Livreur ${driverId} non trouvé ou sans email`);
        }

        const assignments = notificationService.getDriverAssignments(occasion, dateLivraison);
        const deliveries = assignments[driverId] || [];

        if (deliveries.length === 0) {
            console.warn(`Aucune livraison pour le livreur ${driverId}`);
            return;
        }

        const responsable = driver.responsable
            ? DataService.getResponsableDetailsById(driver.responsable)
            : null;

        const subject = `🚚 Livraisons ${occasion} - ${formatDate(dateLivraison)}`;
        const htmlBody = generateEnhancedDriverEmail(driver, deliveries, occasion, dateLivraison, responsable);
        const plainBody = notificationService.generateDriverEmailPlain(driver, deliveries, occasion, dateLivraison, responsable);

        MailApp.sendEmail({
            to: driver.email,
            subject: subject,
            body: plainBody,
            htmlBody: htmlBody,
            name: CONFIG.EMAIL_SENDER_NAME
        });

        console.log(`✅ Email amélioré envoyé à ${driver.prenom} ${driver.nom}`);

    } catch (error) {
        logError(error, 'sendEnhancedNotification');
        throw error;
    }
}

/**
 * Envoie les notifications améliorées à tous les livreurs
 */
function sendEnhancedNotificationsToAll(occasion, dateLivraison) {
    try {
        const assignments = notificationService.getDriverAssignments(occasion, dateLivraison);
        const results = { success: 0, failed: 0, errors: [] };

        for (const driverId of Object.keys(assignments)) {
            try {
                sendEnhancedNotification(driverId, occasion, dateLivraison);
                results.success++;
            } catch (error) {
                results.failed++;
                results.errors.push({ driverId, error: error.message });
                logError(error, `sendEnhancedNotification(${driverId})`);
            }
        }

        console.log(`✅ ${results.success} email(s) envoyé(s), ${results.failed} échec(s)`);
        return results;

    } catch (error) {
        logError(error, 'sendEnhancedNotificationsToAll');
        throw error;
    }
}

/**
 * Teste l'envoi d'un email amélioré
 */
function testEnhancedEmail() {
    const ui = SpreadsheetApp.getUi();
    const result = ui.prompt(
        'Test Email Amélioré',
        'Entrez: ID_Livreur|Occasion|Date (ex: 1|Ramadan|2025-04-01)',
        ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() === ui.Button.OK) {
        const parts = result.getResponseText().split('|');

        if (parts.length !== 3) {
            ui.alert('Format invalide');
            return;
        }

        const [livreurId, occasion, date] = parts.map(s => s.trim());

        try {
            sendEnhancedNotification(livreurId, occasion, date);
            ui.alert('Succès', 'Email de test envoyé !', ui.ButtonSet.OK);
        } catch (error) {
            ui.alert('Erreur', error.message, ui.ButtonSet.OK);
        }
    }
}