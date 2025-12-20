import express from 'express';
import { polarWebhook } from '../controllers/webhookController';

const router = express.Router();

// Polar webhook endpoint
router.post('/polar', polarWebhook);

export default router;