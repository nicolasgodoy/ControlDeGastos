import ExcelJS from 'exceljs';
import { parseDebtExcel } from './src/services/excelService.js';

async function checkGalicia() {
    console.log('Reading ExcelDeudas.xlsx...');
    const debts = await parseDebtExcel('D:/ControlDeCostos/server/data/ExcelDeudas.xlsx');

    const galiciaDebts = debts
        .filter(d => d.entity === 'GALICIA')
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    console.log(`\nFound ${galiciaDebts.length} debts for Galicia`);
    console.log('First 10 dates:');
    galiciaDebts.slice(0, 10).forEach(d => {
        console.log(`${d.date} | ${d.loanName} | $${d.amount}`);
    });
}

checkGalicia().catch(console.error);
