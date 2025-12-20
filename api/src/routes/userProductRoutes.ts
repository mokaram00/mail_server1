import express from 'express';
import { 
  generateAccountMagicLink,
  getUserPurchasedAccounts
} from '../controllers/userProductController';
import auth from '../middleware/auth';

const router = express.Router();

// Protected routes (require authentication)
router.use(auth('user'));

router.get('/accounts', getUserPurchasedAccounts);
router.post('/accounts/:productId/magic-link', generateAccountMagicLink);

export default router;