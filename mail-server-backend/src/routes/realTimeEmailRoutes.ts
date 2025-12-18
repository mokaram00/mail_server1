import express from 'express';
import { getUserEmails, getUserEmailById, checkNewEmails, simulateNewEmail } from '../controllers/realTimeEmailController';
import auth from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(auth);

// Get all emails for the authenticated user
router.get('/', getUserEmails);

// Get a specific email by ID
router.get('/:id', getUserEmailById);

// Check for new emails (simulated real-time checking)
router.get('/check/new', checkNewEmails);

// Simulate new email arrival (for demonstration)
router.post('/simulate/new', simulateNewEmail);

export default router;