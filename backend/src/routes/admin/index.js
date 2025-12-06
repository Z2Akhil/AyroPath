import express from 'express';
import authRoutes from './auth/index.js';
import productRoutes from './products/index.js';
import userRoutes from './users/index.js';
import orderRoutes from './orders/index.js';
import analyticsRoutes from './analytics/index.js';
import smsRoutes from './sms/index.js';
import dashboardRoutes from './dashboard/index.js';

const router = express.Router();

// Mount all modular routes
router.use('/', authRoutes);          // /api/admin/login
router.use('/', productRoutes);       // /api/admin/products, /api/admin/products/pricing
router.use('/', userRoutes);          // /api/admin/users, /api/admin/users/*
router.use('/', orderRoutes);         // /api/admin/orders, /api/admin/orders/*
router.use('/', analyticsRoutes);     // /api/admin/analytics/*
router.use('/', smsRoutes);           // /api/admin/sms/*
router.use('/', dashboardRoutes);     // /api/admin/dashboard

export default router;
