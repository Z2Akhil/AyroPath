import axios from 'axios';
import AdminSession from '../models/AdminSession.js';
import ThyrocareRefreshService from './thyrocareRefreshService.js';

class ThyrocareCartService {
  constructor() {
    this.apiUrl = process.env.THYROCARE_API_URL;
  }

  async getApiKey() {
    try {
      const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();
      if (!apiKey) {
        throw new Error('No active API key available');
      }
      return apiKey;
    } catch (error) {
      console.error('❌ Failed to get API key:', error);
      throw new Error(`Failed to get API key: ${error.message}`);
    }
  }

  /**
   * Get admin mobile (username) from active AdminSession
   * @returns {Promise<string>} Admin mobile/username
   */
  async getAdminMobile() {
    try {
      // Find active session to get admin mobile
      const activeSession = await AdminSession.findOne({ isActive: true })
        .populate('adminId');

      if (!activeSession || !activeSession.adminId) {
        // Fallback to environment variable if no active session
        const fallbackMobile = process.env.THYROCARE_USERNAME;
        if (!fallbackMobile) {
          throw new Error('No active admin session and THYROCARE_USERNAME not configured');
        }
        console.warn('⚠️ Using fallback admin mobile from environment variable');
        return fallbackMobile;
      }

      // Get mobile from admin document
      return activeSession.adminId.mobile || process.env.THYROCARE_USERNAME || '';
    } catch (error) {
      console.error('❌ Failed to get admin mobile:', error);
      // Fallback to environment variable
      const fallbackMobile = process.env.THYROCARE_USERNAME;
      if (!fallbackMobile) {
        throw new Error(`Failed to get admin mobile: ${error.message}`);
      }
      return fallbackMobile;
    }
  }

  /**
   * Build Thyrocare API request from cart items
   * @param {Array} cartItems - Array of cart items
   * @param {Object} options - Additional options (benCount, reportType)
   * @returns {Promise<Object>} Request body for Thyrocare API
   */
  async buildThyrocareRequest(cartItems, options = {}) {
    const { benCount = 1, report = 1 } = options;

    // Filter out items with zero or invalid prices
    const validItems = cartItems.filter(item =>
      item && item.sellingPrice > 0 && item.productCode
    );

    if (validItems.length === 0) {
      throw new Error('No valid items in cart');
    }

    // Build products and rates arrays
    const products = [];
    const rates = [];

    validItems.forEach(item => {
      let productIdentifier = item.productCode;

      // For cart payload: use name for PROFILE and POP, use code for TEST and OFFER
      // Other Thyrocare API payloads (like booking) use code for all product types
      if (item.productType === 'PROFILE' || item.productType === 'POP') {
        productIdentifier = item.name || item.productCode;
      }

      products.push(productIdentifier);
      const rate = item.thyrocareRate || item.sellingPrice;
      rates.push(Math.round(rate)); // Round to nearest integer
    });

    // Get API key and admin mobile dynamically
    const apiKey = await this.getApiKey();
    const adminMobile = await this.getAdminMobile();

    console.log('📦 Building Thyrocare request with rates:', {
      products: products.join(','),
      rates: rates.join(','),
      itemRates: validItems.map(i => ({ code: i.productCode, thyrocareRate: i.thyrocareRate, sellingPrice: i.sellingPrice }))
    });

    return {
      ApiKey: apiKey,
      Products: products.join(','),
      Rates: rates.join(','),
      ClientType: 'PUBLIC',
      Mobile: adminMobile,
      BenCount: benCount.toString(),
      Report: report.toString(),
      Discount: ''
    };
  }

  /**
   * Call Thyrocare API to validate cart prices
   * @param {Array} cartItems - Array of cart items
   * @param {Object} options - Additional options
   * @returns {Object} Thyrocare API response with adjusted prices
   */
  async validateCartWithThyrocare(cartItems, options = {}) {
    try {
      const requestBody = await this.buildThyrocareRequest(cartItems, options);

      console.log('📞 Calling Thyrocare cart validation API:', {
        url: `${this.apiUrl}/api/CartMaster/DSAViewCartDTL`,
        productCount: cartItems.length,
        options
      });

      const response = await axios.post(
        `${this.apiUrl}/api/CartMaster/DSAViewCartDTL`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('✅ Thyrocare API response:', {
        status: response.status,
        responseId: response.data?.respId,
        payable: response.data?.payable,
        margin: response.data?.margin
      });

      return {
        success: true,
        data: response.data,
        request: requestBody
      };

    } catch (error) {
      console.error('❌ Thyrocare API error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      };
    }
  }

  /**
   * Adjust cart prices based on Thyrocare validation
   * @param {Array} cartItems - Original cart items
   * @param {Object} thyrocareResponse - Thyrocare API response
   * @returns {Object} Adjusted cart items with collection charge info
   */
  adjustCartPrices(cartItems, thyrocareResponse, options = {}) {
    const { benCount = 1 } = options;
    if (!thyrocareResponse.success || !thyrocareResponse.data) {
      console.log('⚠️ Using local prices (Thyrocare validation failed)');

      const ourTotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      const COLLECTION_CHARGE = 200;
      const MINIMUM_ORDER = 300;

      let collectionCharge = 0;
      let hasCollectionCharge = false;

      if (ourTotal > 0 && ourTotal < MINIMUM_ORDER) {
        collectionCharge = COLLECTION_CHARGE;
        hasCollectionCharge = true;
        console.log('💰 [Local Fallback] Collection charge applied (Order < 300)');
      }

      return {
        adjustedItems: cartItems,
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge,
          grandTotal: ourTotal + collectionCharge
        }
      };
    }

    const thyrocareData = thyrocareResponse.data;
    const thyrocarePayable = parseFloat(thyrocareData.payable) || 0;
    const thyrocareMargin = parseFloat(thyrocareData.margin) || 0;
    const thyrocareProduct = thyrocareData.product || '';
    const thyrocareRates = thyrocareData.rates || '';

    console.log('📊 Thyrocare validation data:', {
      product: thyrocareProduct,
      payable: thyrocarePayable,
      margin: thyrocareMargin,
      rates: thyrocareRates
    });

    // Calculate our current totals
    const ourTotalSelling = cartItems.reduce((sum, item) =>
      sum + (item.sellingPrice * item.quantity), 0
    );
    // Sent Total (The basis on which Thyrocare calculates margin)
    const sentTotal = cartItems.reduce((sum, item) =>
      sum + ((item.thyrocareRate || item.sellingPrice) * item.quantity), 0
    );

    // Current Passon (Discount we are giving relative to the sent rates)
    // Must multiply by benCount since Thyrocare margin is for all beneficiaries
    const currentPasson = Math.max(0, sentTotal - ourTotalSelling) * benCount;

    // Detect collection charge (₹200 when product total < ₹300)
    const COLLECTION_CHARGE = 200;
    const MINIMUM_ORDER = 300;

    // Product-only B2B cost (Sent Total - Margin)
    const thyrocareProductCost = Math.max(0, sentTotal - thyrocareMargin);

    let collectionCharge = 0;
    let hasCollectionCharge = false;

    // If there's a ~200 difference between total payable and our calculated product cost, it's a collection charge
    if (Math.abs(thyrocarePayable - thyrocareProductCost - COLLECTION_CHARGE) <= 10) {
      collectionCharge = COLLECTION_CHARGE;
      hasCollectionCharge = true;
      console.log('💰 Collection charge detected via cost comparison:', {
        thyrocarePayable,
        thyrocareProductCost,
        collectionCharge
      });
    } else if (thyrocareProductCost < MINIMUM_ORDER && thyrocarePayable >= MINIMUM_ORDER) {
      // Fallback detection logic
      collectionCharge = COLLECTION_CHARGE;
      hasCollectionCharge = true;
      console.log('💰 Collection charge detected via threshold:', {
        thyrocareProductCost,
        collectionCharge
      });
    }

    // Check for consolidation (multiple items matching one Thyrocare product)
    const thyrocareProducts = thyrocareProduct.split(',').filter(p => p.trim());

    if (thyrocareProducts.length === 1 && cartItems.length > 1) {
      console.log('🔄 Thyrocare consolidated items:', {
        returnedProduct: thyrocareProducts[0],
        ourItems: cartItems.length
      });

      const matchedItems = this.matchThyrocareProductToItems(cartItems, thyrocareProducts[0]);

      if (matchedItems.length > 0) {
        // In consolidation case, we follow Thyrocare's single price
        const mainItemCode = matchedItems[0].productCode;
        // Total price for the group
        const targetPrice = thyrocareProductCost; // B2B cost is the target when passon is maxed

        const adjustedItems = cartItems.map(item => {
          if (item.productCode === mainItemCode) {
            return {
              ...item,
              sellingPrice: targetPrice,
              discount: Math.max(0, item.originalPrice - targetPrice)
            };
          } else {
            return {
              ...item,
              sellingPrice: 0,
              discount: item.originalPrice,
              includedIn: matchedItems[0].name
            };
          }
        });

        return {
          adjustedItems,
          collectionCharge,
          hasCollectionCharge,
          breakdown: {
            productTotal: targetPrice,
            collectionCharge,
            grandTotal: targetPrice + collectionCharge
          }
        };
      }
    }

    // Logic: If current passon <= thyrocare margin, DO NOTHING
    if (currentPasson <= thyrocareMargin) {
      console.log('✅ Current passon is within margin. No adjustment needed.', {
        currentPasson,
        thyrocareMargin
      });
      return {
        adjustedItems: cartItems,
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotalSelling,
          collectionCharge,
          grandTotal: ourTotalSelling + collectionCharge
        }
      };
    }

    // Logic: If current passon > thyrocare margin, adjust prices to match max margin
    // This means totalSellingPrice should be thyrocarePayable (B2B cost)
    console.log('🔄 Passon exceeds margin. Adjusting prices to match Thyrocare margin.', {
      currentPasson,
      thyrocareMargin,
      newTargetTotal: thyrocareProductCost
    });

    const adjustmentRatio = ourTotalSelling > 0 ? thyrocareProductCost / ourTotalSelling : 1;

    let adjustedItems = cartItems.map(item => {
      let newSellingPrice = Math.round(item.sellingPrice * adjustmentRatio);

      // Ensure it doesn't exceed B2C rate
      if (newSellingPrice > item.originalPrice) {
        newSellingPrice = item.originalPrice;
      }

      return {
        ...item,
        sellingPrice: newSellingPrice,
        discount: Math.max(0, item.originalPrice - newSellingPrice)
      };
    });

    // Final check: Does total match thyrocarePayable? 
    // Small differences might arise due to rounding or B2C capping.
    const finalProductTotal = adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    if (Math.abs(finalProductTotal - thyrocareProductCost) > 1) {
      console.log('⚠️ Post-adjustment total mismatch:', { finalProductTotal, thyrocareProductCost });
      // We could add a final correction to the most expensive item here if critical, 
      // but usually rounding/capping issues are negligible.
    }

    return {
      adjustedItems,
      collectionCharge,
      hasCollectionCharge,
      breakdown: {
        productTotal: finalProductTotal,
        collectionCharge,
        grandTotal: finalProductTotal + collectionCharge
      }
    };
  }


  /**
   * Match Thyrocare returned product to our cart items
   * @param {Array} cartItems - Our cart items
   * @param {String} thyrocareProduct - Product returned by Thyrocare
   * @returns {Array} Matched items
   */
  matchThyrocareProductToItems(cartItems, thyrocareProduct) {
    // Try different matching strategies
    const matches = [];

    // 1. Exact name match
    const nameMatch = cartItems.find(item =>
      item.name === thyrocareProduct || item.productCode === thyrocareProduct
    );
    if (nameMatch) matches.push(nameMatch);

    // 2. Partial name match
    if (matches.length === 0) {
      const partialMatch = cartItems.find(item =>
        item.name.includes(thyrocareProduct) || thyrocareProduct.includes(item.name)
      );
      if (partialMatch) matches.push(partialMatch);
    }

    // 3. Check if it's a profile/offer that includes other items
    if (matches.length === 0) {
      const profileOfferMatch = cartItems.find(item =>
        item.productType === 'PROFILE' || item.productType === 'OFFER' || item.productType === 'POP'
      );
      if (profileOfferMatch) matches.push(profileOfferMatch);
    }

    return matches;
  }

  /**
   * Validate and adjust cart with Thyrocare API
   * @param {Array} cartItems - Cart items to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result with adjusted items and collection charge info
   */
  async validateAndAdjustCart(cartItems, options = {}) {
    // Skip validation if no items
    if (!cartItems || cartItems.length === 0) {
      return {
        success: true,
        adjustedItems: cartItems,
        validationApplied: false,
        collectionCharge: 0,
        hasCollectionCharge: false,
        breakdown: {
          productTotal: 0,
          collectionCharge: 0,
          grandTotal: 0
        },
        message: 'Empty cart, no validation needed'
      };
    }

    try {
      // Call Thyrocare API
      const validationResult = await this.validateCartWithThyrocare(cartItems, options);

      // Adjust prices based on Thyrocare response
      const adjustmentResult = this.adjustCartPrices(cartItems, validationResult, options);

      return {
        success: true,
        adjustedItems: adjustmentResult.adjustedItems,
        validationApplied: validationResult.success,
        collectionCharge: adjustmentResult.collectionCharge,
        hasCollectionCharge: adjustmentResult.hasCollectionCharge,
        breakdown: adjustmentResult.breakdown,
        thyrocareResponse: validationResult.data,
        request: validationResult.request,
        message: validationResult.success ?
          'Cart validated with Thyrocare' :
          'Used local prices (Thyrocare validation failed)'
      };

    } catch (error) {
      console.error('❌ Cart validation error:', error);

      const ourTotal = cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
      const COLLECTION_CHARGE = 200;
      const MINIMUM_ORDER = 300;

      let collectionCharge = 0;
      let hasCollectionCharge = false;

      if (ourTotal > 0 && ourTotal < MINIMUM_ORDER) {
        collectionCharge = COLLECTION_CHARGE;
        hasCollectionCharge = true;
        console.log('💰 [Local Error Fallback] Collection charge applied (Order < 300)');
      }

      return {
        success: false,
        adjustedItems: cartItems, // Fallback to original items
        validationApplied: false,
        collectionCharge,
        hasCollectionCharge,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge,
          grandTotal: ourTotal + collectionCharge
        },
        error: error.message,
        message: 'Cart validation failed, using local prices'
      };
    }
  }

  /**
   * Calculate margin for cart items
   * @param {Array} cartItems - Cart items
   * @returns {Object} Margin calculations
   */
  calculateCartMargins(cartItems) {
    const totalOriginal = cartItems.reduce((sum, item) =>
      sum + (item.originalPrice * item.quantity), 0
    );

    const totalSelling = cartItems.reduce((sum, item) =>
      sum + (item.sellingPrice * item.quantity), 0
    );

    const totalDiscount = totalOriginal - totalSelling;
    const marginPercentage = totalOriginal > 0 ? (totalDiscount / totalOriginal) * 100 : 0;

    return {
      totalOriginal,
      totalSelling,
      totalDiscount,
      marginPercentage,
      items: cartItems.map(item => ({
        productCode: item.productCode,
        productType: item.productType,
        originalPrice: item.originalPrice,
        sellingPrice: item.sellingPrice,
        discount: item.discount,
        margin: item.originalPrice > 0 ?
          ((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100 : 0
      }))
    };
  }
}

// Create singleton instance
const thyrocareCartService = new ThyrocareCartService();

export default thyrocareCartService;
