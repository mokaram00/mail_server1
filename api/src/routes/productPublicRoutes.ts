import express from 'express';
import { getProducts, getProductByName, getProductById } from '../controllers/productPublicController';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/id/:id', getProductById);
router.get('/:name', getProductByName);

export default router;