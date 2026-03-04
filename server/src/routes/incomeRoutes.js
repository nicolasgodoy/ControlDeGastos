import express from 'express';
import { getIncomes, addIncome, updateIncome, deleteIncome, deleteAllIncomes } from '../controllers/incomeController.js';

const router = express.Router();

// Get all incomes
router.get('/', getIncomes);

// Add new income (supports bulk)
router.post('/', addIncome);

// Update income
router.put('/:id', updateIncome);

// Delete all
router.delete('/all', deleteAllIncomes);

// Delete income
router.delete('/:id', deleteIncome);

export default router;
