import { axiosInstance } from './axiosInstance';

export interface CartCheckoutPricingPayload {
    benCount: number;
    items?: any[];
}

export interface CartCheckoutPricingResponse {
    success: boolean;
    originalTotal: number;
    totalDiscount: number;
    grandTotal: number;
    collectionCharge: number;
    marginAdjusted?: boolean;
    thyrocareMargin?: number;
    error?: string;
}

class CartApi {
    static async getCart(guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.get('/cart', { headers });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching cart:', error);
            throw new Error(error.response?.data?.message || 'Failed to fetch cart');
        }
    }

    static async addToCart(productCode: string, productType: string, quantity = 1, guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.post('/cart/items',
                { productCode, productType, quantity },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            throw new Error(error.response?.data?.message || 'Failed to add item to cart');
        }
    }

    static async removeFromCart(productCode: string, productType: string, guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.delete(`/cart/items/${productCode}`, {
                data: { productType },
                headers
            });
            return response.data;
        } catch (error: any) {
            console.error('Error removing from cart:', error);
            throw new Error(error.response?.data?.message || 'Failed to remove item from cart');
        }
    }

    static async updateQuantity(productCode: string, productType: string, quantity: number, guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.patch(`/cart/items/${productCode}/${productType}`,
                { quantity },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error updating quantity:', error);
            throw new Error(error.response?.data?.message || 'Failed to update quantity');
        }
    }

    static async clearCart(guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.delete('/cart', { headers });
            return response.data;
        } catch (error: any) {
            console.error('Error clearing cart:', error);
            throw new Error(error.response?.data?.message || 'Failed to clear cart');
        }
    }

    static async getCheckoutPricing(benCount = 1, items: any[] | null = null, guestSessionId: string | null = null): Promise<CartCheckoutPricingResponse> {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const body: CartCheckoutPricingPayload = { benCount };
            if (items && items.length > 0) {
                body.items = items;
            }

            const response = await axiosInstance.post('/cart/get-checkout-pricing',
                body,
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error getting checkout pricing:', error);
            return {
                success: false,
                originalTotal: 0,
                totalDiscount: 0,
                grandTotal: 0,
                collectionCharge: 0,
                error: error.response?.data?.message || 'Failed to get checkout pricing'
            };
        }
    }

    static async addToCartWithConfirmation(productCode: string, productType: string, quantity = 1, removeDuplicateTests: string[] = [], guestSessionId: string | null = null) {
        try {
            const headers: Record<string, string> = {};
            if (guestSessionId) {
                headers['x-guest-session-id'] = guestSessionId;
            }

            const response = await axiosInstance.post('/cart/items/with-confirmation',
                { productCode, productType, quantity, removeDuplicateTests },
                { headers }
            );
            return response.data;
        } catch (error: any) {
            console.error('Error adding to cart with confirmation:', error);
            throw new Error(error.response?.data?.message || 'Failed to add item to cart');
        }
    }

    static async getProductWithChilds(productCode: string, productType: string) {
        try {
            const response = await axiosInstance.get(`/client/products/${productCode}`);
            if (response.data.success && response.data.product) {
                return response.data.product;
            } else {
                throw new Error(response.data.message || 'Product not found');
            }
        } catch (error: any) {
            console.error('Error getting product with childs:', error);
            throw new Error(error.response?.data?.message || 'Failed to get product details');
        }
    }

    static async getCartWithDetails(guestSessionId: string | null = null) {
        try {
            const response = await this.getCart(guestSessionId);
            if (response.success && response.cart) {
                const enhancedItems = await Promise.all(
                    response.cart.items.map(async (item: any) => {
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
                    ...response,
                    cart: {
                        ...response.cart,
                        items: enhancedItems
                    }
                };
            }
            return response;
        } catch (error: any) {
            console.error('Error getting cart with details:', error);
            throw new Error(error.message || 'Failed to get cart');
        }
    }
}

export default CartApi;
