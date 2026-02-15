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

const getIncomesPath = () => path.join(process.cwd(), 'data', 'incomes.json');

// Helper to ensure incomes file exists
const ensureIncomesFile = async () => {
    const p = getIncomesPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (!fs.existsSync(p)) {
        fs.writeFileSync(p, JSON.stringify([], null, 2));
    }
    return p;
};

export const getIncomes = async (req, res) => {
    try {
        await fileMutex.lock();
        const p = await ensureIncomesFile();
        const data = fs.readFileSync(p, 'utf8');
        const incomes = JSON.parse(data || '[]');
        fileMutex.unlock();

        // Sort by date (most recent first)
        incomes.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json(incomes);
    } catch (error) {
        fileMutex.unlock();
        console.error('Error getting incomes:', error);
        res.status(500).json({ message: error.message });
    }
};

export const addIncome = async (req, res) => {
    try {
        const body = req.body;
        const isBulk = Array.isArray(body);
        const incomesToProcess = isBulk ? body : [body];

        // Validate all
        for (const income of incomesToProcess) {
            if (!income.source || !income.amount || !income.date) {
                return res.status(400).json({
                    message: 'Source, Amount and Date are required for all items'
                });
            }
        }

        await fileMutex.lock();

        const p = await ensureIncomesFile();
        const data = fs.readFileSync(p, 'utf8');
        const incomes = JSON.parse(data || '[]');
        const createdIncomes = [];

        for (const income of incomesToProcess) {
            const newIncome = {
                id: uuidv4(),
                source: income.source,
                amount: parseFloat(income.amount),
                date: income.date,
                category: income.category || 'Otro',
                recurring: income.recurring || false,
                createdAt: new Date().toISOString()
            };
            incomes.push(newIncome);
            createdIncomes.push(newIncome);
        }

        fs.writeFileSync(p, JSON.stringify(incomes, null, 2));

        fileMutex.unlock();

        if (isBulk) {
            res.status(201).json(createdIncomes);
        } else {
            res.status(201).json(createdIncomes[0]);
        }

    } catch (error) {
        fileMutex.unlock();
        console.error('Error adding income:', error);
        res.status(500).json({ message: error.message });
    }
};

export const updateIncome = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        await fileMutex.lock();

        const p = await ensureIncomesFile();
        const data = fs.readFileSync(p, 'utf8');
        let incomes = JSON.parse(data || '[]');

        const index = incomes.findIndex(i => i.id === id);
        if (index === -1) {
            fileMutex.unlock();
            return res.status(404).json({ message: 'Income not found' });
        }

        incomes[index] = { ...incomes[index], ...updates };

        fs.writeFileSync(p, JSON.stringify(incomes, null, 2));

        fileMutex.unlock();
        res.json(incomes[index]);

    } catch (error) {
        fileMutex.unlock();
        console.error('Error updating income:', error);
        res.status(500).json({ message: error.message });
    }
};

export const deleteIncome = async (req, res) => {
    try {
        const { id } = req.params;

        await fileMutex.lock();

        const p = await ensureIncomesFile();
        let incomes = JSON.parse(fs.readFileSync(p, 'utf8') || '[]');

        const newIncomes = incomes.filter(i => i.id !== id);
        if (newIncomes.length === incomes.length) {
            fileMutex.unlock();
            return res.status(404).json({ message: 'Income not found' });
        }

        fs.writeFileSync(p, JSON.stringify(newIncomes, null, 2));

        fileMutex.unlock();
        res.json({ message: 'Income deleted' });

    } catch (error) {
        fileMutex.unlock();
        console.error('Error deleting income:', error);
        res.status(500).json({ message: error.message });
    }
};
