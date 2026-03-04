import express from 'express';
import { getExpenses, addExpense, deleteExpense, updateExpense, deleteAllExpenses } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getExpenses);
router.post('/', addExpense);
router.delete('/all', deleteAllExpenses);
router.delete('/:id', deleteExpense);
router.put('/:id', updateExpense);

export default router;
