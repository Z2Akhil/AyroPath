import express from 'express';
import adminAuth from '../../../middleware/adminAuth.js';
import SMSAdminController from '../../../controllers/smsAdminController.js';

const router = express.Router();

// SMS Management Routes
router.get('/sms/wallet', adminAuth, SMSAdminController.getWalletBalance);
router.get('/sms/statistics', adminAuth, SMSAdminController.getSMSStatistics);
router.get('/sms/history', adminAuth, SMSAdminController.getSMSHistory);
router.get('/sms/history/:id', adminAuth, SMSAdminController.getSMSDetails);
router.post('/sms/test', adminAuth, SMSAdminController.sendTestSMS);

export default router;
