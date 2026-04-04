import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(__dirname, '..');
const excelPath = path.join(basePath, 'data', 'Deudas.xlsx');
const debtsPath = path.join(basePath, 'data', 'debts.json');

function parseAmountStr(raw) {
    const str = String(raw).trim();
    const isNeg = str.startsWith('-');
    const s = str.replace(/^-/, '').trim();
    const dots   = (s.match(/\./g) || []).length;
    const commas = (s.match(/,/g) || []).length;
    let numStr;
    if (dots === 0 && commas === 0) numStr = s;
    else if (dots === 1 && commas === 0) numStr = s;
    else if (dots === 0 && commas === 1) {
        const [intPart, decPart] = s.split(',');
        numStr = decPart.length <= 2 ? intPart.replace(/\./g, '') + '.' + decPart : s.replace(/,/g, '');
    } else if (dots === 0 && commas >= 2) {
        const lastIdx = s.lastIndexOf(',');
        const decPart = s.slice(lastIdx + 1);
        const intPart = s.slice(0, lastIdx).replace(/,/g, '');
        numStr = decPart.length <= 2 ? intPart + '.' + decPart : s.replace(/,/g, '');
    } else {
        const commaIdx = s.lastIndexOf(',');
        const decPart  = s.slice(commaIdx + 1);
        const intPart  = s.slice(0, commaIdx).replace(/\./g, '');
        numStr = decPart.length <= 2 ? intPart + '.' + decPart : s.replace(/[,.]/g, '');
    }
    const val = parseFloat(numStr) || 0;
    return isNeg ? -val : val;
}

function formatDate(dateVal) {
    if (dateVal instanceof Date) {
        const y = dateVal.getUTCFullYear();
        const m = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
        const d = String(dateVal.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
    const s = String(dateVal);
    if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
    }
    return s.length >= 5 ? s : null;
}

function isGreen(argb, theme) {
    if (argb) {
        const u = argb.toUpperCase();
        if (u.includes('38761D') || u.includes('6AA84F') ||
            u.includes('34A853') || u.includes('00B050') ||
            u.includes('92D050') || u.includes('00FF00') ||
            u.includes('B6D7A8') || u.includes('D9EAD3') ||
            u.includes('E2EFDA') || u.includes('C6E0B4') ||
            u.includes('A9D08E')) return true;
        if (u.length === 8 && u.startsWith('FF')) {
            const r = parseInt(u.substring(2, 4), 16);
            const g = parseInt(u.substring(4, 6), 16);
            const b = parseInt(u.substring(6, 8), 16);
            if (g > r + 20 && g > b + 20 && g > 100) return true;
        }
    }
    if (theme === 6 || theme === 9) return true;
    return false;
}

function getCellInfo(cell) {
    const fill = cell.fill;
    if (!fill) return { argb: '', theme: null };
    const argb = fill.fgColor?.argb || fill.bgColor?.argb || '';
    const theme = fill.fgColor?.theme;
    return { argb, theme };
}

// Generate simple sequential IDs for newly inserted ones
function generateId(prefix, existingIds) {
    let idNum = 1;
    while (existingIds.has(`${prefix}-PAID-${idNum}`)) {
        idNum++;
    }
    const newId = `${prefix}-PAID-${idNum}`;
    existingIds.add(newId);
    return newId;
}

async function syncGreens() {
    let debts = JSON.parse(fs.readFileSync(debtsPath, 'utf8'));
    
    const existingIds = new Set(debts.map(d => d.id));

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(excelPath);

    let updatedCount = 0;
    let insertedCount = 0;

    workbook.eachSheet((worksheet) => {
        let currentBank = 'General';
        let loanNames = [];
        let inDataSection = false;

        for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

            // Detect Bank Header
            if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA'].includes(firstCellVal)) {
                currentBank = firstCellVal;
                inDataSection = false;
                loanNames = [];
                continue;
            }

            if (firstCellVal === 'TOTAL' || firstCellVal.startsWith('TOTAL') || firstCellVal === 'NARANJA') continue;

            let isHeaderRow = false;
            row.eachCell({ includeEmpty: true }, (cell) => {
                if (String(cell.value || '').toUpperCase() === 'FECHA') isHeaderRow = true;
            });

            if (isHeaderRow) {
                inDataSection = true;
                loanNames = [];
                const prevRow = worksheet.getRow(rowNum - 1);
                for (let c = 1; c <= worksheet.columnCount; c += 2) {
                    const loanTitle = String(prevRow.getCell(c).value || prevRow.getCell(c + 1).value || '').trim();
                    if (loanTitle && !loanTitle.toUpperCase().includes('TOTAL')) {
                        loanNames.push({ col: c, name: loanTitle });
                    }
                }
                continue;
            }

            if (!inDataSection) continue;

            for (const loan of loanNames) {
                const colNum = loan.col;
                const fechaCell = row.getCell(colNum);
                const cuotasCell = row.getCell(colNum + 1);

                if (!fechaCell || !cuotasCell) continue;

                let dateVal = fechaCell.value;
                let amountVal = cuotasCell.value;

                if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) amountVal = amountVal.result;
                if (dateVal && typeof dateVal === 'object' && dateVal.result !== undefined) dateVal = dateVal.result;

                if (!dateVal || amountVal === null || amountVal === undefined || amountVal === '') continue;

                const amount = typeof amountVal === 'number' ? amountVal : parseAmountStr(String(amountVal));
                if (amount <= 0) continue;

                const formattedDate = formatDate(dateVal);
                if (!formattedDate) continue;

                const { argb, theme } = getCellInfo(cuotasCell);

                if (isGreen(argb, theme)) {
                    const targetAmount = Math.round(amount * 100) / 100;
                    
                    const debtToUpdate = debts.find(d => 
                        d.status === 'pending' &&
                        d.entity === currentBank &&
                        d.loanName === loan.name &&
                        d.date === formattedDate && 
                        Math.abs(d.amount - targetAmount) < 0.1
                    );

                    if (debtToUpdate) {
                        debtToUpdate.status = 'paid';
                        updatedCount++;
                    } else {
                        const alreadyPaid = debts.find(d => 
                            d.status === 'paid' &&
                            d.entity === currentBank &&
                            d.loanName === loan.name &&
                            d.date === formattedDate && 
                            Math.abs(d.amount - targetAmount) < 0.1
                        );
                        
                        if (!alreadyPaid) {
                            // Insert it as newly imported and already paid
                            debts.push({
                                id: generateId(currentBank.replace(/\s+/g, '-'), existingIds),
                                entity: currentBank,
                                loanName: loan.name,
                                date: formattedDate,
                                amount: targetAmount,
                                status: 'paid',
                                createdAt: new Date().toISOString()
                            });
                            insertedCount++;
                            console.log(`[INSERTED ✓] ${currentBank} - ${loan.name} | ${formattedDate} | $${targetAmount}`);
                        }
                    }
                }
            }
        }
    });

    if (updatedCount > 0 || insertedCount > 0) {
        // Sort chronologically like the service does
        debts.sort((a, b) => new Date(a.date) - new Date(b.date));
        fs.writeFileSync(debtsPath, JSON.stringify(debts, null, 2));
        console.log(`\nSuccessfully updated ${updatedCount} existing items to "paid".`);
        console.log(`Successfully inserted ${insertedCount} missing items as "paid".`);
    } else {
        console.log(`\nNo new items to process.`);
    }
}

syncGreens().catch(console.error);
