import { Router } from 'express';
import { getUsers, getUserById, updateUserRole, deactivateUser, getSystemStats } from '../controllers/adminController';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';

const router = Router();

// All routes are protected and require admin authorization
router.use(authenticateToken, authorizeAdmin);

// Admin routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/deactivate', deactivateUser);
router.get('/stats', getSystemStats);

export default router;