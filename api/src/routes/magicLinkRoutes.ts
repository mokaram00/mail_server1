import express from 'express';
import { generateMagicLink, verifyMagicLink } from '../controllers/magicLinkController';
import auth from '../middleware/auth';

const router = express.Router();

// Handle preflight OPTIONS requests explicitly for CORS
router.options('/generate', (req, res) => res.sendStatus(200));
router.options('/verify', (req, res) => res.sendStatus(200));

// Generate a magic link (requires admin authentication)
router.post('/generate', auth('admin'), generateMagicLink);

// Verify a magic link and log in (public endpoint)
router.post('/verify', verifyMagicLink);

export default router;