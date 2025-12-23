import express from 'express';
import { createCheckout, getCheckout, getAvailableCurrencies } from '../controllers/checkoutController';
import { polarWebhook } from '../controllers/webhookController';
import auth from '../middleware/auth';

const router = express.Router();

// Create checkout (requires user authentication)
router.post('/', auth('user'), createCheckout);

// Polar webhook (no authentication required) - now handled by webhook routes
// This route should be removed since webhooks are handled by webhookRoutes
// Commenting out to avoid duplicate handling
// router.post('/webhook/polar', polarWebhook);

// Get available payment methods (no authentication required)
router.get('/currencies', getAvailableCurrencies);

// Get checkout details (public)
router.get('/', getCheckout);

export default router;