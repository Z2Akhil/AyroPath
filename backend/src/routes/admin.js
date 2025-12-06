import express from 'express';
import adminRoutes from './admin/index.js';

const router = express.Router();

// Mount the modular admin routes
router.use('/', adminRoutes);

export default router;
