function onEdit(e) {
    const sheet = e.source.getActiveSheet();
    // const sheetName = sheet.getName();
    const editedRow = e.range;

    updateNbrPart(sheet, editedRow);
}
