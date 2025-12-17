import { Router } from 'express';
import { sendEmail, getEmails, getEmailById, updateEmail } from '../controllers/emailController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticateToken);

// Email routes
router.post('/send', sendEmail);
router.get('/', getEmails);
router.get('/:id', getEmailById);
router.put('/:id', updateEmail);

export default router;