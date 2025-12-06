import axios from 'axios';
import Admin from '../../../models/Admin.js';
import AdminSession from '../../../models/AdminSession.js';
import AdminActivity from '../../../models/AdminActivity.js';
import { thyrocareCircuitBreaker } from '../../../utils/circuitBreaker.js';
import { thyrocareRequestQueue } from '../../../utils/requestQueue.js';

export const handleExistingSession = async (admin, existingSession, req, res, startTime, ipAddress, userAgent) => {
  console.log('🔄 Reusing existing session:', {
    sessionId: existingSession._id,
    apiKey: existingSession.thyrocareApiKey.substring(0, 10) + '...',
    admin: admin.name
  });
  
  if (existingSession.isApiKeyExpired()) {
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, req.body.username, req.body.password);
  }

  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + istOffset);
  const sessionCreatedIST = new Date(existingSession.createdAt.getTime() + istOffset);
  
  const hasCrossedMidnight = nowIST.getDate() !== sessionCreatedIST.getDate() || 
                            nowIST.getMonth() !== sessionCreatedIST.getMonth() || 
                            nowIST.getFullYear() !== sessionCreatedIST.getFullYear();
  
  if (hasCrossedMidnight) {
    console.log('❌ ThyroCare API key has expired (crossed midnight), forcing fresh ThyroCare API call');
    console.log('Session created IST:', sessionCreatedIST);
    console.log('Current time IST:', nowIST);
    return await handleThyroCareLogin(req, res, startTime, ipAddress, userAgent, req.body.username, req.body.password);
  }

  await existingSession.refreshUsage();
  
  await AdminActivity.logActivity({
    adminId: admin._id,
    sessionId: existingSession._id,
    action: 'LOGIN',
    description: `Admin ${admin.name} logged in with refreshed session`,
    endpoint: '/api/admin/login',
    method: 'POST',
    ipAddress: ipAddress,
    userAgent: userAgent,
    statusCode: 200,
    responseTime: Date.now() - startTime,
    metadata: {
      userType: admin.userType,
      respId: admin.respId,
      loginType: 'REFRESHED_SESSION'
    }
  });

  return res.json({
    success: true,
    apiKey: existingSession.thyrocareApiKey,
    accessToken: existingSession.thyrocareAccessToken,
    respId: existingSession.thyrocareRespId,
    response: 'Success',
    adminProfile: {
      name: admin.name,
      email: admin.email,
      mobile: admin.mobile,
      userType: admin.userType,
      role: admin.role,
      lastLogin: admin.lastLogin,
      loginCount: admin.loginCount,
      status: admin.status ? 'Active' : 'Inactive',
      accountCreated: admin.createdAt,
      thyrocareUserId: admin.thyrocareUserId,
      respId: admin.respId,
      verKey: admin.verKey,
      isPrepaid: admin.isPrepaid,
      trackingPrivilege: admin.trackingPrivilege,
      otpAccess: admin.otpAccess
    },
    sessionInfo: {
      apiKeyExpiresAt: existingSession.apiKeyExpiresAt,
      sessionExpiresAt: existingSession.sessionExpiresAt,
      loginType: 'REFRESHED_SESSION'
    }
  });
};

export const handleThyroCareLogin = async (req, res, startTime, ipAddress, userAgent, username, password) => {
  const thyrocareApiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';
  
  // Define the API call function for circuit breaker and queue
  const apiCall = async () => {
    console.log('🚀 Making ThyroCare API call for login...');
    const response = await axios.post(`${thyrocareApiUrl}/api/Login/Login`, {
      username,
      password,
      portalType: 'DSAPortal',
      userType: 'DSA'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('ThyroCare API response:', {
      status: response.status,
      data: response.data
    });

    // Check for blocking response
    if (response.data.response === 'Login has been blocked, try after some time') {
      console.warn('⚠️ ThyroCare API is blocking login attempts');
      throw new Error('Login has been blocked by ThyroCare API. Please try again after some time.');
    }

    if (response.data.response === 'Success' && response.data.apiKey) {
      const thyrocareData = response.data;
      
      const admin = await Admin.findOrCreateFromThyroCare(thyrocareData, username);
      
      await admin.updatePassword(password);
      
      const session = await AdminSession.createSingleActiveSession(
        admin._id, 
        thyrocareData, 
        ipAddress, 
        userAgent
      );
      
      await AdminActivity.logActivity({
        adminId: admin._id,
        sessionId: session._id,
        action: 'LOGIN',
        description: `Admin ${admin.name} logged in with fresh ThyroCare API call`,
        endpoint: '/api/admin/login',
        method: 'POST',
        ipAddress: ipAddress,
        userAgent: userAgent,
        statusCode: 200,
        responseTime: Date.now() - startTime,
        metadata: {
          userType: thyrocareData.userType,
          respId: thyrocareData.respId,
          loginType: 'FRESH_THYROCARE',
          protection: 'CIRCUIT_BREAKER_QUEUE'
        }
      });

      return {
        success: true,
        apiKey: thyrocareData.apiKey,
        accessToken: thyrocareData.accessToken,
        respId: thyrocareData.respId,
        response: thyrocareData.response,
        adminProfile: {
          name: admin.name,
          email: admin.email,
          mobile: admin.mobile,
          userType: admin.userType,
          role: admin.role,
          lastLogin: admin.lastLogin,
          loginCount: admin.loginCount,
          status: admin.status ? 'Active' : 'Inactive',
          accountCreated: admin.createdAt,
          thyrocareUserId: admin.thyrocareUserId,
          respId: admin.respId,
          verKey: admin.verKey,
          isPrepaid: admin.isPrepaid,
          trackingPrivilege: admin.trackingPrivilege,
          otpAccess: admin.otpAccess
        },
        sessionInfo: {
          apiKeyExpiresAt: session.apiKeyExpiresAt,
          sessionExpiresAt: session.sessionExpiresAt,
          loginType: 'FRESH_THYROCARE'
        }
      };
    } else {
      throw new Error(response.data.response || 'Login failed: Invalid credentials');
    }
  };

  // Use circuit breaker and request queue for protection
  try {
    console.log('🔄 Using circuit breaker and request queue for ThyroCare API call');
    
    const queuedApiCall = async () => {
      return await thyrocareCircuitBreaker.execute(apiCall);
    };
    
    const result = await thyrocareRequestQueue.enqueue(queuedApiCall, {
      priority: 'normal',
      metadata: { 
        type: 'admin_login', 
        username: username,
        ipAddress: ipAddress 
      }
    });
    
    return res.json(result);
    
  } catch (error) {
    console.error('❌ ThyroCare API call failed with circuit breaker/queue:', error);
    
    // Handle specific error types
    if (error.message.includes('Circuit breaker is OPEN')) {
      return res.status(503).json({
        success: false,
        error: 'ThyroCare API is temporarily unavailable. Please try again later.'
      });
    }
    
    if (error.message.includes('Login has been blocked')) {
      return res.status(429).json({
        success: false,
        error: 'Login has been blocked by ThyroCare API. Please try again after some time.'
      });
    }
    
    if (error.response) {
      console.error('ThyroCare API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      return res.status(error.response.status).json({
        success: false,
        error: error.response.data?.response || 'Login failed: Invalid credentials'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Login failed: An unexpected error occurred. Please try again.'
    });
  }
};
