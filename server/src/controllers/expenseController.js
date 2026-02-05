import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const getExpensesPath = () => path.join(process.cwd(), 'data', 'expenses.json');

// Helper to ensure file exists
const ensureExpensesFile = () => {
    const p = getExpensesPath();
    const dir = path.dirname(p);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(p)) fs.writeFileSync(p, '[]');
    return p;
};

export const getExpenses = (req, res) => {
    try {
        const p = ensureExpensesFile();
        const data = fs.readFileSync(p, 'utf8');
        const expenses = JSON.parse(data || '[]');
        // Sort by date desc
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        res.json(expenses);
    } catch (error) {
        console.error('Error getting expenses:', error);
        res.status(500).json({ message: 'Error retrieving expenses' });
    }
};

export const addExpense = (req, res) => {
    try {
        const { description, amount, category, date } = req.body;

        if (!description || !amount || !category || !date) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const p = ensureExpensesFile();
        const data = fs.readFileSync(p, 'utf8');
        const expenses = JSON.parse(data || '[]');

        const newExpense = {
            id: uuidv4(),
            description,
            amount: parseFloat(amount),
            category,
            date,
            createdAt: new Date().toISOString()
        };

        expenses.push(newExpense);
        fs.writeFileSync(p, JSON.stringify(expenses, null, 2));

        res.status(201).json(newExpense);
    } catch (error) {
        console.error('Error adding expense:', error);
        res.status(500).json({ message: 'Error saving expense' });
    }
};

export const deleteExpense = (req, res) => {
    try {
        const { id } = req.params;
        const p = ensureExpensesFile();
        const data = fs.readFileSync(p, 'utf8');
        let expenses = JSON.parse(data || '[]');

        const initialLength = expenses.length;
        expenses = expenses.filter(e => e.id !== id);

        if (expenses.length === initialLength) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        fs.writeFileSync(p, JSON.stringify(expenses, null, 2));
        res.json({ message: 'Expense deleted' });
    } catch (error) {
        console.error('Error deleting expense:', error);
        res.status(500).json({ message: 'Error deleting expense' });
    }
};
export const updateExpense = (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, category, date } = req.body;

        const p = ensureExpensesFile();
        const data = fs.readFileSync(p, 'utf8');
        let expenses = JSON.parse(data || '[]');

        const index = expenses.findIndex(e => e.id === id);

        if (index === -1) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        const updatedExpense = {
            ...expenses[index],
            description: description || expenses[index].description,
            amount: amount ? parseFloat(amount) : expenses[index].amount,
            category: category || expenses[index].category,
            date: date || expenses[index].date,
            updatedAt: new Date().toISOString()
        };

        expenses[index] = updatedExpense;
        fs.writeFileSync(p, JSON.stringify(expenses, null, 2));

        res.json(updatedExpense);
    } catch (error) {
        console.error('Error updating expense:', error);
        res.status(500).json({ message: 'Error updating expense' });
    }
};
