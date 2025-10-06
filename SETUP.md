# Guide de Configuration de l'API de Livraison AMANA

Ce guide vous accompagne pas à pas pour activer les services Google nécessaires, déployer l'application web, puis effectuer les configurations post-migration pour l'API de livraison AMANA.

---

## Étape 1 : Activer les services Google requis

Dans l'**éditeur Apps Script**, cliquez sur **Services** (icône ➕ à gauche)  
Ajoutez les services suivants :

- **Google Maps Service** → Ajouter  
- **People API** → Ajouter  
- **Drive API** → Ajouter (si ce n’est pas déjà fait)

---

## Étape 2 : Déployer l'application Web

1. Cliquez sur **Déployer → Nouveau déploiement**
2. Configurez les éléments suivants :
   - **Type** : Application web  
   - **Description** : `"AMANA Delivery API v1"`  
   - **Exécuter en tant que** : *Moi*  
   - **Qui a accès** : *Tout le monde*
3. Cliquez sur **Déployer**
4. Copiez l’**URL de l’application web** (vous en aurez besoin à l’étape 3)

---

## Étape 3 : Configuration post-migration

Effectuez les actions suivantes **dans l’ordre** :

1. **Rechargez la feuille de calcul** (fermez-la puis rouvrez-la)
2. Allez dans **Menu → AMANA → Configuration → 🚀 Configuration initiale**
   - Enregistrez le **jeton (token)** affiché
3. Allez dans **Menu → Géocodage → Configurer coordonnées association**
   - Entrez les coordonnées de votre association (`47.245919, -1.604143`)
4. Allez dans **Menu → Configuration → Configurer dossier Drive**
   - Créez un dossier sur Drive
   - Récupérez son **ID dans l’URL**

   ```txt
   exemple pour `"https://drive.google.com/drive/folders/13hfusAu979bvV321WS4PqEW4ha6r-qdS?dmr=1&ec=wgc-drive-globalnav-goto"`
   -> ID = `13hfusAu979bvV321WS4PqEW4ha6r-qdS`
   ```

   - Collez cet ID dans le champ prévu
5. Allez dans **Menu → Configuration → Configurer URL API**
   - Collez l’**URL de l’application web** copiée à l’étape 2
6. Allez dans **Menu → Configuration → Installer triggers**
   - Entrez l’**ID du formulaire Familles**
   - Entrez l’**ID du formulaire Chauffeurs**

---

✅ **C’est terminé !** Votre API de livraison AMANA est maintenant entièrement configurée et prête à être utilisée.
