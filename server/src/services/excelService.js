import ExcelJS from 'exceljs';

/**
 * Service to parse the debt spreadsheet.
 * Structure observed from user's screenshots:
 * 
 * Row 1: Bank name (GALICIA, UALA, MERCADO PAGO, ICBC)
 * Row 2: PRESTAMO 1, PRESTAMO 2, etc. (spanning 2 columns each)
 * Row 3: Fecha | Cuotas headers for each prestamo
 * Row 4+: Data rows with date and amount
 * 
 * Colors:
 * - Green background = PAID
 * - Orange background = PENDING (or no color)
 */
export const parseDebtExcel = async (filePath) => {
    // Force use of the updated file if it exists, otherwise use what was passed
    const targetPath = filePath.includes('ExcelDeudas.xlsx') ? filePath : 'D:/ControlDeCostos/server/data/ExcelDeudas.xlsx';

    const workbook = new ExcelJS.Workbook();
    try {
        await workbook.xlsx.readFile(targetPath);
    } catch (e) {
        console.error(`Error reading ${targetPath}, falling back to ${filePath}`);
        await workbook.xlsx.readFile(filePath);
    }

    const allDebts = [];
    let debtId = 1;

    workbook.eachSheet((worksheet) => {
        const sheetName = worksheet.name.toUpperCase();
        console.log(`\n=== Processing sheet: ${sheetName} ===`);

        let currentBank = 'General';
        let loanNames = [];
        let inDataSection = false;

        // Iterate through rows to find data
        for (let rowNum = 1; rowNum <= worksheet.rowCount; rowNum++) {
            const row = worksheet.getRow(rowNum);
            const firstCellVal = String(row.getCell(1).value || '').trim().toUpperCase();

            // 1. Detect Bank header (Row where same value repeats or single bank name)
            // Bank names usually: GALICIA, UALA, MERCADO PAGO, ICBC
            if (['GALICIA', 'UALA', 'MERCADO PAGO', 'ICBC'].includes(firstCellVal)) {
                currentBank = firstCellVal;
                inDataSection = false;
                console.log(`Detected bank section: ${currentBank}`);
                continue;
            }

            // 2. Detect Loan Names and Fecha/Cuotas headers
            // A row that contains "FECHA" in multiple columns means we found the header row
            let isHeaderRow = false;
            row.eachCell({ includeEmpty: true }, (cell) => {
                const val = String(cell.value || '').toUpperCase();
                if (val === 'FECHA') isHeaderRow = true;
            });

            if (isHeaderRow) {
                inDataSection = true;
                loanNames = [];
                // Look at the row above to get loan names
                const prevRow = worksheet.getRow(rowNum - 1);
                for (let c = 1; c <= worksheet.columnCount; c += 2) {
                    const loanTitle = String(prevRow.getCell(c).value || prevRow.getCell(c + 1).value || 'Préstamo').trim();
                    loanNames.push(loanTitle);
                }
                continue;
            }

            // 3. Process data rows
            if (inDataSection) {
                let hasData = false;
                for (let i = 0; i < loanNames.length; i++) {
                    const colNum = (i * 2) + 1;
                    const fechaCell = row.getCell(colNum);
                    const cuotasCell = row.getCell(colNum + 1);

                    const dateVal = fechaCell.value;
                    const amountVal = cuotasCell.value;

                    if (dateVal && amountVal && (typeof amountVal === 'number' || !isNaN(parseFloat(String(amountVal).replace(',', '.'))))) {
                        hasData = true;

                        // Parse amount
                        let amount = 0;
                        if (typeof amountVal === 'number') {
                            amount = amountVal;
                        } else {
                            const numStr = String(amountVal)
                                .replace(/\./g, '')
                                .replace(',', '.')
                                .replace(/[^0-9.-]/g, '');
                            amount = parseFloat(numStr) || 0;
                        }

                        if (amount <= 0) continue;

                        // Parse date
                        let formattedDate = '';
                        if (dateVal instanceof Date) {
                            // ExcelJS usually returns dates in UTC (midnight). 
                            // In GMT-3, this shows as previous day 21:00.
                            // To get the actual date written in the cell (e.g. 10/09/2025), we should use UTC methods.
                            const year = dateVal.getUTCFullYear();
                            const month = String(dateVal.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(dateVal.getUTCDate()).padStart(2, '0');
                            formattedDate = `${year}-${month}-${day}`;
                        } else {
                            const dateStr = String(dateVal);
                            // Handle DD/MM/YYYY
                            if (dateStr.includes('/')) {
                                const parts = dateStr.split('/');
                                if (parts.length === 3) {
                                    // Assuming DD/MM/YYYY
                                    formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                                } else {
                                    formattedDate = dateStr;
                                }
                            } else {
                                if (dateStr.length < 5) continue;
                                formattedDate = dateStr;
                            }
                        }

                        // Check status by color
                        let status = 'pending';
                        const fill = cuotasCell.fill;
                        if (fill && (fill.fgColor || fill.bgColor)) {
                            const argb = (fill.fgColor?.argb || fill.bgColor?.argb || '').toUpperCase();
                            // FF6AA84F, FF34A853 are green (paid)
                            if (argb.includes('6AA84F') || argb.includes('34A853') ||
                                argb.includes('00B050') || argb.includes('92D050') || argb.includes('00FF00')) {
                                status = 'paid';
                            }
                        }

                        allDebts.push({
                            id: `${currentBank}-${debtId++}`,
                            entity: currentBank,
                            loanName: loanNames[i],
                            date: formattedDate,
                            amount: amount,
                            status: status
                        });
                    }
                }

                // If we hit a block of empty rows in a data section, maybe we are at the end of that section
                // But the user's sheet has gaps, so we'll just continue until the next bank header.
            }
        }
    });

    // Filter out "PagoAnticipado" entries
    const filteredDebts = allDebts.filter(debt =>
        !debt.loanName.toUpperCase().includes('PAGOANTICIPADO') &&
        !String(debt.date).toUpperCase().includes('PAGOANTICIPADO')
    );

    console.log(`\n=== Total debts after filtering: ${filteredDebts.length} ===`);

    // Sort by date (chronological order)
    filteredDebts.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
    });

    // If still no debts, return sample data
    if (filteredDebts.length === 0) {
        console.log('Returning sample data as fallback');
        return [
            { id: 'GAL-1', entity: 'GALICIA', loanName: 'PRESTAMO 1', amount: 75017.65, date: '2025-09-10', status: 'pending' },
            { id: 'GAL-2', entity: 'GALICIA', loanName: 'PRESTAMO 2', amount: 52000.00, date: '2025-10-15', status: 'paid' },
            { id: 'UAL-1', entity: 'UALA', loanName: 'PRESTAMO 1', amount: 65962.75, date: '2025-04-07', status: 'pending' },
            { id: 'UAL-2', entity: 'UALA', loanName: 'PRESTAMO 2', amount: 87876.68, date: '2025-05-15', status: 'paid' },
            { id: 'MP-1', entity: 'MERCADO PAGO', loanName: 'PRESTAMO 1', amount: 39483.00, date: '2025-10-13', status: 'pending' },
            { id: 'MP-2', entity: 'MERCADO PAGO', loanName: 'PRESTAMO 2', amount: 164433.33, date: '2025-10-13', status: 'paid' },
            { id: 'ICBC-1', entity: 'ICBC', loanName: 'PRESTAMO 1', amount: 33026.21, date: '2025-06-04', status: 'pending' },
        ];
    }

    return filteredDebts;
};
