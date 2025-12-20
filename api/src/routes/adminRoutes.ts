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
  getServerInfo,
  updateOrderStatus,
  updateUserConnectionStatus
} from '../controllers/adminController';
import { 
  getAllProducts as adminGetAllProducts,
  getProductById as adminGetProductById,
  createProduct as adminCreateProduct,
  updateProduct as adminUpdateProduct,
  deleteProduct as adminDeleteProduct
} from '../controllers/productController';
import { uploadImages } from '../controllers/uploadController';
import upload from '../utils/upload';
import auth from '../middleware/auth';
const router = express.Router();

// All admin routes require authentication
router.use(auth('admin')); // فقط admins يمكنهم الوصول

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
router.put('/emails/:id/connection-status', updateUserConnectionStatus);

// Product management routes
router.get('/products', adminGetAllProducts);
router.get('/products/:id', adminGetProductById);
router.post('/products', adminCreateProduct);
router.put('/products/:id', adminUpdateProduct);
router.delete('/products/:id', adminDeleteProduct);

// Order management routes
router.put('/orders/:id/status', updateOrderStatus);

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

// Upload route
router.post('/upload', upload.array('images', 10), (req, res) => uploadImages(req, res));

// Server info route (superadmin only)
router.get('/server-info', getServerInfo);

export default router;