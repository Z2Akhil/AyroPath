import express from 'express';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';
import ThyrocareRefreshService from '../services/thyrocareRefreshService.js';
import axios from 'axios';

const router = express.Router();

// ThyroCare API base URL
const THYROCARE_BASE_URL = process.env.THYROCARE_API_URL || 'https://thyrocare-api.com';

/**
 * Helper to execute ThyroCare API calls with automatic retry on auth failure
 * @param {Function} apiCallFn - Async function that takes apiKey and returns response data
 */
const makeThyrocareRequest = async (apiCallFn) => {
  // Helper to check for auth errors in response data or error objects
  const isAuthError = (dataOrError) => {
    // Check error response properties
    if (dataOrError?.response?.status === 401) return true;

    // Check data properties (for 200 OK responses with error messages)
    const response = dataOrError?.response?.data?.response || // Axios error structure
      dataOrError?.response ||                 // Direct response property
      dataOrError?.message ||                  // Common message property
      dataOrError;                             // The object itself if it's a string

    const responseStr = (response || '').toString().toLowerCase();
    return responseStr.includes('invalid') || responseStr.includes('invalid api key');
  };

  try {
    const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();
    const result = await apiCallFn(apiKey);

    // Check if successful response actually contains an auth error
    if (isAuthError(result)) {
      console.log('🔄 ThyroCare API returned success but content indicates auth error. Forcing refresh...');
      // Throw to trigger catch block
      throw new Error('Invalid Api Key response in 200 OK');
    }

    return result;
  } catch (error) {
    // Check if error is due to invalid API key/token
    if (isAuthError(error) || error.message === 'Invalid Api Key response in 200 OK') {
      console.log('🔄 ThyroCare API key rejected, forcing refresh and retry...');
      try {
        // Force refresh
        const session = await ThyrocareRefreshService.refreshApiKeys();
        // Retry with new key
        const retryResult = await apiCallFn(session.thyrocareApiKey);

        // Check retry result as well
        if (isAuthError(retryResult)) {
          // If it still fails, we might as well return it or throw, but let's throw to be safe
          throw new Error('API key refresh failed to resolve the issue: ' + JSON.stringify(retryResult));
        }
        return retryResult;

      } catch (refreshError) {
        console.error('❌ Failed to refresh API key during retry:', refreshError);
        throw refreshError;
      }
    }
    throw error;
  }
};

/**
 * Get all products for client
 * @param {string} type - "ALL", "TESTS", "PROFILE", "OFFER"
 */
router.get('/products', async (req, res) => {
  try {
    const { type = 'ALL' } = req.query;
    const productType = type.toUpperCase();

    let products = [];

    switch (productType) {
      case 'TESTS':
        const tests = await Test.find({ isActive: true });
        products = tests.map(test => test.getCombinedData());
        break;

      case 'PROFILE':
        const profiles = await Profile.find({ isActive: true });
        products = profiles.map(profile => profile.getCombinedData());
        break;

      case 'OFFER':
        const offers = await Offer.find({ isActive: true });
        products = offers.map(offer => offer.getCombinedData());
        break;

      case 'ALL':
      default:
        const [allTests, allProfiles, allOffers] = await Promise.all([
          Test.find({ isActive: true }),
          Profile.find({ isActive: true }),
          Offer.find({ isActive: true })
        ]);

        products = [
          ...allTests.map(test => test.getCombinedData()),
          ...allProfiles.map(profile => profile.getCombinedData()),
          ...allOffers.map(offer => offer.getCombinedData())
        ];
        break;
    }

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Error fetching products for client:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

/**
 * Get product by code for client
 */
router.get('/products/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Try to find product in all collections
    const [test, profile, offer] = await Promise.all([
      Test.findOne({ code, isActive: true }),
      Profile.findOne({ code, isActive: true }),
      Offer.findOne({ code, isActive: true })
    ]);

    const product = test || profile || offer;

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: product.getCombinedData()
    });

  } catch (error) {
    console.error('Error fetching product by code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
});

/**
 * Search products by name for client
 */
router.get('/products/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchRegex = new RegExp(query, 'i');

    const [tests, profiles, offers] = await Promise.all([
      Test.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      }),
      Profile.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      }),
      Offer.find({
        isActive: true,
        $or: [
          { name: searchRegex },
          { 'thyrocareData.aliasName': searchRegex },
          { 'thyrocareData.testNames': searchRegex }
        ]
      })
    ]);

    const products = [
      ...tests.map(test => test.getCombinedData()),
      ...profiles.map(profile => profile.getCombinedData()),
      ...offers.map(offer => offer.getCombinedData())
    ];

    res.json({
      success: true,
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products',
      error: error.message
    });
  }
});


/**
 * Check pincode availability - proxy to ThyroCare API
 */
router.get('/pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode is required'
      });
    }

    const responseData = await makeThyrocareRequest(async (apiKey) => {
      const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/PincodeAvailability`, {
        ApiKey: apiKey,
        Pincode: pincode
      });
      return response.data;
    });

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error checking pincode availability:', error);

    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: 'ThyroCare API error',
        error: error.response.data
      });
    } else if (error.message.includes('No active ThyroCare session')) {
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable - no active session'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to check pincode availability',
        error: error.message
      });
    }
  }
});

/**
 * Get appointment slots - proxy to ThyroCare API
 */
router.post('/appointment-slots', async (req, res) => {
  try {
    const { pincode, date, patients, items } = req.body;

    // Validate required fields
    if (!pincode || !date || !patients || !items) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: pincode, date, patients, items'
      });
    }

    // Call ThyroCare API with retry logic
    const responseData = await makeThyrocareRequest(async (apiKey) => {
      // Prepare request for ThyroCare
      const thyrocareRequest = {
        ApiKey: apiKey,
        Pincode: pincode,
        Date: date,
        BenCount: patients.length,
        Patients: patients,
        Items: items
      };

      const response = await axios.post(`${THYROCARE_BASE_URL}/api/TechsoApi/GetAppointmentSlots`, thyrocareRequest);
      return response.data;
    });

    // Return ThyroCare response directly
    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching appointment slots:', error);

    if (error.response) {
      // ThyroCare API error
      res.status(error.response.status).json({
        success: false,
        message: 'ThyroCare API error',
        error: error.response.data
      });
    } else if (error.message.includes('No active ThyroCare session')) {
      res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable - no active session'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch appointment slots',
        error: error.message
      });
    }
  }
});

export default router;
