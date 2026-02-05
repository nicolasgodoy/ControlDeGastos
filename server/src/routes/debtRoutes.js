import express from 'express';
import multer from 'multer';
import { getDebts, toggleDebtStatus, addDebt, updateDebt, deleteDebt, importDebts } from '../controllers/debtController.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getDebts);
router.post('/', addDebt);
router.post('/import', upload.single('file'), importDebts);
router.post('/:id/status', toggleDebtStatus); // Keep for compatibility or legacy
router.put('/:id', updateDebt);
router.delete('/:id', deleteDebt);

export default router;
