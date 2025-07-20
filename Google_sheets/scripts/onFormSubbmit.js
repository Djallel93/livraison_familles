function onFormSubmit(e) {
    try {
        console.log('Form submission detected, processing files...');

        const formResponses = e.namedValues; // The submitted form data as named values
        processFormSubmission(formResponses);

    } catch (error) {
        console.error('Error in onFormSubmit:', error);
    }
}

function processFormSubmission(formResponses) {
    const questions = SHEET_DEF.QUESTIONS_FORM;

    // Extract form data using your preferred method
    const nom = getFormQuestion(formResponses, questions.NOM);
    const prenom = getFormQuestion(formResponses, questions.PRENOM);
    const pieceIdentiteType = getFormQuestion(formResponses, questions.PIECE_IDENTITE_TYPE);
    const justificatifIdentite = getFormQuestion(formResponses, questions.PIECE_IDENTITE_JUSTIFICATIF);
    const attestationCaf = getFormQuestion(formResponses, questions.ATTESTATION_CAF);
    const justificatifRessources = getFormQuestion(formResponses, questions.AUTRES_AIDES_JUSTIFICATIF);

    if (!nom || !prenom) {
        console.warn('Missing name information, skipping file organization');
        return;
    }

    // Create parent folder "Dossier Familles"
    const parentFolder = createOrGetFolder(DriveApp.getRootFolder(), "Dossier Familles");

    // Create main folder for this family under the parent folder
    const mainFolderName = `${nom}_${prenom}`;
    const mainFolder = createOrGetFolder(parentFolder, mainFolderName);

    // Organize files by type
    organizeIdentityFiles(justificatifIdentite, pieceIdentiteType, mainFolder);
    organizeCafFiles(attestationCaf, mainFolder);
    organizeResourceFiles(justificatifRessources, mainFolder);

    console.log(`Processed files for: ${mainFolderName}`);
}

function organizeIdentityFiles(justificatifIdentite, pieceIdentiteType, mainFolder) {
    if (!justificatifIdentite) return;

    const identityFolder = createOrGetFolder(mainFolder, 'Justificatif_Identité');
    const files = extractFileUrls(justificatifIdentite);

    files.forEach(fileUrl => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const newFileName = pieceIdentiteType || 'Justificatif_Identite';
                const extension = getFileExtension(file.getName());

                // Copy file to the identity folder with new name
                const copiedFile = file.makeCopy(`${newFileName}${extension}`, identityFolder);
                console.log(`Copied identity file: ${copiedFile.getName()}`);
            }
        } catch (error) {
            console.error('Error processing identity file:', error);
        }
    });
}

function organizeCafFiles(attestationCaf, mainFolder) {
    if (!attestationCaf) return;

    const cafFolder = createOrGetFolder(mainFolder, 'Attestation_CAF');
    const files = extractFileUrls(attestationCaf);

    files.forEach(fileUrl => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const extension = getFileExtension(file.getName());

                // Copy file to the CAF folder
                const copiedFile = file.makeCopy(`Attestation_CAF${extension}`, cafFolder);
                console.log(`Copied CAF file: ${copiedFile.getName()}`);
            }
        } catch (error) {
            console.error('Error processing CAF file:', error);
        }
    });
}

function organizeResourceFiles(justificatifRessources, mainFolder) {
    if (!justificatifRessources) return;

    const resourceFolder = createOrGetFolder(mainFolder, 'Justificatif_ressources');
    const files = extractFileUrls(justificatifRessources);

    files.forEach((fileUrl, index) => {
        try {
            const fileId = extractFileIdFromUrl(fileUrl);
            if (fileId) {
                const file = DriveApp.getFileById(fileId);
                const extension = getFileExtension(file.getName());

                // Copy file to the resource folder with numbered naming if multiple files
                const fileName = files.length > 1 ?
                    `Justificatif_ressources_${index + 1}${extension}` :
                    `Justificatif_ressources${extension}`;

                const copiedFile = file.makeCopy(fileName, resourceFolder);
                console.log(`Copied resource file: ${copiedFile.getName()}`);
            }
        } catch (error) {
            console.error('Error processing resource file:', error);
        }
    });
}


function createOrGetFolder(parentFolder, folderName) {
    const folders = parentFolder.getFoldersByName(folderName);
    if (folders.hasNext()) {
        return folders.next();
    } else {
        return parentFolder.createFolder(folderName);
    }
}

function extractFileUrls(cellValue) {
    if (!cellValue) return [];

    // Handle different formats of file URLs in Google Forms
    const urls = [];
    const urlString = cellValue.toString();

    // Split by 'https://drive.google.com' to handle concatenated URLs
    const urlParts = urlString.split('https://drive.google.com').filter(part => part.length > 0);

    urlParts.forEach(part => {
        // Reconstruct the full URL
        const fullUrl = 'https://drive.google.com' + part;
        urls.push(fullUrl);
    });

    return urls;
}

function extractFileIdFromUrl(url) {
    // Extract file ID from Google Drive URL format: https://drive.google.com/open?id=FILE_ID
    const match = url.match(/[?&]id=([a-zA-Z0-9-_]+)/);

    if (match) {
        return match[1];
    }

    // Fallback patterns for other Google Drive URL formats
    const fallbackPatterns = [
        /\/file\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of fallbackPatterns) {
        const fallbackMatch = url.match(pattern);
        if (fallbackMatch) {
            return fallbackMatch[1];
        }
    }

    console.warn('Could not extract file ID from URL:', url);
    return null;
}

function getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot) : '';
}
