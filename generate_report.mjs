
import { parseDebtExcel } from './server/src/services/excelService.js';
import path from 'path';
import fs from 'fs';

async function generateList() {
    const filePath = path.join('d:', 'ControlDeGastos', 'ControlDeGastos', 'server', 'data', 'Deudas.xlsx');
    const debts = await parseDebtExcel(filePath);
    
    // Sort by entity and then by date
    debts.sort((a, b) => {
        if (a.entity !== b.entity) return a.entity.localeCompare(b.entity);
        return new Date(a.date) - new Date(b.date);
    });

    let markdown = "# Listado de Deudas Pendientes Detectadas\n\n";
    markdown += "Esta es la lista de cuotas que el sistema está leyendo como **Pendientes** (no están marcadas en verde en el Excel).\n\n";
    markdown += "| Banco | Préstamo | Fecha | Monto |\n";
    markdown += "| :--- | :--- | :--- | :--- |\n";
    
    debts.forEach(d => {
        markdown += `| ${d.entity} | ${d.loanName} | ${d.date} | $${d.amount.toLocaleString('es-AR')} |\n`;
    });
    
    markdown += `\n**Total de cuotas detectadas:** ${debts.length}\n`;
    
    const totalAmount = debts.reduce((sum, d) => sum + d.amount, 0);
    markdown += `**Monto total pendiente:** $${totalAmount.toLocaleString('es-AR')}\n`;

    fs.writeFileSync('excel_parsing_report.md', markdown);
    console.log("Report generated: excel_parsing_report.md");
}

generateList().catch(console.error);
