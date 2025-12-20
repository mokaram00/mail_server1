import express from 'express';
import { 
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon
} from '../controllers/couponController';
import auth from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/', getCoupons);
router.get('/:id', getCouponById);

// Admin routes (require authentication)
router.use(auth('admin'));
router.post('/', createCoupon);
router.put('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;