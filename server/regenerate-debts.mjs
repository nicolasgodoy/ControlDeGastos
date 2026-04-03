/**
 * regenerate-debts.mjs
 * Borra debts.json y lo regenera limpio desde Deudas.xlsx con el parser corregido.
 * Usar: node regenerate-debts.mjs
 */
import { parseDebtExcel } from './src/services/excelService.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const excelPath = path.join(__dirname, 'data', 'Deudas.xlsx');
const jsonPath  = path.join(__dirname, 'data', 'debts.json');

if (!fs.existsSync(excelPath)) {
    console.error('❌ No se encontró Deudas.xlsx en server/data/');
    process.exit(1);
}

console.log('📂 Leyendo:', excelPath);
const debts = await parseDebtExcel(excelPath);

// Stats
const byEntity = {};
debts.forEach(d => {
    const key = d.entity;
    if (!byEntity[key]) byEntity[key] = { paid: 0, pending: 0 };
    byEntity[key][d.status]++;
});

console.log('\n✅ Deudas parseadas:', debts.length);
console.log('📊 Por entidad:');
Object.entries(byEntity).forEach(([entity, counts]) => {
    console.log(`   ${entity}: ${counts.paid} pagadas, ${counts.pending} pendientes`);
});

// Check for suspicious entries (amount cells without color = WHITE)
const noColorDebts = debts.filter(d => d._noColor);
if (noColorDebts.length > 0) {
    console.warn(`\n⚠️  ${noColorDebts.length} cuotas sin color (tratadas como pendientes)`);
}

// Write
fs.writeFileSync(jsonPath, JSON.stringify(debts, null, 2));
console.log('\n💾 debts.json regenerado con', debts.length, 'registros en:', jsonPath);
console.log('🔄 Reiniciá el servidor para que tome los cambios (ya está corriendo con nodemon).');
