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
  getEmailsByClassification 
} from '../controllers/adminController';
import auth from '../middleware/auth';

const router = express.Router();

// All admin routes require authentication
router.use(auth);

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/classification', updateUserClassification);
router.put('/users/:id/deactivate', deactivateUser);

// System stats route
router.get('/stats', getSystemStats);

// User creation routes
router.post('/users', createUser);
router.post('/users/bulk', bulkCreateUsers);

// Domain management routes
router.get('/domains', getDomains);
router.post('/domains', addDomain);

// Account classification routes
router.get('/classifications', getAccountClassifications);
router.post('/classifications', addAccountClassification);
router.get('/classifications/:classification/emails', getEmailsByClassification);

export default router;