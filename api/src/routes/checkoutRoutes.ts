import express from 'express';
import { createCheckout, getCheckout, sellAuthWebhook } from '../controllers/checkoutController';
import auth from '../middleware/auth';

const router = express.Router();

// Create checkout (requires authentication)
router.post('/', auth, createCheckout);

// SellAuth webhook (no authentication required)
router.post('/webhook/sellauth', sellAuthWebhook);

// Get checkout details (public)
router.get('/', getCheckout);

export default router;