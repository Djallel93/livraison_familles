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
│   ├── contactService.js
│   ├── dataService.js
│   ├── deliveryService.js
│   ├── documentService.js
│   ├── notificationService.js
│   └── qrCodeService.js
├── triggers.js
├── ui
│   ├── dialog.html
│   ├── emailTemplates.js
│   └── menuControllers.js
└── utils
    ├── helpers.js
    └── sheetUtils.js
```

## 📄 Google Sheets Structure

### 📥 Form Responses (Raw data from Google Form) (The form exists in three languages)

| Column Name                                                              | Description              |
| ------------------------------------------------------------------------ | ------------------------ |
| Timestamp                                                                | Form submission time     |
| Email address                                                            | Contact email            |
| Protection des données personnelles                                      | Consent                  |
| Nom de famille                                                           | Family name              |
| Prénom de la personne à contacter                                        | Contact first name       |
| Numéro de téléphone de la personne à contacter                           | Contact phone            |
| Êtes-vous actuellement hébergé(e) par une personne ou une organisation ? | Hosted by someone?       |
| Par qui êtes-vous hébergé(e) ?                                           | Host details             |
| Adresse                                                                  | Delivery address         |
| Combien d'adultes vivent actuellement dans votre foyer ?                 | Number of adults         |
| Combien d'enfants vivent actuellement dans votre foyer ?                 | Number of children       |
| Décrivez brièvement votre situation actuelle                             | Description of situation |
| Type de pièce d'identité                                                 | ID type                  |
| Justificatif d’identité ou de résidence                                  | ID/Residence proof       |
| Attestation de la CAF (paiement et/ou quotient familial)                 | CAF statement(s)         |
| Travaillez-vous actuellement, vous ou votre conjoint(e) ?                | Employment status        |
| Combien de jours par semaine travaillez-vous ?                           | Working days per week    |
| Dans quel secteur travaillez-vous ?                                      | Work sector              |
| Percevez-vous actuellement des aides d'autres organismes ?               | Receiving other aid      |
| Veuillez soumettre tous justificatif de ressources                       | Other income proofs      |

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

---

### 🏙️ Ville (City Information)

| id | nom | code_postal | département | pays |

---

### Workflow

The targeted workflow is :

#### For familes

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

#### for drivers

```txt
1. driver submits Google Form
   ↓
2. onFormSubmit log into sheet livreur
```

#### for deliveries

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

The project is still in developpement so we can modify the google sheet and/or the GAS project structure if needed. Help me implement the missing functionalities and when done liste what can be improved/implemented to further automate and help us organize
