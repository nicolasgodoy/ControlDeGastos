import express from 'express';
import { getExpenses, addExpense, deleteExpense, updateExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getExpenses);
router.post('/', addExpense);
router.delete('/:id', deleteExpense);
router.put('/:id', updateExpense);

export default router;
