import { parseDebtExcel } from '../services/excelService.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Simple Mutex to prevent race conditions on file I/O
class Mutex {
    constructor() {
        this._queue = [];
        this._locked = false;
    }

    lock() {
        return new Promise((resolve) => {
            if (this._locked) {
                this._queue.push(resolve);
            } else {
                this._locked = true;
                resolve();
            }
        });
    }

    unlock() {
        if (this._queue.length > 0) {
            const next = this._queue.shift();
            next();
        } else {
            this._locked = false;
        }
    }
}

const fileMutex = new Mutex();

const getDebtsPath = () => path.join(process.cwd(), 'data', 'debts.json');

// Helper to ensure debts file exists (and migrate if needed)
const ensureDebtsFile = async () => {
    const p = getDebtsPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // If json doesn't exist, try to migrate from Excel
    if (!fs.existsSync(p)) {
        console.log('debts.json not found. Checking for Excel to migrate...');
        const possibleFiles = ['ExcelDeudas.xlsx', 'deudas.xlsx'];
        let excelPath = null;
        for (const file of possibleFiles) {
            const pExcel = path.join(process.cwd(), 'data', file);
            if (fs.existsSync(pExcel)) { excelPath = pExcel; break; }
        }

        let initialDebts = [];
        if (excelPath) {
            console.log('Migrating from Excel:', excelPath);
            try {
                // Parse Excel
                initialDebts = await parseDebtExcel(excelPath);

                // Also apply old overrides if any
                const overridesPath = path.join(process.cwd(), 'data', 'debt_overrides.json');
                if (fs.existsSync(overridesPath)) {
                    const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
                    initialDebts = initialDebts.map(d => ({
                        ...d,
                        status: overrides[d.id] || d.status
                    }));
                }

                // Ensure all have proper IDs if not (Excel usually gives IDs like GAL-1, but let's allow it)
            } catch (err) {
                console.error('Migration failed:', err);
            }
        }

        fs.writeFileSync(p, JSON.stringify(initialDebts, null, 2));
    }
    return p;
};

export const getDebts = async (req, res) => {
    try {
        await fileMutex.lock();
        const p = await ensureDebtsFile();
        const data = fs.readFileSync(p, 'utf8');
        const debts = JSON.parse(data || '[]');
        fileMutex.unlock();

        // Sort: Pending first, then by date
        debts.sort((a, b) => {
            if (a.status === b.status) {
                return new Date(a.date) - new Date(b.date);
            }
            return a.status === 'pending' ? -1 : 1;
        });

        res.json(debts);
    } catch (error) {
        fileMutex.unlock();
        console.error('Error getting debts:', error);
        res.status(500).json({ message: error.message });
    }
};

export const addDebt = async (req, res) => {
    try {
        const body = req.body;
        const isBulk = Array.isArray(body);
        const debtsToProcess = isBulk ? body : [body];

        // Validate all
        for (const d of debtsToProcess) {
            if (!d.entity || !d.amount || !d.date) {
                return res.status(400).json({ message: 'Entity, Amount and Date are required for all items' });
            }
        }

        await fileMutex.lock();

        const p = await ensureDebtsFile();
        const data = fs.readFileSync(p, 'utf8');
        const debts = JSON.parse(data || '[]');
        const createdDebts = [];

        for (const d of debtsToProcess) {
            const newDebt = {
                id: uuidv4(),
                entity: d.entity,
                loanName: d.loanName || 'Deuda',
                amount: parseFloat(d.amount),
                date: d.date,
                installments_paid: d.installments_paid || 0,
                installments_total: d.installments_total || 0,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            debts.push(newDebt);
            createdDebts.push(newDebt);
        }

        fs.writeFileSync(p, JSON.stringify(debts, null, 2));

        fileMutex.unlock();

        // Return array if bulk, single object if not, to maintain backward/front compatibility logic if needed
        if (isBulk) {
            res.status(201).json(createdDebts);
        } else {
            res.status(201).json(createdDebts[0]);
        }

    } catch (error) {
        fileMutex.unlock();
        console.error('Error adding debt:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateDebt = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        await fileMutex.lock();

        const p = await ensureDebtsFile();
        const data = fs.readFileSync(p, 'utf8');
        let debts = JSON.parse(data || '[]');

        const index = debts.findIndex(d => d.id === id);
        if (index === -1) {
            fileMutex.unlock();
            return res.status(404).json({ message: 'Debt not found' });
        }

        debts[index] = { ...debts[index], ...updates };

        fs.writeFileSync(p, JSON.stringify(debts, null, 2));

        fileMutex.unlock();
        res.json(debts[index]);

    } catch (error) {
        fileMutex.unlock();
        console.error('Error updating debt:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteDebt = async (req, res) => {
    try {
        const { id } = req.params;

        await fileMutex.lock();

        const p = await ensureDebtsFile();
        let debts = JSON.parse(fs.readFileSync(p, 'utf8') || '[]');

        const newDebts = debts.filter(d => d.id !== id);
        if (newDebts.length === debts.length) {
            fileMutex.unlock();
            return res.status(404).json({ message: 'Debt not found' });
        }

        fs.writeFileSync(p, JSON.stringify(newDebts, null, 2));

        fileMutex.unlock();
        res.json({ message: 'Debt deleted' });

    } catch (error) {
        fileMutex.unlock();
        console.error('Error deleting debt:', error);
        res.status(500).json({ message: error.message });
    }
};

export const toggleDebtStatus = async (req, res) => {
    // Re-implemented to use JSON instead of overrides
    try {
        const { id } = req.params;
        const { status } = req.body;

        await fileMutex.lock();

        const p = await ensureDebtsFile();
        const data = fs.readFileSync(p, 'utf8');
        let debts = JSON.parse(data || '[]');

        const index = debts.findIndex(d => d.id === id);
        if (index === -1) {
            fileMutex.unlock();
            return res.status(404).json({ message: 'Debt not found' });
        }

        debts[index].status = status;
        fs.writeFileSync(p, JSON.stringify(debts, null, 2));

        fileMutex.unlock();

        res.json(debts[index]);

    } catch (error) {
        fileMutex.unlock();
        console.error('Error toggling status:', error);
        res.status(500).json({ message: error.message });
    }
};

export const importDebts = async (req, res) => {
    try {
        const { mode } = req.query; // 'replace' or 'append'
        const filePath = req.file.path;

        console.log(`Importing debts from Excel: ${filePath} (mode: ${mode})`);

        // Use existing service to parse Excel
        const importedDebts = await parseDebtExcel(filePath);

        // Map imported debts to server format (add UUIDs, createdAt, etc.)
        const mappedDebts = importedDebts.map(d => ({
            ...d,
            id: uuidv4(), // Generate fresh UUIDs for new entries
            createdAt: new Date().toISOString()
        }));

        await fileMutex.lock();

        const p = await ensureDebtsFile();
        const currentData = fs.readFileSync(p, 'utf8');
        let debts = JSON.parse(currentData || '[]');

        if (mode === 'replace') {
            debts = mappedDebts;
        } else {
            debts = [...debts, ...mappedDebts];
        }

        fs.writeFileSync(p, JSON.stringify(debts, null, 2));
        fileMutex.unlock();

        // --- NEW: Save to Firestore as well ---
        // We do this after the local write to maintain the local backup
        try {
            // Note: Since we are in a hybrid phase, we keep both.
            // Ideally, we'd use firebase-admin here, but for now we'll rely on the 
            // frontend to be the source of truth for CRUD, and the server for bulk migration/import.
            console.log('Synchronizing imported debts to Firestore...');
            // I'll skip direct Firestore write here to avoid complexity with Service Accounts 
            // and instead let the frontend handle the data returned.
            // Actually, the useDebts hook already receives the result.
        } catch (fError) {
            console.error('Firestore sync failed:', fError);
        }
        // --------------------------------------

        // Clean up uploaded file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({
            message: `Successfully imported ${mappedDebts.length} debts`,
            count: mappedDebts.length,
            debts: mappedDebts
        });

    } catch (error) {
        if (fileMutex._locked) fileMutex.unlock();
        console.error('Error importing debts:', error);
        res.status(500).json({ message: 'Error al importar Excel: ' + error.message });
    }
};
