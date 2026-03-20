import express from 'express';
import { createPaymentLink, handleWebhook, checkPaymentStatus } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/create-link', authMiddleware, createPaymentLink);
router.post('/webhook', handleWebhook);
router.get('/check-status/:orderCode', checkPaymentStatus);

export default router;
