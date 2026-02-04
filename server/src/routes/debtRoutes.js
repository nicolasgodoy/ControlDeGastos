import express from 'express';
import { getDebts, toggleDebtStatus } from '../controllers/debtController.js';

const router = express.Router();

router.get('/', getDebts);
router.post('/:id/status', toggleDebtStatus);

export default router;
