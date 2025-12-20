import express from 'express';
import { adminLogin, getAdminProfile, updateAdminProfile, adminLogout, updateAdminPassword } from '../controllers/adminAuthController';
import adminAuth from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/login', adminLogin);

// Protected routes
router.get('/profile', adminAuth('admin'), getAdminProfile);
router.put('/profile', adminAuth('admin'), updateAdminProfile);
router.put('/profile/password', adminAuth('admin'), updateAdminPassword);
router.post('/logout', adminAuth('admin'), adminLogout);

export default router;