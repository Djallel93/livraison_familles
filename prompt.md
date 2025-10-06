# Livraison

## Claude Prompt

I'm building a **Google Apps Script project** to manage and organize **food and essentials deliveries** for families who submit a **Google Form**.

---

## Project Purpose

This system automates the complete lifecycle of charitable food deliveries:

**The Challenge:**
Organizations distributing food aid to families face complex logistics:

- Correctly registering families
- Matching families to available drivers
- Calculating food quantities based on family size
- Organizing delivery routes efficiently
- Tracking delivery status
- Managing inventory needs
- Communicating with volunteers

---

## 📄 Project folder Structure

```txt
Google_sheets/
├── api
│   └── endpoint.js
├── config.js
├── services
│   ├── apiService.js
│   ├── cacheService.js
│   ├── contactService.js
│   ├── dataService.js
│   ├── deliveryService.js
│   ├── documentService.js
│   ├── driveService.js
│   ├── formHandlers.js
│   ├── geocodingService.js
│   ├── notificationService.js
│   └── qrCodeService.js
├── triggers.js
├── ui
│   ├── dialog.html
│   ├── familySelection.html
│   └── menuControllers.js
└── utils
    ├── helpers.js
    └── sheetUtils.js
```

## 📄 Google Sheets Structure

### 📥 Form Responses

The titles contain spaces at the end sometimes and this needs to be taken account when parsing responses

#### Familles

The form exists in three languages this is the french language and later i will add the arabic and english versions. Note that multiple forms implies multiple shhets to record responses and multiple drive folders to store files

|Timestamp | Email address | Protection des données personnelles | Nom de famille  | Prénom de la personne à contacter  | Numéro de téléphone de la personne à contacter  | Êtes-vous actuellement hébergé(e) par une personne ou une organisation ?  | Par qui êtes-vous hébergé(e) ?  | Adresse | Combien d'adultes vivent actuellement dans votre foyer ?  | Combien d'enfants vivent actuellement dans votre foyer ?  | Décrivez brièvement votre situation actuelle  | Type de pièce d'identité  | Justificatif d’identité ou de résidence  | Attestation de la CAF (paiement et/ou quotient familial)  | Attestation de la CAF (paiement et/ou quotient familial) | Travaillez-vous actuellement, vous ou votre conjoint(e) ?  | Combien de jours par semaine travaillez-vous ?  | Dans quel secteur travaillez-vous ?  | Percevez-vous actuellement des aides d'autres organismes ?  | Veuillez soumettre tous justificatif de ressources |

#### livreurs

|Timestamp | Email address | Nom | Prénom | Numéro de téléphone  | Disponibilité | Quel type de véhicule possédez-vous ?  | Avez vous le permis ? | Merci d’indiquer vos préférences en matière de zone de livraison | Merci d’indiquer vos préférences sur Nantes |

For the question "Merci d’indiquer vos préférences en matière de zone de livraison" possible answers are :

- Je peux livrer à Nantes et en dehors de Nantes => secteur = all
- Je ne peux livrer que dans Nantes => secteur = seteurs de Nantes (secteur where nom_ville = Nantes)
- Je ne peux livrer que dans certains lieux spécifiques sur Nantes (see next question)
- Other (leave secteur empty until admin interviens)

For the question "Merci d’indiquer vos préférences sur Nantes" possible answers are :

- Nantes Nord
- Nantes West
- Nantes Est
- Nantes Sud
- Nantes Centre
- Other (leave secteur empty until admin interviens)

---

### 👥 Responsable (Admins / Volunteers)

| id | nom | prénom | mail | téléphone | secteur | rôle |

---

### 👥 livreur

| id | nom | prénom | mail | téléphone | type_vehicule | id_secteur | id_responsable |

---

### 👨‍👩‍👧‍👦 Famille (Cleaned & Enriched Data)

| id | nom | prénom_contact | Zakat_el_fitr | Sadaqa | nombre_adulte | nombre_enfant | adresse | id_quartier | se_deplace | email | téléphone | téléphone_bis | Identité | CAF | circonstances | ressentit | spécificités | état_dossier |

Identité et CAF sont de type chip et pointe sur le fichier drive correspondant

---

### 🚚 Livraison (Delivery History & Assignments)

| id_famille | date_livraison | occasion | id_livreur | id_binome | nombre_part | avec_enfant | statut | note | commentaire |

---

### 🏘️ Quartier (Neighborhood Mapping)

| id | nom | latitude | longitude | id_secteur |

---

### 📍 Secteur (Sectors for Admin/Livreur Assignment)

| id | nom | latitude | longitude | id_ville |

nom is always : Nord,  West, Est, Sud, Centre

---

### 🏙️ Ville (City Information)

| id | nom | code_postal | département | pays |

---

## 📂 Google Drive folder Structure

```txt
root/
├── gestion_familles
│   ├── familles (Google sheets)
│   └── Google Formes
│     ├── formulaire_livreur (Google Formes)
│     ├── formulaire_familles_fr (Google Formes)
│     ├── formulaire_familles_ar (Google Formes)
│     ├── formulaire_familles_en (Google Formes)
│     ├── Formulaire Inscription FR (File responses)
        ├── Attestation de la CAF (paiement et/ou quotient familial)  (File responses)
        ├── Veuillez soumettre tous justificatif de ressources (File responses)
        ├── Attestation de la CAF (paiement et/ou quotient familial) (File responses)
        └── Justificatif d’identité ou de résidence  (File responses)
│     ├── Formulaire Inscription AR (File responses)
        ├── شهادة من صندوق إعانات الأسرة (CAF) – (الدفع و/أو المعيار الاجتماعي) (File responses)
        ├── يُرجى تقديم جميع المستندات التي تثبت الموارد (File responses)
        ├── شهادة من صندوق إعانات الأسرة (CAF) – (الدفع و/أو المعيار الاجتماعي) (File responses)
        └── مستند إثبات الهوية أو السكن (File responses)
│     └── Formulaire Inscription EN (File responses)
        ├── Certificate from CAF (payment and/or family quotient) (File responses)
        ├── Please submit all proof of income/resources (File responses)
        ├── Certificate from CAF (payment and/or family quotient) (File responses)
        └── Proof of identity or residence (File responses)
```

## Workflow

The targeted workflow is :

### For familes

```txt
1. Family submits Google Form (multiple forms exists (at least 3 with three languages: french, arabic and english))
   ↓
2. onFormSubmit log into temp data
   ↓
3. Validate info and documents. When valid change status (état_dossier = "Validé")
   ↓
5. Files organized in Drive folders
   ↓
7. Contact is created in Google contacts
   ↓
8. If info is updated :
   - if phone changes -> contact must be updated
   - if adress changes -> adress, contact and id_quartier must be updated
   - if documents are updated the full process must restart
```

### for drivers

```txt
1. driver submits Google Form
   ↓
2. onFormSubmit log into sheet livreur
```

### for deliveries

```txt
1. When enough food is gathered
   ↓
2. Admin runs a script : select families to deliver (Only families with état_dossier = "Validé" are displayed in UI)
   ↓
3. the sheet 'Livraison' is populated with : id_famille, date_livraison, occasion, nombre_part, avec_enfant and statut 'en préparation'. The sheet is ordered from farthest to closest to the association adress (a config parameter: adress or coordiantes ?) 
   ↓
4. Admin runs assignment algorithm Or assign drivers to each delivery
   ↓
5. Documents generated (in a google drive folder (name of folder in config)) for prep team to know how many bags (nombre_part) they have to prepare
   The document Has the full name of the driver at the TOP in bold and BIG
   and beneath is a table with these columns
   | ID | Adresse | Nombre de parts | Avec/Sans enfant | Tél. | Tél. Bis | QR Code |
   A driver can have one or many deliveries and the table must be filled accordingly
   The Qr code updates the status of delivery to 'prête'
   ↓
6. When prep is done they scan QR code or directly in google sheets switch statut to 'prête'
   ↓
7. If all deliveries of a driver have statut to 'prête', drivers receive email notifications and start loading. switch statut to 'en cours de livraison'. The email contain all necessary information :
   ID, Adresse, Nombre de parts, Avec/Sans enfant, Tél., Tél. Bis and a link (in a button) to update delivery status ('succes' or 'echec')
   ↓
9.  Same document is generated for them as in step 5 except the QR code here updates to 'succes' in case they are not at ease with using email/Qr codes
   ↓
10. Drivers complete deliveries
   ↓
11. Sccan QR code or clic link in email -> Status updated 'livré' or 'echec'
```

The project is still in developpement so we can modify the google sheet and/or the GAS project structure if needed. Help me implement the missing functionalities and when done write a migration guide with how to modify the current project with your updates
