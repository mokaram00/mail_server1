import { Router } from 'express';
import { getUsers, getUserById, updateUserRole, deactivateUser, getSystemStats, createUser, bulkCreateUsers, getDomains, setDefaultDomain, getAccountClassifications, updateAdminProfile, changeAdminPassword, getAdminProfile } from '../controllers/adminController';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';

const router = Router();

// All routes are protected and require admin authorization
router.use(authenticateToken, authorizeAdmin);

// Admin routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.post('/users/bulk', bulkCreateUsers);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/deactivate', deactivateUser);
router.get('/stats', getSystemStats);
router.get('/domains', getDomains);
router.post('/domains/default', setDefaultDomain);
router.get('/classifications', getAccountClassifications);

// Admin profile routes
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);
router.put('/profile/password', changeAdminPassword);

export default router;