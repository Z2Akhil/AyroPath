import { CartItem } from "@/types";

export const getCartPriceInfo = (items: CartItem[] = []) => {
    if (!items.length) {
        return {
            displayPrice: 0,
            originalPrice: 0,
            hasDiscount: false,
            discountAmount: 0,
            discountPercentage: 0,
        };
    }

    let originalPrice = 0;
    let displayPrice = 0;

    items.forEach((item) => {
        const mrp = item.originalPrice || 0;
        const selling = item.sellingPrice || mrp;

        originalPrice += mrp * item.quantity;
        displayPrice += selling * item.quantity;
    });

    const discountAmount = originalPrice - displayPrice;
    const hasDiscount = discountAmount > 0;

    const discountPercentage =
        originalPrice > 0
            ? Math.round((discountAmount / originalPrice) * 100)
            : 0;

    return {
        displayPrice,
        originalPrice,
        hasDiscount,
        discountAmount,
        discountPercentage,
    };
};
