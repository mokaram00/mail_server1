import express from 'express';
import { getOrderById, getUserOrders } from '../controllers/orderController';
import auth from '../middleware/auth';

const router = express.Router();

// Protected routes
router.use(auth('user'));
router.get('/', getUserOrders);
router.get('/:id', getOrderById);

export default router;