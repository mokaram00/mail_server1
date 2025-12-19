import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUserRole, 
  updateUserClassification, 
  deactivateUser, 
  getSystemStats, 
  createUser, 
  bulkCreateUsers, 
  getDomains, 
  addDomain, 
  getAccountClassifications, 
  addAccountClassification, 
  createAdmin,
  getAdmins,
  updateAdminRole,
  deactivateAdmin,
  getServerInfo
} from '../controllers/adminController';
import auth from '../middleware/auth';
const router = express.Router();

// All admin routes require authentication
router.use(auth);

// Admin management routes
router.get('/admins', getAdmins);
router.put('/admins/:id/role', updateAdminRole);
router.put('/admins/:id/deactivate', deactivateAdmin);

// User management routes
router.get('/emails', getUsers);
router.get('/emails/:id', getUserById);
router.put('/emails/:id/role', updateUserRole);
router.put('/emails/:id/classification', updateUserClassification);
router.put('/emails/:id/deactivate', deactivateUser);

// System stats route
router.get('/stats', getSystemStats);
// User creation routes
router.post('/emails', createUser);
router.post('/emails/bulk', bulkCreateUsers);

// Admin creation route
router.post('/admins', createAdmin);

// Domain management routes
router.get('/domains', getDomains);
router.post('/domains', addDomain);

// Account classification routes
router.get('/classifications', getAccountClassifications);
router.post('/classifications', addAccountClassification);

// Server info route (superadmin only)
router.get('/server-info', getServerInfo);

export default router;