import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');

const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);

workbook.eachSheet((worksheet) => {
    console.log(`\n=== SHEET: ${worksheet.name} ===`);
    console.log(`Rows: ${worksheet.rowCount}, Cols: ${worksheet.columnCount}`);

    // Only print first 5 rows raw
    for (let r = 1; r <= 5; r++) {
        const row = worksheet.getRow(r);
        let rowData = `Row ${String(r).padStart(2,'0')}: `;
        for (let c = 1; c <= Math.min(worksheet.columnCount, 16); c++) {
            const cell = row.getCell(c);
            let val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
            const fill = cell.fill;
            const argb = fill?.fgColor?.argb || fill?.bgColor?.argb || '';
            const valStr = (val !== null && val !== undefined ? String(val).substring(0,12) : '').padEnd(12);
            rowData += `C${String(c).padStart(2,'0')}:"${valStr}"[${argb||'NONE'}] `;
        }
        console.log(rowData);
    }

    // Also count paid vs pending
    let paid = 0, pending = 0, zeroAmount = 0, unknown = 0;
    let inData = false;
    for (let r = 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        let isHeaderRow = false;
        row.eachCell({ includeEmpty: true }, (cell) => {
            if (String(cell.value || '').toUpperCase() === 'FECHA') isHeaderRow = true;
        });
        if (isHeaderRow) { inData = true; continue; }
        if (!inData) continue;
        
        // First cell - check if it's "TOTAL"
        const firstVal = String(row.getCell(1).value || '').trim().toUpperCase();
        if (firstVal === 'TOTAL' || firstVal === 'TOTAL MENS' || firstVal === 'NARANJA') continue;

        for (let c = 2; c <= Math.min(worksheet.columnCount, 16); c += 2) {
            const cell = row.getCell(c);
            let val = cell.value;
            if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
            if (val === null || val === undefined || val === 0 || val === '') continue;
            
            const numVal = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]/g,''));
            if (isNaN(numVal) || numVal <= 0) continue;

            const fill = cell.fill;
            const argb = (fill?.fgColor?.argb || fill?.bgColor?.argb || '').toUpperCase();
            
            if (argb.includes('38761D') || argb.includes('6AA84F') || argb.includes('34A853') ||
                argb.includes('00B050') || argb.includes('92D050') || argb.includes('00FF00')) {
                paid++;
            } else if (argb.includes('FF9900') || argb.includes('FFA500') || argb === 'NONE' || argb === '') {
                pending++;
            } else if (argb.includes('FFFFFF') || argb.includes('434343')) {
                // White or grey - probably pending or empty
                unknown++;
            } else {
                console.log(`  Unknown color: ${argb} value=${numVal}`);
                unknown++;
            }
        }
    }
    console.log(`\n  SUMMARY -> Paid: ${paid}, Pending: ${pending}, Unknown: ${unknown}`);
});

// Also simulate what parseDebtExcel does and count results
console.log('\n\n=== SIMULATION OF parseDebtExcel ===');
const allDebts = [];
let debtId = 1;
const workbook2 = new ExcelJS.Workbook();
await workbook2.xlsx.readFile(filePath);

workbook2.eachSheet((worksheet) => {
    const sheetName = worksheet.name.toUpperCase();
    let currentBank = 'General';
    let loanNames = [];
    let inDataSection = false;

    for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
        const row = worksheet.getRow(rowNum);
        const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

        if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA'].includes(firstCellVal)) {
            currentBank = firstCellVal;
            inDataSection = false;
            continue;
        }

        let isHeaderRow = false;
        row.eachCell({ includeEmpty: true }, (cell) => {
            const val = String(cell.value || '').toUpperCase();
            if (val === 'FECHA') isHeaderRow = true;
        });

        if (isHeaderRow) {
            inDataSection = true;
            loanNames = [];
            const prevRow = worksheet.getRow(rowNum - 1);
            for (let c = 1; c <= worksheet.columnCount; c += 2) {
                const loanTitle = String(prevRow.getCell(c).value || prevRow.getCell(c + 1).value || 'Préstamo').trim();
                loanNames.push(loanTitle);
            }
            continue;
        }

        if (inDataSection) {
            for (let i = 0; i < loanNames.length; i++) {
                const colNum = (i * 2) + 1;
                const fechaCell = row.getCell(colNum);
                const cuotasCell = row.getCell(colNum + 1);

                let dateVal = fechaCell.value;
                let amountVal = cuotasCell.value;

                if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) amountVal = amountVal.result;
                if (dateVal && typeof dateVal === 'object' && dateVal.result !== undefined) dateVal = dateVal.result;

                if (dateVal && amountVal) {
                    let amount = typeof amountVal === 'number' ? amountVal : parseFloat(String(amountVal).replace(/\./g,'').replace(',','.').replace(/[^0-9.-]/g,'')) || 0;
                    if (amount <= 0) continue;

                    let status = 'pending';
                    const fill = cuotasCell.fill;
                    if (fill && (fill.fgColor || fill.bgColor)) {
                        const argb = (fill.fgColor?.argb || fill.bgColor?.argb || '').toUpperCase();
                        if (argb.includes('6AA84F') || argb.includes('34A853') ||
                            argb.includes('00B050') || argb.includes('92D050') || argb.includes('00FF00') ||
                            argb.includes('38761D')) {
                            status = 'paid';
                        }
                    }

                    allDebts.push({ id: `${currentBank}-${debtId++}`, entity: currentBank, loanName: loanNames[i], amount, status });
                }
            }
        }
    }
});

const filtered = allDebts.filter(d => !d.loanName.toUpperCase().includes('PAGOANTICIPADO'));
const paid = filtered.filter(d => d.status === 'paid').length;
const pending = filtered.filter(d => d.status === 'pending').length;
console.log(`Total debts parsed: ${filtered.length}`);
console.log(`Paid: ${paid}, Pending: ${pending}`);
console.log('\nBy entity:');
const byEntity = {};
filtered.forEach(d => {
    if (!byEntity[d.entity]) byEntity[d.entity] = { paid: 0, pending: 0 };
    byEntity[d.entity][d.status]++;
});
console.log(JSON.stringify(byEntity, null, 2));

// Check for the NARANJA section specifically
console.log('\nNARANJA debts sample:');
filtered.filter(d => d.entity === 'NARANJA').slice(0, 10).forEach(d => console.log(d));
