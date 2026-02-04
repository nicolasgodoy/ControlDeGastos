import ExcelJS from 'exceljs';
import { parseDebtExcel } from './src/services/excelService.js';

async function checkICBC() {
    console.log('Reading ExcelDeudas.xlsx to check ICBC dates...');
    const debts = await parseDebtExcel('D:/ControlDeCostos/server/data/ExcelDeudas.xlsx');

    // Filter for ICBC and sort by date
    const icbcDebts = debts
        .filter(d => d.entity === 'ICBC')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\nFound ${icbcDebts.length} debts for ICBC`);
    console.log('First 15 dates:');
    icbcDebts.slice(0, 15).forEach(d => {
        console.log(`${d.date} | ${d.loanName} | $${d.amount}`);
    });

    console.log('\nLast 5 dates:');
    icbcDebts.slice(-5).forEach(d => {
        console.log(`${d.date} | ${d.loanName} | $${d.amount}`);
    });
}

checkICBC().catch(console.error);
