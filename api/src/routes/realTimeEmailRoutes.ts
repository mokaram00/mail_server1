import express from 'express';
import { getUserEmails, getUserEmailById, checkNewEmails } from '../controllers/realTimeEmailController';
import auth from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth('inbox'));

// Get all emails for the authenticated user
router.get('/', getUserEmails);

// Get a specific email by ID
router.get('/:id', getUserEmailById);

// Check for new emails (simulated real-time checking)
router.get('/check/new', checkNewEmails);

export default router;