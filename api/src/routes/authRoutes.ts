import express from 'express';
import { login, getProfile, logout } from '../controllers/authController';
import auth from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/profile', auth('inbox'), getProfile);
router.post('/logout', auth('inbox'), logout);

export default router;