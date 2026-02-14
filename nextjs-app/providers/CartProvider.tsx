'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useUser } from "./UserProvider";
import CartApi from "@/lib/api/cartApi";
import { Cart, CartContextType, CartItem } from "@/types";

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

const initialCartState: Cart = {
    items: [],
    totalItems: 0,
    subtotal: 0,
    totalDiscount: 0,
    productTotal: 0,
    collectionCharge: 0,
    totalAmount: 0,
    hasCollectionCharge: false,
    thyrocareValidation: false,
    breakdown: {
        productTotal: 0,
        collectionCharge: 0,
        grandTotal: 0
    }
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();
    const [cart, setCart] = useState<Cart>(initialCartState);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCart();
    }, [user]);

    const processCartResponse = (response: any) => {
        if (response.success && response.cart) {
            const enhancedCart: Cart = {
                ...response.cart,
                hasCollectionCharge: response.hasCollectionCharge || false,
                thyrocareValidation: response.thyrocareValidation || false,
                breakdown: response.breakdown || {
                    productTotal: response.cart.productTotal || response.cart.totalAmount,
                    collectionCharge: response.collectionCharge || 0,
                    grandTotal: response.cart.totalAmount
                },
                guestSessionId: response.cart.guestSessionId
            };
            setCart(enhancedCart);
            saveCartToLocalStorage(enhancedCart);
            return enhancedCart;
        }
        return null;
    };

    const loadCart = async () => {
        setLoading(true);
        try {
            if (user) {
                const currentGuestSessionId = cart?.guestSessionId ||
                    (localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')!).guestSessionId : null);

                const response = await CartApi.getCart(currentGuestSessionId);
                processCartResponse(response);
            } else {
                loadCartFromLocalStorage();
            }
        } catch (error) {
            console.error("Error loading cart:", error);
            loadCartFromLocalStorage();
        } finally {
            setLoading(false);
        }
    };

    const loadCartFromLocalStorage = () => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem("cart");
        if (saved) {
            try {
                const localCart = JSON.parse(saved);
                const enhancedCart: Cart = {
                    ...localCart,
                    productTotal: localCart.productTotal || localCart.totalAmount || 0,
                    collectionCharge: localCart.collectionCharge || 0,
                    hasCollectionCharge: localCart.hasCollectionCharge || false,
                    thyrocareValidation: localCart.thyrocareValidation || false,
                    breakdown: localCart.breakdown || {
                        productTotal: localCart.productTotal || localCart.totalAmount || 0,
                        collectionCharge: localCart.collectionCharge || 0,
                        grandTotal: localCart.totalAmount || 0
                    }
                };
                setCart(enhancedCart);
            } catch (err) {
                console.error("Error parsing cart from localStorage:", err);
                setCart(initialCartState);
            }
        }
    };

    const saveCartToLocalStorage = (cartData: Cart) => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem("cart", JSON.stringify(cartData));
        } catch (err) {
            console.error("Error saving cart to localStorage:", err);
        }
    };

    const recalculateTotals = (cartData: Cart): Cart => {
        const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = cartData.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
        const totalDiscount = cartData.items.reduce((sum, item) => sum + ((item.originalPrice - item.sellingPrice) * item.quantity), 0);
        const productTotal = cartData.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

        const collectionCharge = cartData.collectionCharge || 0;
        const totalAmount = productTotal + collectionCharge;

        return {
            ...cartData,
            totalItems,
            subtotal,
            totalDiscount,
            productTotal,
            collectionCharge,
            totalAmount,
            breakdown: {
                productTotal,
                collectionCharge,
                grandTotal: totalAmount
            }
        };
    };

    const addToCart = async (item: any) => {
        setLoading(true);

        try {
            const updatedCart = { ...cart };
            const productType = item.type?.toUpperCase() || "TEST";

            const existingItemIndex = updatedCart.items.findIndex(
                cartItem => cartItem.productCode === item.code && cartItem.productType === productType
            );

            const originalPrice = item.originalPrice || item.rate?.b2C || 0;
            const sellingPrice = item.sellingPrice || originalPrice;
            const discount = originalPrice > sellingPrice ? (originalPrice - sellingPrice) : 0;

            if (productType === 'OFFER') {
                const existingOffer = updatedCart.items.find(i => i.productType === 'OFFER' && i.productCode !== item.code);
                if (existingOffer) {
                    const msg = 'Only one offer product can be added per order.';
                    if (typeof window !== 'undefined') window.alert(msg);
                    return { success: false, message: msg };
                }
            }

            if (existingItemIndex > -1) {
                updatedCart.items[existingItemIndex].quantity += 1;
            } else {
                updatedCart.items.push({
                    productCode: item.code,
                    productType: productType,
                    name: item.name,
                    quantity: 1,
                    originalPrice,
                    sellingPrice,
                    discount,
                });
            }

            const finalCart = recalculateTotals(updatedCart);
            setCart(finalCart);
            saveCartToLocalStorage(finalCart);

            if (user) {
                const itemToAdd = updatedCart.items.find(
                    cartItem => cartItem.productCode === item.code && cartItem.productType === productType
                );

                if (itemToAdd) {
                    const response = await CartApi.addToCart(
                        item.code,
                        productType,
                        itemToAdd.quantity
                    );
                    processCartResponse(response);
                }
            }

            setLoading(false);
            return { success: true, message: "Item added to cart" };

        } catch (error: any) {
            console.error("Error adding to cart:", error);
            setLoading(false);
            return { success: false, message: error.message || "Failed to add item to cart" };
        }
    };

    const removeFromCart = async (productCode: string, productType: string) => {
        setLoading(true);

        try {
            // If user is logged in, call backend FIRST and use its response as source of truth
            if (user) {
                try {
                    const response = await CartApi.removeFromCart(productCode, productType);
                    if (response.success) {
                        processCartResponse(response);
                        // Also clear localStorage if cart is now empty
                        if (!response.cart?.items?.length) {
                            if (typeof window !== 'undefined') localStorage.removeItem('cart');
                        }
                        setLoading(false);
                        return { success: true, message: "Item removed from cart" };
                    }
                } catch (apiError: any) {
                    console.error("Backend removal failed, falling back to local:", apiError);
                }
            }

            // Fallback: local-only removal (for guests or if backend failed)
            const updatedCart = { ...cart };
            const itemToRemove = updatedCart.items.find(
                item => item.productCode === productCode && item.productType === productType
            );

            if (!itemToRemove) {
                setLoading(false);
                return { success: false, message: "Item not found in cart" };
            }

            updatedCart.items = updatedCart.items.filter(
                item => !(item.productCode === productCode && item.productType === productType)
            );

            const finalCart = recalculateTotals(updatedCart);
            setCart(finalCart);

            if (finalCart.items.length === 0) {
                if (typeof window !== 'undefined') localStorage.removeItem('cart');
            } else {
                saveCartToLocalStorage(finalCart);
            }

            setLoading(false);
            return { success: true, message: "Item removed from cart" };
        } catch (error: any) {
            console.error("Error removing from cart:", error);
            setLoading(false);
            return { success: false, message: error.message || "Failed to remove item from cart" };
        }
    };


    const updateQuantity = async (productCode: string, productType: string, quantity: number) => {
        setLoading(true);

        try {
            const updatedCart = { ...cart };
            const item = updatedCart.items.find(
                item => item.productCode === productCode && item.productType === productType
            );

            if (item && quantity > 0 && quantity <= 10) {
                item.quantity = quantity;
                const finalCart = recalculateTotals(updatedCart);
                setCart(finalCart);
                saveCartToLocalStorage(finalCart);

                if (user) {
                    const response = await CartApi.updateQuantity(
                        productCode,
                        item.productType,
                        quantity
                    );
                    processCartResponse(response);
                }
            }

            setLoading(false);
            return { success: true, message: "Quantity updated" };
        } catch (error: any) {
            console.error("Error updating quantity:", error);
            setLoading(false);
            return { success: false, message: error.message || "Failed to update quantity" };
        }
    };

    const clearCart = async () => {
        setLoading(true);

        try {
            setCart(initialCartState);
            if (typeof window !== 'undefined') localStorage.removeItem('cart');

            if (user) {
                await CartApi.clearCart();
            }

            setLoading(false);
            return { success: true, message: "Cart cleared" };
        } catch (error: any) {
            console.error("Error clearing cart:", error);
            setLoading(false);
            return { success: false, message: error.message || "Failed to clear cart" };
        }
    };

    const refreshCart = async () => {
        await loadCart();
    };

    const value: CartContextType = {
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};
