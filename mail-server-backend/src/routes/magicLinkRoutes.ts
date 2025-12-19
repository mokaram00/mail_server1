import express from 'express';
import { generateMagicLink, verifyMagicLink } from '../controllers/magicLinkController';
import auth from '../middleware/auth';

const router = express.Router();

// Handle preflight OPTIONS requests explicitly for CORS
router.options('/generate', (req, res) => res.sendStatus(200));
router.options('/verify', (req, res) => res.sendStatus(200));

// Apply authentication middleware to all magic link routes except verify
router.use((req, res, next) => {
  // Skip authentication for verify endpoint (public)
  if (req.path === '/verify' && req.method === 'POST') {
    return next();
  }
  // Apply authentication for all other routes
  auth(req, res, next);
});

// Generate a magic link (requires admin authentication)
router.post('/generate', generateMagicLink);

// Verify a magic link and log in (public endpoint)
router.post('/verify', verifyMagicLink);

export default router;