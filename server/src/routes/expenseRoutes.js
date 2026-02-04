import express from 'express';
import { getExpenses, addExpense, deleteExpense } from '../controllers/expenseController.js';

const router = express.Router();

router.get('/', getExpenses);
router.post('/', addExpense);
router.delete('/:id', deleteExpense);

export default router;
