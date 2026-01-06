import { useState } from 'react';
import CartApi from '../api/cartApi';
import { useToast } from '../context/ToastContext';

export const useCartValidation = () => {
  const [validationDialog, setValidationDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: null,
    onCancel: null,
    data: null
  });

  const { success, error: showError } = useToast();

  // Show validation dialog
  const showValidationDialog = (config) => {
    setValidationDialog({
      isOpen: true,
      ...config
    });
  };

  // Close validation dialog
  const closeValidationDialog = () => {
    setValidationDialog(prev => ({ ...prev, isOpen: false }));
  };

  // Check for duplicate tests
  const checkForDuplicateTests = (cartItems, newProduct) => {
    console.log('Checking duplicates:', { cartItems, newProduct });
    
    // Case 1: Adding a TEST, check if it's included in any Profile/Offer in cart
    if (newProduct.type === 'TEST') {
      for (const cartItem of cartItems) {
        if (cartItem.productType === 'PROFILE' || cartItem.productType === 'OFFER') {
          // Check if this test is included in the Profile/Offer
          // childs may have 'id' or 'code' property
          const isIncluded = cartItem.childs?.some(child => 
            child.code === newProduct.code || child.id === newProduct.code
          );
          console.log(`Checking if test ${newProduct.code} is in ${cartItem.productType} ${cartItem.productCode}:`, isIncluded);
          
          if (isIncluded) {
            return {
              hasDuplicates: true,
              action: 'prevent',
              message: `Test "${newProduct.name}" is already included in ${cartItem.productType} "${cartItem.name}". Cannot add duplicate test.`,
              details: {
                testCode: newProduct.code,
                testName: newProduct.name,
                includedIn: cartItem.productCode,
                includedInName: cartItem.name,
                includedInType: cartItem.productType
              }
            };
          }
        }
      }
    }
    
    // Case 2: Adding a PROFILE or OFFER, check if it includes any Tests in cart
    if (newProduct.type === 'PROFILE' || newProduct.type === 'OFFER') {
      const duplicateTests = [];
      
      for (const cartItem of cartItems) {
        if (cartItem.productType === 'TEST') {
          // Check if this test is included in the new Profile/Offer
          // childs may have 'id' or 'code' property
          const isIncluded = newProduct.childs?.some(child => 
            child.code === cartItem.productCode || child.id === cartItem.productCode
          );
          console.log(`Checking if ${newProduct.type} ${newProduct.code} includes test ${cartItem.productCode}:`, isIncluded);
          
          if (isIncluded) {
            duplicateTests.push({
              testCode: cartItem.productCode,
              testName: cartItem.name,
              profileOfferCode: newProduct.code,
              profileOfferName: newProduct.name,
              profileOfferType: newProduct.type
            });
          }
        }
      }
      
      if (duplicateTests.length > 0) {
        const testNames = duplicateTests.map(t => `"${t.testName}"`).join(', ');
        return {
          hasDuplicates: true,
          action: 'remove',
          message: `${newProduct.type} "${newProduct.name}" includes ${duplicateTests.length} test(s) already in your cart: ${testNames}.`,
          details: {
            duplicateTests: duplicateTests,
            profileOfferCode: newProduct.code,
            profileOfferName: newProduct.name,
            profileOfferType: newProduct.type
          }
        };
      }
    }
    
    // No duplicates found
    return {
      hasDuplicates: false,
      action: 'allow',
      message: 'No duplicate tests found'
    };
  };

  // Add item to cart with validation
  const addToCartWithValidation = async (productCode, productType, productName, quantity = 1, guestSessionId = null) => {
    try {
      console.log('Starting validation for:', { productCode, productType, productName });
      
      // 1. Get current cart with childs data
      const cartResponse = await CartApi.getCartWithDetails(guestSessionId);
      console.log('Cart response:', cartResponse);
      
      if (!cartResponse.success) {
        showError('Failed to load cart');
        return { success: false, error: 'Failed to load cart' };
      }
      
      // 2. Get new product details with childs
      const productResponse = await CartApi.getProductWithChilds(productCode, productType);
      console.log('Product response:', productResponse);
      
      const newProduct = {
        code: productCode,
        type: productType,
        name: productName,
        childs: productResponse.childs || []
      };
      
      // 3. Check for duplicates
      const cartItems = cartResponse.cart?.items || [];
      const validationResult = checkForDuplicateTests(cartItems, newProduct);
      console.log('Validation result:', validationResult);
      
      // 4. Handle validation results
      if (validationResult.hasDuplicates) {
        if (validationResult.action === 'prevent') {
          // Scenario 1: Test already included in Profile/Offer - show warning dialog
          showValidationDialog({
            title: 'Test Already Included',
            message: validationResult.message,
            type: 'warning',
            confirmText: 'OK',
            cancelText: 'Cancel',
            onConfirm: () => {
              closeValidationDialog();
              return { success: false, prevented: true };
            },
            onCancel: () => {
              closeValidationDialog();
              return { success: false, cancelled: true };
            },
            data: validationResult.details
          });
          return { success: false, requiresConfirmation: true, validation: validationResult };
        } 
        else if (validationResult.action === 'remove') {
          // Scenario 2: Profile/Offer includes tests in cart - ask for confirmation
          const duplicateTests = validationResult.details.duplicateTests || [];
          const testCodes = duplicateTests.map(t => t.testCode);
          
          showValidationDialog({
            title: 'Remove Duplicate Tests',
            message: validationResult.message + ` Remove duplicate test(s) and add ${validationResult.details.profileOfferType}?`,
            type: 'info',
            confirmText: `Remove tests & add ${validationResult.details.profileOfferType}`,
            cancelText: 'Cancel',
            onConfirm: async () => {
              try {
                // Remove duplicate tests and add the profile/offer
                const confirmResponse = await CartApi.addToCartWithConfirmation(
                  productCode,
                  productType,
                  quantity,
                  testCodes,
                  guestSessionId
                );
                
                if (confirmResponse.success) {
                  success(`${validationResult.details.profileOfferType} added to cart${testCodes.length > 0 ? ` (${testCodes.length} duplicate test(s) removed)` : ''}`);
                  closeValidationDialog();
                  return { success: true, cart: confirmResponse.cart, removedTests: testCodes };
                } else {
                  showError('Failed to add item to cart');
                  closeValidationDialog();
                  return { success: false, error: 'Failed to add item to cart' };
                }
              } catch (err) {
                console.error('Error adding to cart with confirmation:', err);
                showError('Failed to add item to cart');
                closeValidationDialog();
                return { success: false, error: err.message };
              }
            },
            onCancel: () => {
              closeValidationDialog();
              return { success: false, cancelled: true };
            },
            data: validationResult.details
          });
          return { success: false, requiresConfirmation: true, validation: validationResult };
        }
      }
      
      // 5. No duplicates - add item directly
      console.log('No duplicates found, adding item directly');
      const addResponse = await CartApi.addToCart(productCode, productType, quantity, guestSessionId);
      
      if (addResponse.success) {
        if (addResponse.alreadyInCart) {
          // Item was already in cart - show info message
          success('Item is already in your cart');
          return { success: true, cart: addResponse.cart, alreadyInCart: true };
        } else {
          // New item added successfully
          success('Item added to cart successfully');
          return { success: true, cart: addResponse.cart };
        }
      } else {
        showError(addResponse.message || 'Failed to add item to cart');
        return { success: false, error: addResponse.message };
      }
      
    } catch (error) {
      console.error('Error in addToCartWithValidation:', error);
      showError(error.message || 'Failed to add item to cart');
      return { success: false, error: error.message };
    }
  };

  return {
    validationDialog,
    closeValidationDialog,
    addToCartWithValidation,
    showValidationDialog
  };
};
