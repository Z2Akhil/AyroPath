import axios from 'axios';

/**
 * Thyrocare Cart Validation Service
 * Validates cart prices with Thyrocare API and adjusts if needed
 */

class ThyrocareCartService {
  constructor() {
    this.apiUrl = process.env.THYROCARE_API_URL;
    this.apiKey = process.env.THYROCARE_API_KEY;
    this.adminMobile = process.env.THYROCARE_USERNAME;
  }

  /**
   * Build Thyrocare API request from cart items
   * @param {Array} cartItems - Array of cart items
   * @param {Object} options - Additional options (benCount, reportType)
   * @returns {Object} Request body for Thyrocare API
   */
  buildThyrocareRequest(cartItems, options = {}) {
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
      let productCode = item.productCode;
      
      // For profiles, we might need to use name instead of code
      // This needs to be confirmed with business logic
      if (item.productType === 'PROFILE') {
        // Try to use name if available, otherwise use code
        productCode = item.name || item.productCode;
      }
      
      products.push(productCode);
      rates.push(Math.round(item.sellingPrice)); // Round to nearest integer
    });

    return {
      ApiKey: this.apiKey,
      Products: products.join(','),
      Rates: rates.join(','),
      ClientType: 'PUBLIC',
      Mobile: this.adminMobile,
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
      const requestBody = this.buildThyrocareRequest(cartItems, options);
      
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
  adjustCartPrices(cartItems, thyrocareResponse) {
    if (!thyrocareResponse.success || !thyrocareResponse.data) {
      console.log('⚠️ Using local prices (Thyrocare validation failed)');
      return {
        adjustedItems: cartItems,
        collectionCharge: 0,
        hasCollectionCharge: false,
        breakdown: {
          productTotal: cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0),
          collectionCharge: 0,
          grandTotal: cartItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0)
        }
      };
    }

    const thyrocareData = thyrocareResponse.data;
    const thyrocarePayable = parseFloat(thyrocareData.payable) || 0;
    const thyrocareMargin = parseFloat(thyrocareData.margin) || 0;
    const thyrocareProduct = thyrocareData.product || '';

    console.log('📊 Thyrocare validation data:', {
      product: thyrocareProduct,
      payable: thyrocarePayable,
      margin: thyrocareMargin,
      rates: thyrocareData.rates
    });

    // Calculate our total
    const ourTotal = cartItems.reduce((sum, item) => 
      sum + (item.sellingPrice * item.quantity), 0
    );

    // Check for collection charge (₹200 when order < ₹300)
    const COLLECTION_CHARGE = 200;
    const MINIMUM_ORDER = 300;
    let collectionCharge = 0;
    let hasCollectionCharge = false;

    if (ourTotal < MINIMUM_ORDER && Math.abs(thyrocarePayable - ourTotal - COLLECTION_CHARGE) <= 1) {
      // Detected collection charge: thyrocarePayable = ourTotal + 200
      collectionCharge = COLLECTION_CHARGE;
      hasCollectionCharge = true;
      console.log('💰 Collection charge detected:', {
        ourTotal,
        thyrocarePayable,
        collectionCharge,
        reason: 'Order amount less than ₹300'
      });
    }

    // Check if Thyrocare returned only one product (others were included)
    const thyrocareProducts = thyrocareProduct.split(',').filter(p => p.trim());
    
    if (thyrocareProducts.length === 1 && cartItems.length > 1) {
      // Thyrocare consolidated multiple items into one
      console.log('🔄 Thyrocare consolidated items:', {
        returnedProduct: thyrocareProducts[0],
        ourItems: cartItems.length,
        thyrocareRate: thyrocareData.rates
      });
      
      // Find which item matches the returned product
      const matchedItems = this.matchThyrocareProductToItems(cartItems, thyrocareProducts[0]);
      
      if (matchedItems.length > 0) {
        // Keep only the matched item (others were included)
        console.log('✅ Keeping only main product:', matchedItems[0].name);
        
        // Update the matched item with Thyrocare price
        const adjustedItems = cartItems.map(item => {
          if (item.productCode === matchedItems[0].productCode && 
              item.productType === matchedItems[0].productType) {
            // This is the main product - update with Thyrocare price
            const thyrocareRate = parseFloat(thyrocareData.rates) || thyrocarePayable;
            return {
              ...item,
              sellingPrice: thyrocareRate,
              discount: Math.max(0, item.originalPrice - thyrocareRate)
            };
          } else {
            // This item was included in the main product - remove or keep with zero price?
            // For now, keep with zero price to show in cart but not charge
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
            productTotal: adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0),
            collectionCharge,
            grandTotal: adjustedItems.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0) + collectionCharge
          }
        };
      }
    }

    // If totals match (within small tolerance), no adjustment needed
    const tolerance = 0.01; // 1 paisa tolerance
    if (Math.abs(thyrocarePayable - ourTotal) <= tolerance) {
      console.log('✅ Prices match Thyrocare validation');
      return {
        adjustedItems: cartItems,
        collectionCharge: 0,
        hasCollectionCharge: false,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge: 0,
          grandTotal: ourTotal
        }
      };
    }

    console.log('🔄 Adjusting prices based on Thyrocare validation:', {
      ourTotal,
      thyrocarePayable,
      thyrocareMargin,
      difference: thyrocarePayable - ourTotal
    });

    // Calculate adjustment ratio (excluding collection charge if detected)
    const productTotal = hasCollectionCharge ? thyrocarePayable - collectionCharge : thyrocarePayable;
    const adjustmentRatio = productTotal / ourTotal;

    // Adjust each item's selling price proportionally
    const adjustedItems = cartItems.map(item => {
      const adjustedSellingPrice = Math.round(item.sellingPrice * adjustmentRatio);
      const adjustedDiscount = Math.max(0, item.originalPrice - adjustedSellingPrice);
      
      // Calculate margin for this item
      const itemCost = item.originalPrice - adjustedDiscount;
      const itemMargin = itemCost > 0 ? adjustedDiscount / itemCost : 0;

      // Ensure margin doesn't exceed Thyrocare's allowed margin
      let finalSellingPrice = adjustedSellingPrice;
      if (thyrocareMargin > 0 && itemMargin > thyrocareMargin) {
        // Adjust to match Thyrocare margin
        const maxDiscount = item.originalPrice * (thyrocareMargin / (1 + thyrocareMargin));
        finalSellingPrice = Math.round(item.originalPrice - maxDiscount);
      }

      return {
        ...item,
        sellingPrice: finalSellingPrice,
        discount: Math.max(0, item.originalPrice - finalSellingPrice)
      };
    });

    // Recalculate total after adjustment
    const adjustedProductTotal = adjustedItems.reduce((sum, item) => 
      sum + (item.sellingPrice * item.quantity), 0
    );
    const grandTotal = adjustedProductTotal + collectionCharge;

    console.log('✅ Price adjustment complete:', {
      originalTotal: ourTotal,
      adjustedProductTotal,
      collectionCharge,
      grandTotal,
      adjustmentRatio,
      hasCollectionCharge
    });

    return {
      adjustedItems,
      collectionCharge,
      hasCollectionCharge,
      breakdown: {
        productTotal: adjustedProductTotal,
        collectionCharge,
        grandTotal
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
        item.productType === 'PROFILE' || item.productType === 'OFFER'
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
      const adjustmentResult = this.adjustCartPrices(cartItems, validationResult);

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
      
      return {
        success: false,
        adjustedItems: cartItems, // Fallback to original items
        validationApplied: false,
        collectionCharge: 0,
        hasCollectionCharge: false,
        breakdown: {
          productTotal: ourTotal,
          collectionCharge: 0,
          grandTotal: ourTotal
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
