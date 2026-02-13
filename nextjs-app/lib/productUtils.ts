// Get the display price for a product
export const getProductDisplayPrice = (product: any) => {
  if (!product) {
    return { displayPrice: 0, originalPrice: 0, hasDiscount: false, discountPercentage: 0 };
  }

  // Use sellingPrice if available and lower than ThyroCare price
  let thyrocarePrice = 0;
  if (product.type === 'OFFER') {
    thyrocarePrice = product.rate?.offerRate || 0;
  } else {
    thyrocarePrice = product.rate?.b2C || 0;
  }

  const sellingPrice = product.sellingPrice || thyrocarePrice;
  const discountAmount = thyrocarePrice - sellingPrice;
  const hasDiscount = sellingPrice < thyrocarePrice && thyrocarePrice > 0;
  const discountPercentage = hasDiscount
    ? Math.round(((thyrocarePrice - sellingPrice) / thyrocarePrice) * 100)
    : 0;

  return {
    displayPrice: sellingPrice,
    originalPrice: thyrocarePrice,
    hasDiscount,
    discountPercentage,
    discountAmount,
  };
};
