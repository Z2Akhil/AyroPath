import express from 'express';
import axios from 'axios';
import adminAuth from '../../../middleware/adminAuth.js';
import AdminActivity from '../../../models/AdminActivity.js';
import Test from '../../../models/Test.js';
import Profile from '../../../models/Profile.js';
import Offer from '../../../models/Offer.js';

const router = express.Router();

// Product endpoint - fetches from Thyrocare API and combines with our database
router.post('/products', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { productType } = req.body;

    if (!productType) {
      return res.status(400).json({
        success: false,
        error: 'Product type is required'
      });
    }

    console.log('Fetching products with custom pricing from Thyrocare API and database');

    const thyrocareApiUrl = (process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud').trim();

    // Enhanced logging for API key verification
    console.log('🔑 THYROCARE API KEY VERIFICATION:', {
      apiKeyPrefix: req.adminApiKey.substring(0, 10) + '...',
      apiKeyLength: req.adminApiKey.length,
      sessionId: req.adminSession._id,
      apiKeyExpiresAt: req.adminSession.apiKeyExpiresAt?.toISOString(),
      currentTime: new Date().toISOString(),
      isApiKeyExpired: req.adminSession.isApiKeyExpired()
    });

    // Step 1: Fetch products from ThyroCare API
    const response = await axios.post(`${thyrocareApiUrl}/api/productsmaster/Products`, {
      ProductType: productType,
      ApiKey: req.adminApiKey
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('ThyroCare products API response received');

    if (response.data.response !== 'Success') {
      throw new Error('Invalid response from ThyroCare API: ' + (response.data.response || 'No response field'));
    }

    // Step 2: Extract products based on type
    let thyrocareProducts = [];
    const master = response.data.master || {};
    
    switch (productType.toUpperCase()) {
      case 'OFFER':
        thyrocareProducts = master.offer || master.offers || master.OFFER || master.OFFERS || [];
        console.log(`OFFER products count: ${thyrocareProducts.length} items`);
        break;
      case 'TEST':
        thyrocareProducts = master.tests || master.TESTS || [];
        console.log(`TEST products: ${thyrocareProducts.length} items`);
        break;
      case 'PROFILE':
        thyrocareProducts = master.profile || master.PROFILE || [];
        console.log(`PROFILE products: ${thyrocareProducts.length} items`);
        break;
      case 'ALL':
        thyrocareProducts = [
          ...(master.offer || master.offers || master.OFFER || master.OFFERS || []),
          ...(master.tests || master.TESTS || []),
          ...(master.profile || master.PROFILE || [])
        ];
        console.log(`ALL products: ${thyrocareProducts.length} items`);
        break;
      default:
        thyrocareProducts = [];
        console.log(`Unknown product type: ${productType}`);
    }

    console.log(`Processing ${thyrocareProducts.length} products from ThyroCare`);

    // Step 3: Sync ThyroCare products with our database and get combined data
    const combinedProducts = [];
    let processedCount = 0;
    let errorCount = 0;
    
    for (const thyrocareProduct of thyrocareProducts) {
      try {
        console.log(`Processing product ${processedCount + 1}/${thyrocareProducts.length}:`, {
          code: thyrocareProduct.code,
          name: thyrocareProduct.name,
          type: thyrocareProduct.type
        });
        
        let product;
        
        // Use the appropriate model based on product type
        switch (thyrocareProduct.type?.toUpperCase()) {
          case 'TEST':
            product = await Test.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'PROFILE':
            product = await Profile.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'POP':
            product = await Profile.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          case 'OFFER':
            product = await Offer.findOrCreateFromThyroCare(thyrocareProduct);
            break;
          default:
            console.warn(`Unknown product type: ${thyrocareProduct.type}, defaulting to Test model`);
            product = await Test.findOrCreateFromThyroCare(thyrocareProduct);
        }
        
        // Get combined data for frontend
        const combinedData = product.getCombinedData();
        combinedProducts.push(combinedData);
        processedCount++;
        
        console.log(`Successfully processed product: ${thyrocareProduct.code}`);
      } catch (error) {
        console.error(`Error processing product ${thyrocareProduct.code}:`, error);
        console.error('Problematic product data:', thyrocareProduct);
        errorCount++;
        // Continue with other products even if one fails
      }
    }

    console.log(`Processing complete: ${processedCount} successful, ${errorCount} errors`);

    req.adminSession.lastProductFetch = new Date();
    await req.adminSession.save();

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRODUCT_FETCH',
      description: `Admin ${req.admin.name} fetched ${productType} products with custom pricing`,
      resource: 'products',
      endpoint: '/api/admin/products',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productType: productType,
        productCount: combinedProducts.length,
        thyrocareProductCount: thyrocareProducts.length,
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

    res.json({
      success: true,
      products: combinedProducts,
      response: 'Success',
      metadata: {
        totalProducts: combinedProducts.length,
        productType: productType,
        processedCount: processedCount,
        errorCount: errorCount
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Enhanced products proxy error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to fetch products with custom pricing: ${error.message}`,
      resource: 'products',
      endpoint: '/api/admin/products',
      method: 'POST',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: error.response?.status || 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productType: req.body.productType,
        errorType: error.response ? 'API_ERROR' : 'NETWORK_ERROR'
      }
    });

    if (error.response) {
      console.error('ThyroCare API error response:', {
        status: error.response.status,
        data: error.response.data
      });
      
      res.status(error.response.status).json({
        success: false,
        error: error.response.data?.response || 'Failed to fetch products'
      });
    } else if (error.request) {
      res.status(503).json({
        success: false,
        error: 'Failed to fetch products: Network error'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products: An unexpected error occurred'
      });
    }
  }
});

// New endpoint to update custom pricing
router.put('/products/pricing', adminAuth, async (req, res) => {
  const startTime = Date.now();
  const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.get('User-Agent') || '';

  try {
    const { code, discount } = req.body;

    if (!code || discount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Product code and discount are required'
      });
    }

    console.log('Updating custom pricing:', { 
      code, 
      discount,
      admin: req.admin.name,
      sessionId: req.adminSession._id 
    });

    // Update custom pricing in database - try each model to find the product
    let updatedProduct;
    let found = false;
    
    // Try Test model first
    try {
      updatedProduct = await Test.updateCustomPricing(code, discount);
      found = true;
    } catch (error) {
      // Product not found in Test model, continue to next model
    }
    
    // Try Profile model if not found
    if (!found) {
      try {
        updatedProduct = await Profile.updateCustomPricing(code, discount);
        found = true;
      } catch (error) {
        // Product not found in Profile model, continue to next model
      }
    }
    
    // Try Offer model if not found
    if (!found) {
      try {
        updatedProduct = await Offer.updateCustomPricing(code, discount);
        found = true;
      } catch (error) {
        // Product not found in any model
        throw new Error('Product not found');
      }
    }

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'PRICING_UPDATE',
      description: `Admin ${req.admin.name} updated pricing for product ${code}`,
      resource: 'products',
      endpoint: '/api/admin/products/pricing',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 200,
      responseTime: Date.now() - startTime,
      metadata: {
        productCode: code,
        discount: discount,
        sellingPrice: updatedProduct.sellingPrice
      }
    });

    res.json({
      success: true,
      product: updatedProduct,
      message: 'Pricing updated successfully'
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Pricing update error:', error);

    await AdminActivity.logActivity({
      adminId: req.admin._id,
      sessionId: req.adminSession._id,
      action: 'ERROR',
      description: `Failed to update pricing: ${error.message}`,
      resource: 'products',
      endpoint: '/api/admin/products/pricing',
      method: 'PUT',
      ipAddress: ipAddress,
      userAgent: userAgent,
      statusCode: 500,
      responseTime: responseTime,
      errorMessage: error.message,
      metadata: {
        productCode: req.body.code,
        discount: req.body.discount
      }
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update pricing'
    });
  }
});

export default router;
