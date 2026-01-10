import { axiosInstance } from './axiosInstance';

class CartApi {
  // Get cart from backend
  static async getCart(guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.get('/cart', { headers });
      return response.data;
    } catch (error) {
      console.error('Error fetching cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch cart');
    }
  }

  // Add item to cart (with validation)
  static async addToCart(productCode, productType, quantity = 1, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.post('/cart/items',
        { productCode, productType, quantity },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  }

  // Add item to cart with confirmation (removing duplicate tests)
  static async addToCartWithConfirmation(productCode, productType, quantity = 1, removeDuplicateTests = [], guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.post('/cart/items/with-confirmation',
        { productCode, productType, quantity, removeDuplicateTests },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error adding to cart with confirmation:', error);
      throw new Error(error.response?.data?.message || 'Failed to add item to cart');
    }
  }

  // Get product details with childs data
  static async getProductWithChilds(productCode, productType) {
    try {
      // Use the client products endpoint which returns product with childs data
      const response = await axiosInstance.get(`/client/products/${productCode}`);

      if (response.data.success && response.data.product) {
        return response.data.product;
      } else {
        throw new Error(response.data.message || 'Product not found');
      }
    } catch (error) {
      console.error('Error getting product with childs:', error);
      throw new Error(error.response?.data?.message || 'Failed to get product details');
    }
  }

  // Get cart with full product details (including childs)
  static async getCartWithDetails(guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.get('/cart', { headers });

      // Enhance cart items with childs data
      if (response.data.success && response.data.cart) {
        const enhancedItems = await Promise.all(
          response.data.cart.items.map(async (item) => {
            try {
              const productDetails = await this.getProductWithChilds(item.productCode, item.productType);
              return {
                ...item,
                childs: productDetails.childs || []
              };
            } catch (err) {
              console.error(`Error getting details for ${item.productCode}:`, err);
              return { ...item, childs: [] };
            }
          })
        );

        return {
          ...response.data,
          cart: {
            ...response.data.cart,
            items: enhancedItems
          }
        };
      }

      return response.data;
    } catch (error) {
      console.error('Error getting cart with details:', error);
      throw new Error(error.response?.data?.message || 'Failed to get cart');
    }
  }

  // Update item quantity
  static async updateQuantity(productCode, productType, quantity, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.put(`/cart/items/${productCode}`,
        { productType, quantity },
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating cart item:', error);
      throw new Error(error.response?.data?.message || 'Failed to update cart item');
    }
  }

  // Remove item from cart
  static async removeFromCart(productCode, productType, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.delete(`/cart/items/${productCode}`,
        {
          data: { productType },
          headers
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }

  // Clear entire cart
  static async clearCart(guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const response = await axiosInstance.delete('/cart', { headers });
      return response.data;
    } catch (error) {
      console.error('Error clearing cart:', error);
      throw new Error(error.response?.data?.message || 'Failed to clear cart');
    }
  }

  // Get checkout pricing with actual margin based on benCount
  // Pass items for direct booking (without cart), or leave empty to use cart items
  static async getCheckoutPricing(benCount = 1, items = null, guestSessionId = null) {
    try {
      const headers = {};
      if (guestSessionId) {
        headers['x-guest-session-id'] = guestSessionId;
      }

      const body = { benCount };
      if (items && items.length > 0) {
        body.items = items;
      }

      const response = await axiosInstance.post('/cart/get-checkout-pricing',
        body,
        { headers }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting checkout pricing:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get checkout pricing'
      };
    }
  }

}

export default CartApi;
