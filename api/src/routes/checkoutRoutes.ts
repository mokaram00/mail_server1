import express from 'express';
import { createCheckout, getCheckout, sellAuthWebhook } from '../controllers/checkoutController';
import auth from '../middleware/auth';

const router = express.Router();

// Create checkout (requires user authentication)
router.post('/', auth('user'), createCheckout);

// SellAuth webhook (no authentication required)
router.post('/webhook/sellauth', sellAuthWebhook);

// Get checkout details (public)
router.get('/', getCheckout);

export default router;