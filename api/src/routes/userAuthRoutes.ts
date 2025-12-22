import express from 'express';
import { register, login, getProfile, logout } from '../controllers/userAuthController';
import auth from '../middleware/auth';

const router = express.Router();
// Handle preflight OPTIONS requests explicitly for CORS
router.options('/profile', (req, res) => res.sendStatus(200));
router.options('/login', (req, res) => res.sendStatus(200));
router.options('/logout', (req, res) => res.sendStatus(200));
router.options('/register', (req, res) => res.sendStatus(200));

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/profile', auth('user'), getProfile);
router.post('/logout', auth('user'), logout);

export default router;