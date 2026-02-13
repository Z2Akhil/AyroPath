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

export const getImageUrl = (product: any) => {
  if (!product) return "/packagePic.webp";

  const imageLocation = product.imageLocation || product.imageMaster?.[0]?.imgLocations;
  if (!imageLocation) return "/packagePic.webp";

  // If it's already a full URL or a root-relative path that exists in public
  if (imageLocation.startsWith("http") || imageLocation.startsWith("/")) {
    return imageLocation;
  }

  // Otherwise prefix with backend URL
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  return `${apiBase}/${imageLocation}`;
};
