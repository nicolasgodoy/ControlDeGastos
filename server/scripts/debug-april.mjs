import ExcelJS from 'exceljs';
import path from 'path';

(async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('./data/Deudas.xlsx');
    let sum = 0;
    
    // Group by bank
    let byBank = {};

    workbook.eachSheet(worksheet => {
        let currentBank = 'General';
        let loanNames = [];
        let inDataSection = false;
        for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const firstCell = String(row.getCell(1).value||'').trim().toUpperCase();
            if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA', 'NARANJA X'].includes(firstCell)) {
                currentBank = firstCell;
                inDataSection = false; continue;
            }
            let isHeader = false;
            row.eachCell({includeEmpty:true}, cell => {
                if (String(cell.value||'').toUpperCase() === 'FECHA') isHeader = true;
            });
            if (isHeader) {
                inDataSection = true;
                loanNames = [];
                const prevRow = worksheet.getRow(rowNum - 1);
                for (let c=1; c<=worksheet.columnCount; c+=2) {
                    loanNames.push(String(prevRow.getCell(c).value||prevRow.getCell(c+1).value||'Prestamo').trim());
                }
                continue;
            }
            if (inDataSection) {
                for (let i=0; i<loanNames.length; i++) {
                    const cNum = i*2+1;
                    const dateVal = row.getCell(cNum).value;
                    const amountVal = row.getCell(cNum+1).value;
                    
                    let amountStr = String((amountVal && amountVal.result) ? amountVal.result : amountVal || '0');
                    if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) {
                      amountStr = amountVal.result;
                    }
                    
                    let amount = 0;
                    if (typeof amountVal === 'number') {
                        amount = amountVal;
                    } else if (typeof amountStr === 'number') {
                        amount = amountStr;
                    } else {
                        let numStr = String(amountStr).replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '');
                        amount = parseFloat(numStr) || 0;
                    }
                    
                    let dateStr = '';
                    if (dateVal instanceof Date) {
                        dateStr = dateVal.toISOString();
                    } else if (dateVal && typeof dateVal === 'object' && dateVal.result && dateVal.result instanceof Date) {
                        dateStr = dateVal.result.toISOString();
                    } else if (typeof dateVal === 'string' && dateVal.includes('/')) {
                        const parts = dateVal.split('/');
                        if (parts.length === 3) {
                             dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    }
                    
                    if (amount > 0 && dateStr) {
                        if (dateStr.includes('2026-05')) {
                            sum += amount;
                            if (!byBank[currentBank]) byBank[currentBank] = 0;
                            byBank[currentBank] += amount;
                        }
                    }
                }
            }
        }
    });

    console.log('Total for May 2026:', sum);
    console.log('Breakdown by bank:', byBank);
})();
