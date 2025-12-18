import express from 'express';
import { generateMagicLink, verifyMagicLink } from '../controllers/magicLinkController';

const router = express.Router();

// Generate a magic link
router.post('/generate', generateMagicLink);

// Verify a magic link and log in
router.post('/verify', verifyMagicLink);

export default router;