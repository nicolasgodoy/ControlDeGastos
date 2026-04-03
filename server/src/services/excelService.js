import ExcelJS from 'exceljs';

/**
 * Service to parse the debt spreadsheet.
 *
 * Structure:
 *   Row N:   Bank name (GALICIA, UALA, MERCADO PAGO, ICBC, NARANJA)
 *   Row N+1: PRESTAMO 1, PRESTAMO 2, …  (1 per odd column)
 *   Row N+2: Fecha | Cuotas | Fecha | Cuotas | … (header row)
 *   Row N+3+: Data rows
 *   Row X:   TOTAL row – remaining balance per loan column
 *
 * Colors on amount cells:
 *   Green  → PAID   (skip – already settled)
 *   Orange → PENDING (load)
 *   White/none → PENDING (load – not yet coloured by user)
 *
 * Decision: only load PENDING entries.
 * If all cells of a loan are green its TOTAL will be 0 and we naturally
 * load nothing for it.
 */

// ── Amount string parser ──────────────────────────────────────────────────────
// Handles Argentine formatting quirks that ExcelJS returns as strings:
//   "20,228,87"  → 20228.87   (double-comma, last = decimal)
//   "20.228,87"  → 20228.87   (dots = thousands, comma = decimal)
//   "15900.38"   → 15900.38   (US style)
//   "78760"      → 78760      (integer)
function parseAmountStr(raw) {
    const str = String(raw).trim();
    const isNeg = str.startsWith('-');
    const s = str.replace(/^-/, '').trim();

    const dots   = (s.match(/\./g) || []).length;
    const commas = (s.match(/,/g) || []).length;

    let numStr;

    if (dots === 0 && commas === 0) {
        // plain integer "78760"
        numStr = s;
    } else if (dots === 1 && commas === 0) {
        // US style "15900.38" or unusual "20228.87"
        numStr = s;
    } else if (dots === 0 && commas === 1) {
        // AR decimal "20228,87" or thousands "20,228"
        const [intPart, decPart] = s.split(',');
        numStr = decPart.length <= 2
            ? intPart.replace(/\./g, '') + '.' + decPart
            : s.replace(/,/g, '');
    } else if (dots === 0 && commas >= 2) {
        // All-comma format "20,228,87" → last comma is decimal
        const lastIdx   = s.lastIndexOf(',');
        const decPart   = s.slice(lastIdx + 1);
        const intPart   = s.slice(0, lastIdx).replace(/,/g, '');
        numStr = decPart.length <= 2
            ? intPart + '.' + decPart
            : s.replace(/,/g, '');
    } else {
        // Mixed "20.228,87" – dots = thousands, trailing comma = decimal
        const commaIdx = s.lastIndexOf(',');
        const decPart  = s.slice(commaIdx + 1);
        const intPart  = s.slice(0, commaIdx).replace(/\./g, '');
        numStr = decPart.length <= 2
            ? intPart + '.' + decPart
            : s.replace(/[,.]/g, '');
    }

    const val = parseFloat(numStr) || 0;
    return isNeg ? -val : val;
}

// ── Colour helpers ────────────────────────────────────────────────────────────
function isGreen(argb) {
    if (!argb) return false;
    const u = argb.toUpperCase();
    return u.includes('38761D') || u.includes('6AA84F') ||
           u.includes('34A853') || u.includes('00B050') ||
           u.includes('92D050') || u.includes('00FF00');
}

function getCellArgb(cell) {
    const fill = cell.fill;
    if (!fill) return '';
    return fill.fgColor?.argb || fill.bgColor?.argb || '';
}

// ── Date formatter ────────────────────────────────────────────────────────────
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

// ── Main parser ───────────────────────────────────────────────────────────────
export const parseDebtExcel = async (filePath) => {
    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(filePath);
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e.message);
        throw e;
    }

    const allDebts = [];
    let debtId = 1;

    workbook.eachSheet((worksheet) => {
        const sheetName = worksheet.name.toUpperCase();
        console.log(`\n=== Processing sheet: ${sheetName} ===`);

        let currentBank  = 'General';
        let loanNames    = [];   // [{ col, name }]
        let loanTotals   = {};   // col → remaining total (from TOTAL row)
        let inDataSection = false;

        for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
            const row          = worksheet.getRow(rowNum);
            const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

            // ── 1. Bank header ───────────────────────────────────────────────
            if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC', 'NARANJA'].includes(firstCellVal)) {
                currentBank   = firstCellVal;
                inDataSection = false;
                loanNames     = [];
                loanTotals    = {};
                console.log(`Detected bank section: ${currentBank}`);
                continue;
            }

            // ── 2. TOTAL row – read remaining balances per loan column ────────
            if (inDataSection && firstCellVal === 'TOTAL') {
                for (const loan of loanNames) {
                    const cell  = row.getCell(loan.col + 1);
                    let val = cell.value;
                    if (val && typeof val === 'object' && val.result !== undefined) val = val.result;
                    const num = typeof val === 'number' ? val : parseAmountStr(String(val || '0'));
                    loanTotals[loan.col] = num;
                }
                console.log(`  TOTAL row found for ${currentBank}:`, loanTotals);
                continue;
            }

            // Skip other summary rows (TOTAL MENS, NARANJA label, etc.)
            if (firstCellVal.startsWith('TOTAL') || firstCellVal === 'NARANJA') continue;

            // ── 3. Header row (contains "FECHA") ─────────────────────────────
            let isHeaderRow = false;
            row.eachCell({ includeEmpty: true }, (cell) => {
                if (String(cell.value || '').toUpperCase() === 'FECHA') isHeaderRow = true;
            });

            if (isHeaderRow) {
                inDataSection = true;
                loanNames     = [];
                const prevRow = worksheet.getRow(rowNum - 1);
                for (let c = 1; c <= worksheet.columnCount; c += 2) {
                    const loanTitle = String(
                        prevRow.getCell(c).value || prevRow.getCell(c + 1).value || ''
                    ).trim();
                    // Only register columns with a real loan name (skip blank / TOTAL summary cols)
                    if (loanTitle && !loanTitle.toUpperCase().includes('TOTAL')) {
                        loanNames.push({ col: c, name: loanTitle });
                    }
                }
                continue;
            }

            // ── 4. Data rows ─────────────────────────────────────────────────
            if (!inDataSection) continue;

            for (const loan of loanNames) {
                // Skip this loan entirely if its TOTAL = 0 (fully settled)
                if (loan.col in loanTotals && loanTotals[loan.col] <= 0) continue;

                const colNum    = loan.col;
                const fechaCell = row.getCell(colNum);
                const cuotasCell = row.getCell(colNum + 1);

                let dateVal   = fechaCell.value;
                let amountVal = cuotasCell.value;

                // Unwrap formula results
                if (amountVal && typeof amountVal === 'object' && amountVal.result !== undefined) amountVal = amountVal.result;
                if (dateVal   && typeof dateVal   === 'object' && dateVal.result   !== undefined) dateVal   = dateVal.result;

                if (!dateVal || amountVal === null || amountVal === undefined || amountVal === '') continue;

                // Parse amount
                const amount = typeof amountVal === 'number'
                    ? amountVal
                    : parseAmountStr(String(amountVal));

                if (amount <= 0) continue;

                // Parse date
                const formattedDate = formatDate(dateVal);
                if (!formattedDate) continue;

                // Determine status by cell colour
                const argb = getCellArgb(cuotasCell);

                // GREEN = already paid → SKIP (user only wants outstanding debts)
                if (isGreen(argb)) continue;

                // Everything else = pending (orange, white, no colour)
                allDebts.push({
                    id:       `${currentBank}-${debtId++}`,
                    entity:   currentBank,
                    loanName: loan.name,
                    date:     formattedDate,
                    amount:   Math.round(amount * 100) / 100,   // 2 decimal places
                    status:   'pending',
                });
            }
        }
    });

    // Filter out any "PagoAnticipado" artefacts
    const filteredDebts = allDebts.filter(debt =>
        !debt.loanName.toUpperCase().includes('PAGOANTICIPADO') &&
        !String(debt.date).toUpperCase().includes('PAGOANTICIPADO')
    );

    // Sort chronologically
    filteredDebts.sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\n=== Pending debts loaded: ${filteredDebts.length} ===`);

    if (filteredDebts.length === 0) {
        console.log('No pending debts found — returning empty array.');
    }

    return filteredDebts;
};
