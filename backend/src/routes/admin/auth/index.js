import express from 'express';
import { thyrocareLoginRateLimit } from '../../../middleware/thyrocareRateLimit.js';
import Admin from '../../../models/Admin.js';
import AdminSession from '../../../models/AdminSession.js';
import AdminActivity from '../../../models/AdminActivity.js';
import { handleExistingSession, handleThyroCareLogin } from './sessionHandlers.js';

const router = express.Router();

// Apply rate limiting to login endpoint
router.post('/login', thyrocareLoginRateLimit, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { username, password } = req.body;

    console.log('Received admin login request:', { username, ipAddress });

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Step 1: Check if admin exists in our database
    const existingAdmin = await Admin.findByUsername(username);
    
    if (existingAdmin && existingAdmin.password) {
      // Step 2: Verify password against stored hash
      const isPasswordValid = await existingAdmin.verifyPassword(password);
      
      if (isPasswordValid) {
        // Step 3: Check for active sessions with same IP and valid API key
        const sameIpSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          ipAddress: ipAddress,
          isActive: true,
          apiKeyExpiresAt: { $gt: new Date() }
        });

        if (sameIpSession) {
          console.log('Reusing existing session for same IP');
          return await handleExistingSession(existingAdmin, sameIpSession, req, res, startTime, ipAddress, userAgent);
        }

        // Step 4: Check for active sessions with different IP
        const differentIpSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          ipAddress: { $ne: ipAddress },
          isActive: true,
          apiKeyExpiresAt: { $gt: new Date() }
        });

        if (differentIpSession) {
          console.log('Different IP detected, forcing fresh ThyroCare API call');
          // Different IP - force fresh ThyroCare call for security
          return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);
        }

        // Step 5: No active sessions found, check for any expired sessions we can reuse
        const expiredSession = await AdminSession.findOne({
          adminId: existingAdmin._id,
          isActive: true
        }).sort({ apiKeyExpiresAt: -1 });

        if (expiredSession && expiredSession.isApiKeyExpired()) {
          console.log('All sessions expired, forcing fresh ThyroCare API call');
          return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);
        }
      }
    }

    // Step 6: Fallback to original ThyroCare API call
    console.log('No cached session available, making fresh ThyroCare API call');
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, username, password);

  } catch (error) {
    console.error('Admin login proxy error:', error);

    if (error.response) {
      console.error('ThyroCare API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.response || error.response.data?.message || 'Login failed: Invalid credentials'
      });
    } else if (error.request) {
      return res.status(503).json({
        success: false,
        error: 'Login failed: Network error. Please check your connection.'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Login failed: An unexpected error occurred.'
      });
    }
  }
});

export default router;
