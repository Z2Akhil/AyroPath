import { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./userContext";
import CartApi from "../api/cartApi";

const CartContext = createContext();
CartApi.getCart().then(res => console.log(JSON.stringify(res, null, 2)));

export const CartProvider = ({ children }) => {
  const { user } = useUser();
  const [cart, setCart] = useState({
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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
  }, [user]);

  const processCartResponse = (response) => {
    if (response.success && response.cart) {
      const enhancedCart = {
        ...response.cart,
        hasCollectionCharge: response.hasCollectionCharge || false,
        thyrocareValidation: response.thyrocareValidation || false,
        breakdown: response.breakdown || {
          productTotal: response.cart.productTotal || response.cart.totalAmount,
          collectionCharge: response.collectionCharge || 0,
          grandTotal: response.cart.totalAmount
        }
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
        // Pass guestSessionId to backend to allow merging
        // Try getting it from state first, then localStorage
        const currentGuestSessionId = cart?.guestSessionId ||
          (localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')).guestSessionId : null);

        console.log("Loading cart for user, passing guestSessionId:", currentGuestSessionId);

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
    const saved = localStorage.getItem("cart");
    if (saved) {
      try {
        const localCart = JSON.parse(saved);
        // Ensure all fields exist for backward compatibility
        const enhancedCart = {
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
        setCart({
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
        });
      }
    }
  };

  // Save cart to localStorage
  const saveCartToLocalStorage = (cartData) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartData));
    } catch (err) {
      console.error("Error saving cart to localStorage:", err);
    }
  };

  // Save cart to database (if user is logged in)
  const saveCartToDatabase = async (cartData) => {
    if (!user) return { success: true }; // Skip if not logged in

    try {
      // For now, we'll sync each operation individually
      // In a real implementation, you might want to sync the entire cart
      return { success: true };
    } catch (error) {
      console.error("Error saving cart to database:", error);
      return { success: false, error: error.message };
    }
  };

  // Recalculate cart totals
  const recalculateTotals = (cartData) => {
    const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartData.items.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
    const totalDiscount = cartData.items.reduce((sum, item) => sum + ((item.originalPrice - item.sellingPrice) * item.quantity), 0);
    const productTotal = cartData.items.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);

    // For local cart, we don't have collection charge info
    // It will be added when synced with backend
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

  // Add item to cart
  const addToCart = async (item) => {
    setLoading(true);

    try {
      const updatedCart = { ...cart };
      const existingItemIndex = updatedCart.items.findIndex(
        cartItem => cartItem.productCode === item.code && cartItem.productType === (item.type?.toUpperCase() || "TEST")
      );

      // ALWAYS use price shown in UI
      const originalPrice = item.originalPrice || item.rate?.b2C || 0;
      const sellingPrice = item.sellingPrice || originalPrice;
      const discount = originalPrice > sellingPrice ? (originalPrice - sellingPrice) : 0;
      const productType = item.type?.toUpperCase() || "TEST";

      // Validation: Only one product of type 'OFFER' allowed
      if (productType === 'OFFER') {
        const existingOffer = updatedCart.items.find(i => i.productType === 'OFFER' && i.productCode !== item.code);
        if (existingOffer) {
          const msg = 'Only one offer product can be added per order.';
          window.alert(msg);
          return { success: false, message: msg };
        }
      }

      if (existingItemIndex > -1) {
        // Item already exists, increase quantity
        updatedCart.items[existingItemIndex].quantity += 1;
      } else {
        // Add new item
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

      // Sync with backend
      if (user) {
        const itemToAdd = updatedCart.items.find(
          cartItem => cartItem.productCode === item.code && cartItem.productType === productType
        );

        const response = await CartApi.addToCart(
          item.code,
          productType,
          itemToAdd.quantity
        );
        processCartResponse(response);
      }

      setLoading(false);
      return { success: true, message: "Item added to cart" };

    } catch (error) {
      console.error("Error adding to cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to add item to cart" };
    }
  };


  // Remove item from cart
  const removeFromCart = async (productCode, productType) => {
    setLoading(true);

    try {
      const updatedCart = { ...cart };
      const itemToRemove = updatedCart.items.find(
        item => item.productCode === productCode && (!productType || item.productType === productType)
      );

      if (!itemToRemove) {
        setLoading(false);
        return { success: false, message: "Item not found in cart" };
      }

      updatedCart.items = updatedCart.items.filter(
        item => !(item.productCode === productCode && item.productType === itemToRemove.productType)
      );

      // Recalculate totals
      const finalCart = recalculateTotals(updatedCart);

      // Update state and localStorage
      setCart(finalCart);
      saveCartToLocalStorage(finalCart);

      // Remove from database if user is logged in
      if (user && itemToRemove) {
        const response = await CartApi.removeFromCart(
          productCode,
          itemToRemove.productType
        );
        processCartResponse(response);
      }

      setLoading(false);
      return { success: true, message: "Item removed from cart" };
    } catch (error) {
      console.error("Error removing from cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to remove item from cart" };
    }
  };

  // Update item quantity
  const updateQuantity = async (productCode, productType, quantity) => {
    setLoading(true);

    try {
      const updatedCart = { ...cart };
      const item = updatedCart.items.find(
        item => item.productCode === productCode && (!productType || item.productType === productType)
      );

      if (item && quantity > 0 && quantity <= 10) {
        item.quantity = quantity;

        // Recalculate totals
        const finalCart = recalculateTotals(updatedCart);

        // Update state and localStorage
        setCart(finalCart);
        saveCartToLocalStorage(finalCart);

        // Update database if user is logged in
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
    } catch (error) {
      console.error("Error updating quantity:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to update quantity" };
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setLoading(true);

    try {
      const emptyCart = {
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

      // Update state and localStorage
      setCart(emptyCart);
      saveCartToLocalStorage(emptyCart);

      // Clear database if user is logged in
      if (user) {
        await CartApi.clearCart();
      }

      setLoading(false);
      return { success: true, message: "Cart cleared" };
    } catch (error) {
      console.error("Error clearing cart:", error);
      setLoading(false);
      return { success: false, message: error.message || "Failed to clear cart" };
    }
  };

  // Refresh cart from backend
  const refreshCart = async () => {
    await loadCart();
  };

  const value = {
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

export const useCart = () => useContext(CartContext);
