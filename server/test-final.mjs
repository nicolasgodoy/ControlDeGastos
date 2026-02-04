import { parseDebtExcel } from './src/services/excelService.js';

async function testFinal() {
    const debts = await parseDebtExcel('D:/ControlDeCostos/server/data/ExcelDeudas.xlsx');
    console.log('Total:', debts.length);
    console.log('Primeras 3:', JSON.stringify(debts.slice(0, 3), null, 2));
    console.log('Ultimas 3:', JSON.stringify(debts.slice(-3), null, 2));

    const banks = [...new Set(debts.map(d => d.entity))];
    console.log('Bancos encontrados:', banks);

    // Count per bank
    banks.forEach(bank => {
        const count = debts.filter(d => d.entity === bank).length;
        console.log(`${bank}: ${count} cuotas`);
    });

    // Check for Tarjetas
    const tarjetas = debts.filter(d => d.loanName.toUpperCase().includes('TARJETA'));
    console.log(`\nTarjetas encontradas: ${tarjetas.length}`);
    if (tarjetas.length > 0) {
        console.log('Ejemplo Tarjeta:', JSON.stringify(tarjetas[0], null, 2));
    }

    const paid = debts.filter(d => d.status === 'paid').length;
    console.log('Pagados:', paid);
}

testFinal().catch(console.error);
