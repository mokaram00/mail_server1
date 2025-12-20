import express from 'express';
import { createCheckout, getCheckout } from '../controllers/checkoutController';
import auth from '../middleware/auth';

const router = express.Router();

// Create checkout (requires authentication)
router.post('/', auth, createCheckout);

// Get checkout details (public)
router.get('/', getCheckout);

export default router;