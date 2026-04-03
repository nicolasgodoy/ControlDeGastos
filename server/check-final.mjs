import fs from 'fs';
const data = JSON.parse(fs.readFileSync('./data/debts.json','utf8'));

console.log('ICBC PRESTAMO 3 (primeras 5):');
data.filter(d=>d.entity==='ICBC'&&d.loanName.includes('3')).slice(0,5)
    .forEach(d=>console.log(`  ${d.date}  $${d.amount.toLocaleString('es-AR')}`));

console.log('\nNARANJA:');
data.filter(d=>d.entity==='NARANJA')
    .forEach(d=>console.log(`  ${d.date}  $${d.amount.toLocaleString('es-AR')}  ${d.loanName}`));

console.log('\nMERCADO PAGO (primeras 3):');
data.filter(d=>d.entity==='MERCADO PAGO').slice(0,3)
    .forEach(d=>console.log(`  ${d.date}  $${d.amount.toLocaleString('es-AR')}  ${d.loanName}`));

console.log('\nICBC PRESTAMO 4 (sample):');
data.filter(d=>d.entity==='ICBC'&&d.loanName.includes('4')).slice(0,3)
    .forEach(d=>console.log(`  ${d.date}  $${d.amount.toLocaleString('es-AR')}`));

console.log('\n--- Conteo por entidad ---');
const byE={};
data.forEach(d=>{byE[d.entity]=(byE[d.entity]||0)+1});
console.log(byE);

console.log('\n--- Total pendiente por entidad ---');
const byAmt={};
data.forEach(d=>{byAmt[d.entity]=(byAmt[d.entity]||0)+d.amount});
Object.entries(byAmt).forEach(([e,a])=>console.log(`  ${e}: $${Math.round(a).toLocaleString('es-AR')}`));
