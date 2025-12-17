import { Router } from 'express';
import { receiveEmails, configureEmailAccount } from '../controllers/emailReceiveController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Email receiving routes
router.post('/receive', receiveEmails);
router.post('/configure', configureEmailAccount);

export default router;