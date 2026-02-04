import ExcelJS from 'exceljs';

const filePath = 'D:/ControlDeCostos/server/data/ExcelDeudas.xlsx';

async function scanHeaders() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);

    workbook.eachSheet((worksheet) => {
        console.log(`\n=== SHEET: ${worksheet.name} ===`);
        console.log(`Max Columns: ${worksheet.columnCount}`);
        console.log(`Max Rows: ${worksheet.rowCount}`);

        // Scan specific known header rows for loan names
        // Galicia starts row 1/2. Headers usually row 3.
        const headerRows = [3, 17, 18, 50, 68]; // Guesses based on previous logs + logic

        // Or better, scan all rows and if we see "PRESTAMO" or "FECHA" print all values in that row
        worksheet.eachRow((row, rowNum) => {
            let hasPrestamo = false;
            let hasFecha = false;
            let rowValues = [];

            row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                const val = String(cell.value || '').toUpperCase();
                if (val.includes('PRESTAMO')) hasPrestamo = true;
                if (val.includes('FECHA')) hasFecha = true;
                if (val && val.length > 0) rowValues.push(`[${colNum}] ${val}`);
            });

            if (hasPrestamo || hasFecha) {
                console.log(`\nRow ${rowNum} (Headers found):`);
                console.log(rowValues.join(' | '));
            }
        });
    });
}

scanHeaders().catch(console.error);
