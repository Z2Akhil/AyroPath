import express from 'express';
import jwt from 'jsonwebtoken';
import Cart from '../models/Cart.js';
import Test from '../models/Test.js';
import Profile from '../models/Profile.js';
import Offer from '../models/Offer.js';
import User from '../models/User.js';
import thyrocareCartService from '../services/thyrocareCartService.js';

// Optional auth middleware that doesn't require authentication
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer", "").trim();

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (user && user.isActive && user.isVerified) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};
// refresh every row with live product data
const refreshCartPrices = async (cart) => {
  console.log('🔄 refreshCartPrices called, items before:');
  if (!cart || !cart.items.length) return cart;

  for (let i = 0; i < cart.items.length; i++) {
    const row = cart.items[i];
    try {
      const fresh = await getProductDetails(row.productCode, row.productType);
      // keep the user’s quantity, overwrite everything else
      cart.items[i] = { ...fresh, quantity: row.quantity };
    } catch (e) {
      // product no longer exists → remove it silently
      cart.items.splice(i, 1);
      i--;
    }
  }
  return cart;
};
// Required auth middleware
const requiredAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid token or user not found.",
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your mobile number first.",
      });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

const router = express.Router();

// Helper function to generate guest session ID
const generateGuestSessionId = () => {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get product details
const getProductDetails = async (productCode, productType) => {
  let product;

  switch (productType) {
    case 'TEST':
      product = await Test.findOne({ code: productCode, isActive: true });
      break;
    case 'PROFILE':
      product = await Profile.findOne({ code: productCode, isActive: true });
      break;
    case 'OFFER':
      product = await Offer.findOne({ code: productCode, isActive: true });
      break;
    default:
      throw new Error(`Unknown product type: ${productType}`);
  }

  if (!product) {
    throw new Error(`Product not found: ${productCode} (${productType})`);
  }

  const combinedData = product.getCombinedData();

  // Calculate proper prices based on the actual data structure
  const originalPrice = combinedData.rate?.b2C || 0;
  const sellingPrice = combinedData.sellingPrice || combinedData.rate?.offerRate || 0;
  const discount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;

  return {
    productCode: product.code,
    productType: productType,
    name: product.name,
    originalPrice: originalPrice,
    sellingPrice: sellingPrice,
    discount: discount,
    thyrocareRate: combinedData.thyrocareRate
  };
};

// Helper function to check for duplicate tests
const checkForDuplicateTests = async (cartItems, newItem) => {
  // If new item is a TEST, check if it's included in any Profile/Offer in cart
  if (newItem.productType === 'TEST') {
    for (const cartItem of cartItems) {
      if (cartItem.productType === 'PROFILE' || cartItem.productType === 'OFFER') {
        // Get the profile/offer details to check its childs
        let product;
        if (cartItem.productType === 'PROFILE') {
          product = await Profile.findOne({ code: cartItem.productCode, isActive: true });
        } else {
          product = await Offer.findOne({ code: cartItem.productCode, isActive: true });
        }

        if (product && product.thyrocareData.childs) {
          // Check if the test is included in this profile/offer
          const isIncluded = product.thyrocareData.childs.some(
            child => child.code === newItem.productCode
          );

          if (isIncluded) {
            return {
              hasDuplicates: true,
              action: 'prevent',
              message: `Test ${newItem.productCode} is already included in ${cartItem.productType} ${cartItem.name}`,
              details: {
                testCode: newItem.productCode,
                testName: newItem.name,
                includedIn: cartItem.productCode,
                includedInName: cartItem.name,
                includedInType: cartItem.productType
              }
            };
          }
        }
      }
    }
  }

  // If new item is a PROFILE or OFFER, check if it includes any Tests in cart
  if (newItem.productType === 'PROFILE' || newItem.productType === 'OFFER') {
    let product;
    if (newItem.productType === 'PROFILE') {
      product = await Profile.findOne({ code: newItem.productCode, isActive: true });
    } else {
      product = await Offer.findOne({ code: newItem.productCode, isActive: true });
    }

    if (product && product.thyrocareData.childs) {
      const duplicateTests = [];

      // Check each test in cart against the profile/offer's childs
      for (const cartItem of cartItems) {
        if (cartItem.productType === 'TEST') {
          const isIncluded = product.thyrocareData.childs.some(
            child => child.code === cartItem.productCode
          );

          if (isIncluded) {
            duplicateTests.push({
              testCode: cartItem.productCode,
              testName: cartItem.name,
              profileOfferCode: newItem.productCode,
              profileOfferName: newItem.name,
              profileOfferType: newItem.productType
            });
          }
        }
      }

      if (duplicateTests.length > 0) {
        return {
          hasDuplicates: true,
          action: 'remove',
          message: `${newItem.productType} ${newItem.name} includes ${duplicateTests.length} test(s) already in your cart`,
          details: {
            duplicateTests: duplicateTests,
            profileOfferCode: newItem.productCode,
            profileOfferName: newItem.name,
            profileOfferType: newItem.productType
          }
        };
      }
    }
  }

  // No duplicates found
  return {
    hasDuplicates: false,
    action: 'allow',
    message: 'No duplicate tests found'
  };
};

// Get user's cart
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('🔍 Fetching cart:', {
      userId: userId || 'guest',
      guestSessionId: guestSessionId ? 'provided' : 'not provided'
    });

    let cart = await Cart.findByUserOrGuest(userId, guestSessionId);

    if (!cart) {
      // Create empty cart if none exists
      cart = await Cart.createOrUpdateCart(
        userId,
        guestSessionId || generateGuestSessionId(),
        []
      );

      console.log('🆕 Created new cart:', {
        cartId: cart._id,
        userId: userId || 'guest',
        guestSessionId: cart.guestSessionId
      });
    }
    await refreshCartPrices(cart);
    await cart.save();

    // Validate cart with Thyrocare API for GET request too
    let validationResult = null;
    try {
      validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

      if (validationResult.success && validationResult.validationApplied) {
        // Update cart with Thyrocare-validated prices
        cart.items = validationResult.adjustedItems;
        await cart.save();

        console.log('✅ Cart validated with Thyrocare (GET request):', {
          validationApplied: true,
          hasCollectionCharge: validationResult.hasCollectionCharge,
          collectionCharge: validationResult.collectionCharge
        });
      }
    } catch (validationError) {
      console.error('❌ Thyrocare validation error (GET request):', validationError);
      // Continue with local prices if validation fails
    }

    const collectionCharge = validationResult?.collectionCharge || 0;
    const summary = cart.getSummary(collectionCharge);

    console.log('✅ Cart fetched with validated prices:', {
      totalItems: summary.totalItems,
      productTotal: summary.productTotal,
      collectionCharge: summary.collectionCharge,
      totalAmount: summary.totalAmount,
      validationApplied: validationResult?.validationApplied || false
    });

    res.json({
      success: true,
      cart: summary,
      guestSessionId: cart.guestSessionId,
      thyrocareValidation: validationResult?.validationApplied || false,
      thyrocareMessage: validationResult?.message,
      collectionCharge: summary.collectionCharge,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false,
      breakdown: validationResult?.breakdown || {
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        grandTotal: summary.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message
    });
  }
});

// Add item to cart with duplicate test validation
router.post('/items', optionalAuth, async (req, res) => {
  try {
    const { productCode, productType, quantity = 1, skipValidation = false } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('➕ Adding item to cart:', { productCode, productType, quantity, userId: userId || 'guest', skipValidation });

    if (!productCode || !productType) {
      return res.status(400).json({ success: false, message: 'Product code and type are required' });
    }

    // 1. Get latest product data
    const productDetails = await getProductDetails(productCode, productType);

    // 2. Find or create cart
    let cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    if (!cart) {
      cart = await Cart.createOrUpdateCart(userId, guestSessionId || generateGuestSessionId(), []);
    }

    // 3. Check for duplicate tests (unless validation is skipped)
    let duplicateCheckResult = null;
    if (!skipValidation) {
      duplicateCheckResult = await checkForDuplicateTests(cart.items, productDetails);

      if (duplicateCheckResult.hasDuplicates) {
        // Return validation result without adding to cart
        return res.status(200).json({
          success: false,
          validation: duplicateCheckResult,
          message: duplicateCheckResult.message,
          requiresConfirmation: true,
          data: {
            product: productDetails,
            cart: cart.getSummary()
          }
        });
      }
    }

    // 4. Validation: Only one product of type 'OFFER' allowed
    if (productType === 'OFFER') {
      const existingOffer = cart.items.find(i => i.productType === 'OFFER' && i.productCode !== productCode);
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Only one offer product can be added per order.'
        });
      }
    }

    // 5. Check if product already exists in cart
    const existing = cart.items.find(
      i => i.productCode === productCode && i.productType === productType
    );

    if (existing) {
      // Product already in cart - don't increase quantity, just return success
      await refreshCartPrices(cart);
      await cart.save();

      // Validate cart with Thyrocare API for already in cart case too
      let validationResult = null;
      try {
        validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

        if (validationResult.success && validationResult.validationApplied) {
          // Update cart with Thyrocare-validated prices
          cart.items = validationResult.adjustedItems;
          await cart.save();
        }
      } catch (validationError) {
        console.error('❌ Thyrocare validation error (already in cart):', validationError);
      }

      const collectionCharge = validationResult?.collectionCharge || 0;
      const summary = cart.getSummary(collectionCharge);

      console.log('✅ Product already in cart, returning current cart:', {
        productCode,
        productType,
        cartId: cart._id,
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        totalAmount: summary.totalAmount
      });

      return res.json({
        success: true,
        message: 'Product already in cart',
        cart: summary,
        guestSessionId: cart.guestSessionId,
        alreadyInCart: true,
        thyrocareValidation: validationResult?.validationApplied || false,
        thyrocareMessage: validationResult?.message,
        collectionCharge: summary.collectionCharge,
        hasCollectionCharge: validationResult?.hasCollectionCharge || false,
        breakdown: validationResult?.breakdown || {
          productTotal: summary.productTotal,
          collectionCharge: summary.collectionCharge,
          grandTotal: summary.totalAmount
        }
      });
    }

    // 6. Add new item to cart (quantity always 1)
    cart.items.push({ ...productDetails, quantity: 1 });

    await cart.save();

    // 7. Refresh prices from product data
    await refreshCartPrices(cart);
    await cart.save();

    // 8. Validate cart with Thyrocare API
    let validationResult = null;
    try {
      validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

      if (validationResult.success && validationResult.validationApplied) {
        // Update cart with Thyrocare-validated prices
        cart.items = validationResult.adjustedItems;
        await cart.save();

        console.log('✅ Cart validated with Thyrocare:', {
          validationApplied: true,
          hasCollectionCharge: validationResult.hasCollectionCharge,
          collectionCharge: validationResult.collectionCharge,
          thyrocareResponse: validationResult.thyrocareResponse
        });
      } else {
        console.log('ℹ️ Using local prices (Thyrocare validation not applied):', {
          validationApplied: false,
          message: validationResult?.message
        });
      }
    } catch (validationError) {
      console.error('❌ Thyrocare validation error (using local prices):', validationError);
      // Continue with local prices if validation fails
    }

    const collectionCharge = validationResult?.collectionCharge || 0;
    const summary = cart.getSummary(collectionCharge);

    console.log('✅ Cart returned with validated prices:', {
      totalItems: summary.totalItems,
      productTotal: summary.productTotal,
      collectionCharge: summary.collectionCharge,
      totalAmount: summary.totalAmount,
      validationApplied: validationResult?.validationApplied || false,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false
    });

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId,
      validation: duplicateCheckResult || { hasDuplicates: false, action: 'allow' },
      thyrocareValidation: validationResult?.validationApplied || false,
      thyrocareMessage: validationResult?.message,
      collectionCharge: summary.collectionCharge,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false,
      breakdown: validationResult?.breakdown || {
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        grandTotal: summary.totalAmount
      }
    });
  } catch (error) {
    console.error('❌ Error adding item to cart:', error);
    if (error.message.includes('Product not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to add item to cart', error: error.message });
  }
});

// Add item to cart with confirmation (removing duplicate tests)
router.post('/items/with-confirmation', optionalAuth, async (req, res) => {
  try {
    const { productCode, productType, quantity = 1, removeDuplicateTests = [] } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('➕ Adding item to cart with confirmation:', {
      productCode,
      productType,
      quantity,
      removeDuplicateTests,
      userId: userId || 'guest'
    });

    if (!productCode || !productType) {
      return res.status(400).json({ success: false, message: 'Product code and type are required' });
    }

    // 1. Get latest product data
    const productDetails = await getProductDetails(productCode, productType);

    // 2. Find or create cart
    let cart = await Cart.findByUserOrGuest(userId, guestSessionId);
    if (!cart) {
      cart = await Cart.createOrUpdateCart(userId, guestSessionId || generateGuestSessionId(), []);
    }

    // 3. Remove duplicate tests if specified
    if (removeDuplicateTests && removeDuplicateTests.length > 0) {
      console.log(`🗑️ Removing duplicate tests: ${removeDuplicateTests.join(', ')}`);
      cart.items = cart.items.filter(item =>
        !(item.productType === 'TEST' && removeDuplicateTests.includes(item.productCode))
      );
    }

    // 4. Validation: Only one product of type 'OFFER' allowed
    if (productType === 'OFFER') {
      const existingOffer = cart.items.find(i => i.productType === 'OFFER' && i.productCode !== productCode);
      if (existingOffer) {
        return res.status(400).json({
          success: false,
          message: 'Only one offer product can be added per order.'
        });
      }
    }

    // 5. Check if product already exists in cart
    const existing = cart.items.find(
      i => i.productCode === productCode && i.productType === productType
    );

    if (existing) {
      // Product already in cart - don't increase quantity, just return success
      await refreshCartPrices(cart);
      await cart.save();

      // Validate cart with Thyrocare API for already in cart case too
      let validationResult = null;
      try {
        validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

        if (validationResult.success && validationResult.validationApplied) {
          // Update cart with Thyrocare-validated prices
          cart.items = validationResult.adjustedItems;
          await cart.save();
        }
      } catch (validationError) {
        console.error('❌ Thyrocare validation error (already in cart with confirmation):', validationError);
      }

      const collectionCharge = validationResult?.collectionCharge || 0;
      const summary = cart.getSummary(collectionCharge);

      console.log('✅ Product already in cart (with confirmation), returning current cart:', {
        productCode,
        productType,
        cartId: cart._id,
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        totalAmount: summary.totalAmount
      });

      return res.json({
        success: true,
        message: 'Product already in cart',
        cart: summary,
        guestSessionId: cart.guestSessionId,
        alreadyInCart: true,
        thyrocareValidation: validationResult?.validationApplied || false,
        thyrocareMessage: validationResult?.message,
        collectionCharge: summary.collectionCharge,
        hasCollectionCharge: validationResult?.hasCollectionCharge || false,
        breakdown: validationResult?.breakdown || {
          productTotal: summary.productTotal,
          collectionCharge: summary.collectionCharge,
          grandTotal: summary.totalAmount
        }
      });
    }

    // 6. Add new item to cart (quantity always 1)
    cart.items.push({ ...productDetails, quantity: 1 });

    await cart.save();

    // 6. Refresh prices from product data
    await refreshCartPrices(cart);
    await cart.save();

    // 7. Validate cart with Thyrocare API
    let validationResult = null;
    try {
      validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

      if (validationResult.success && validationResult.validationApplied) {
        // Update cart with Thyrocare-validated prices
        cart.items = validationResult.adjustedItems;
        await cart.save();

        console.log('✅ Cart validated with Thyrocare (with confirmation):', {
          validationApplied: true,
          hasCollectionCharge: validationResult.hasCollectionCharge,
          collectionCharge: validationResult.collectionCharge,
          thyrocareResponse: validationResult.thyrocareResponse
        });
      } else {
        console.log('ℹ️ Using local prices (Thyrocare validation not applied):', {
          validationApplied: false,
          message: validationResult?.message
        });
      }
    } catch (validationError) {
      console.error('❌ Thyrocare validation error (using local prices):', validationError);
      // Continue with local prices if validation fails
    }

    const collectionCharge = validationResult?.collectionCharge || 0;
    const summary = cart.getSummary(collectionCharge);

    console.log('✅ Item added to cart with confirmation:', {
      cartId: cart._id,
      removedTests: removeDuplicateTests,
      totalItems: summary.totalItems,
      productTotal: summary.productTotal,
      collectionCharge: summary.collectionCharge,
      totalAmount: summary.totalAmount,
      validationApplied: validationResult?.validationApplied || false,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false
    });

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId,
      removedTests: removeDuplicateTests,
      thyrocareValidation: validationResult?.validationApplied || false,
      thyrocareMessage: validationResult?.message,
      collectionCharge: summary.collectionCharge,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false,
      breakdown: validationResult?.breakdown || {
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        grandTotal: summary.totalAmount
      }
    });
  } catch (error) {
    console.error('❌ Error adding item to cart with confirmation:', error);
    if (error.message.includes('Product not found')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to add item to cart', error: error.message });
  }
});

// Update item quantity
router.put('/items/:productCode', optionalAuth, async (req, res) => {
  try {
    const { productCode } = req.params;
    const { productType, quantity } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('🔄 Updating cart item:', {
      productCode,
      productType,
      quantity,
      userId: userId || 'guest'
    });

    if (!productType || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Product type and quantity are required'
      });
    }

    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.updateQuantity(productCode, productType, parseInt(quantity));
    await refreshCartPrices(cart);
    await cart.save();

    // Validate cart with Thyrocare API after update
    let validationResult = null;
    try {
      validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

      if (validationResult.success && validationResult.validationApplied) {
        // Update cart with Thyrocare-validated prices
        cart.items = validationResult.adjustedItems;
        await cart.save();

        console.log('✅ Cart validated with Thyrocare after update:', {
          validationApplied: true,
          hasCollectionCharge: validationResult.hasCollectionCharge,
          collectionCharge: validationResult.collectionCharge
        });
      }
    } catch (validationError) {
      console.error('❌ Thyrocare validation error after update:', validationError);
      // Continue with local prices if validation fails
    }

    const collectionCharge = validationResult?.collectionCharge || 0;
    const summary = cart.getSummary(collectionCharge);

    console.log('✅ Cart item updated:', {
      cartId: cart._id,
      totalItems: summary.totalItems,
      productTotal: summary.productTotal,
      collectionCharge: summary.collectionCharge,
      totalAmount: summary.totalAmount,
      validationApplied: validationResult?.validationApplied || false,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false
    });

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId,
      thyrocareValidation: validationResult?.validationApplied || false,
      thyrocareMessage: validationResult?.message,
      collectionCharge: summary.collectionCharge,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false,
      breakdown: validationResult?.breakdown || {
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        grandTotal: summary.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/items/:productCode', optionalAuth, async (req, res) => {
  try {
    const { productCode } = req.params;
    const { productType } = req.body;
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('🗑️ Removing item from cart:', {
      productCode,
      productType,
      userId: userId || 'guest'
    });

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: 'Product type is required'
      });
    }

    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.removeItem(productCode, productType);
    await refreshCartPrices(cart);
    await cart.save();

    // Validate cart with Thyrocare API after removal (if items remain)
    let validationResult = null;
    if (cart.items.length > 0) {
      try {
        validationResult = await thyrocareCartService.validateAndAdjustCart(cart.items);

        if (validationResult.success && validationResult.validationApplied) {
          // Update cart with Thyrocare-validated prices
          cart.items = validationResult.adjustedItems;
          await cart.save();

          console.log('✅ Cart validated with Thyrocare after removal:', {
            validationApplied: true,
            hasCollectionCharge: validationResult.hasCollectionCharge,
            collectionCharge: validationResult.collectionCharge
          });
        }
      } catch (validationError) {
        console.error('❌ Thyrocare validation error after removal:', validationError);
        // Continue with local prices if validation fails
      }
    }

    const collectionCharge = validationResult?.collectionCharge || 0;
    const summary = cart.getSummary(collectionCharge);

    console.log('✅ Item removed from cart:', {
      cartId: cart._id,
      totalItems: summary.totalItems,
      productTotal: summary.productTotal,
      collectionCharge: summary.collectionCharge,
      totalAmount: summary.totalAmount,
      validationApplied: validationResult?.validationApplied || false,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false
    });

    res.json({
      success: true,
      message: 'Item removed from cart successfully',
      cart: summary,
      guestSessionId: cart.guestSessionId,
      thyrocareValidation: validationResult?.validationApplied || false,
      thyrocareMessage: validationResult?.message,
      collectionCharge: summary.collectionCharge,
      hasCollectionCharge: validationResult?.hasCollectionCharge || false,
      breakdown: validationResult?.breakdown || {
        productTotal: summary.productTotal,
        collectionCharge: summary.collectionCharge,
        grandTotal: summary.totalAmount
      }
    });

  } catch (error) {
    console.error('❌ Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
});

// Clear entire cart
router.delete('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?._id;
    const guestSessionId = req.headers['x-guest-session-id'] || req.cookies?.guestSessionId;

    console.log('🧹 Clearing cart:', {
      userId: userId || 'guest'
    });

    const cart = await Cart.findByUserOrGuest(userId, guestSessionId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    await cart.clearCart();

    console.log('✅ Cart cleared:', {
      cartId: cart._id
    });

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart: {
        totalItems: 0,
        subtotal: 0,
        totalDiscount: 0,
        totalAmount: 0,
        items: []
      },
      guestSessionId: cart.guestSessionId
    });

  } catch (error) {
    console.error('❌ Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
});

// Merge guest cart with user cart (when user logs in)
router.post('/merge', requiredAuth, async (req, res) => {
  try {
    const { guestSessionId } = req.body;
    const userId = req.user._id;

    console.log('🔄 Merging carts:', {
      userId,
      guestSessionId
    });

    if (!guestSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Guest session ID is required'
      });
    }

    // Find guest cart
    const guestCart = await Cart.findOne({ guestSessionId, isActive: true });

    if (!guestCart) {
      return res.status(404).json({
        success: false,
        message: 'Guest cart not found'
      });
    }

    // Find or create user cart
    let userCart = await Cart.findOne({ userId, isActive: true });

    if (!userCart) {
      userCart = new Cart({
        userId,
        items: guestCart.items
      });
    } else {
      // Merge items from guest cart to user cart
      for (const guestItem of guestCart.items) {
        await userCart.addItem(guestItem);
      }
    }

    await userCart.save();
    await refreshCartPrices(cart); // ← new
    await cart.save();
    // Deactivate guest cart
    guestCart.isActive = false;
    await guestCart.save();

    const summary = userCart.getSummary();

    console.log('✅ Carts merged successfully:', {
      userId,
      totalItems: summary.totalItems,
      totalAmount: summary.totalAmount
    });

    res.json({
      success: true,
      message: 'Cart merged successfully',
      cart: summary
    });

  } catch (error) {
    console.error('❌ Error merging carts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to merge carts',
      error: error.message
    });
  }
});

export { optionalAuth, requiredAuth };
export default router;
