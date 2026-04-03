import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, 'data', 'Deudas.xlsx');
const workbook = new ExcelJS.Workbook();
await workbook.xlsx.readFile(filePath);
const sheet = workbook.getWorksheet(1);

// Show ICBC rows 76-90, columns C5-C8 (PRESTAMO 3 and 4) raw values
console.log('ICBC PRESTAMO 3 (C5=fecha, C6=cuotas) and PRESTAMO 4 (C7=fecha, C8=cuotas), rows 76-109:\n');
for (let r = 76; r <= 109; r++) {
    const row = sheet.getRow(r);
    let line = `ROW ${r}: `;
    for (let c = 5; c <= 10; c++) {
        const cell = row.getCell(c);
        let v = cell.value;
        if (v && typeof v === 'object' && v.result !== undefined) v = v.result;
        if (v && typeof v === 'object' && v.formula !== undefined) v = `FORMULA(${v.result})`;
        const fill = cell.fill;
        const argb = (fill?.fgColor?.argb || fill?.bgColor?.argb || 'NONE').toUpperCase();
        let colorTag = '';
        if (argb.includes('38761D') || argb.includes('6AA84F')) colorTag = '[G]';
        else if (argb.includes('FF9900')) colorTag = '[O]';
        else if (argb === 'FFFFFFFF') colorTag = '[W]';
        else if (argb !== 'NONE') colorTag = `[${argb.substring(0,4)}]`;
        const fmt = cell.numFmt || '';
        line += `C${c}=${v!==null&&v!==undefined?JSON.stringify(v):'null'}(${typeof v})${colorTag}${fmt?'|fmt:'+fmt:''} | `;
    }
    console.log(line);
}
