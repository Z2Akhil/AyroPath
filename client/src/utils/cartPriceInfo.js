// utils/cartPriceInfo.js
export const getCartPriceInfo = (items = []) => {
  if (!items.length) {
    return {
      displayPrice: 0,
      originalPrice: 0,
      hasDiscount: false,
      discountAmount: 0,
      discountPercentage: 0,
      margin: 0
    };
  }

  let originalPrice = 0;
  let displayPrice = 0;
  let marginTotal = 0; // if you have margin info later

  items.forEach((item) => {
    const mrp = item.originalPrice || 0;
    const selling = item.sellingPrice || mrp;
    const discount = item.discount || 0;

    originalPrice += mrp;
    displayPrice += selling;
    marginTotal += discount; // or whatever logic
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
    margin: marginTotal
  };
};
