import { parseDebtExcel } from '../services/excelService.js';
import path from 'path';
import fs from 'fs';

export const getDebts = async (req, res) => {
    try {
        // Prioritize ExcelDeudas.xlsx
        const possibleFiles = ['ExcelDeudas.xlsx', 'deudas.xlsx'];
        let excelPath = null;

        for (const file of possibleFiles) {
            const p = path.join(process.cwd(), 'data', file);
            // Also try absolute path if cwd is weird
            const pAbs = path.join('D:/ControlDeCostos/server/data', file);

            if (fs.existsSync(p)) {
                excelPath = p;
                break;
            } else if (fs.existsSync(pAbs)) {
                excelPath = pAbs;
                break;
            }
        }


        console.log('Selected Excel Path:', excelPath);

        if (excelPath) {
            console.log('File found, parsing...');
            let debts = await parseDebtExcel(excelPath);

            // Apply Overrides from JSON
            const overridesPath = path.join(process.cwd(), 'data', 'debt_overrides.json');
            if (fs.existsSync(overridesPath)) {
                try {
                    const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
                    debts = debts.map(d => {
                        if (overrides[d.id]) {
                            return { ...d, status: overrides[d.id] };
                        }
                        return d;
                    });
                    console.log(`Applied ${Object.keys(overrides).length} overrides.`);
                } catch (e) {
                    console.error('Error reading overrides:', e);
                }
            }

            return res.json(debts);
        }

        console.log('File not found, returning mock data');
        const debts = [
            { id: 'GAL-1', entity: 'GALICIA', loanName: 'PRESTAMO 1', amount: 75017.65, date: '2025-09-10', status: 'paid' },
            { id: 'UAL-1', entity: 'UALA', loanName: 'PRESTAMO 1', amount: 65962.75, date: '2025-04-07', status: 'pending' },
        ];
        res.json(debts);
    } catch (error) {
        console.error('Error in getDebts:', error);
        res.status(500).json({ message: error.message });
    }
};

export const toggleDebtStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Expecting 'paid' or 'pending'

        if (!id || !status) {
            return res.status(400).json({ message: 'Missing id or status' });
        }

        const overridesPath = path.join(process.cwd(), 'data', 'debt_overrides.json');
        let overrides = {};

        if (fs.existsSync(overridesPath)) {
            try {
                overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
            } catch (e) {
                console.error('Error reading overrides file:', e);
                // Continue with empty overrides if file is corrupt
            }
        }

        // Update override
        overrides[id] = status;

        // Ensure directory exists
        const dir = path.dirname(overridesPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Save
        fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2));

        console.log(`Updated status for ${id} to ${status}`);
        res.json({ message: 'Status updated', id, status });

    } catch (error) {
        console.error('Error in toggleDebtStatus:', error);
        res.status(500).json({ message: error.message });
    }
};
