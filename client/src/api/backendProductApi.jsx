import { axiosInstance } from "./axiosInstance";

/**
 * Fetch products from our backend API with optional pagination
 * @param {string} productType - "ALL", "TESTS", "PROFILE", "OFFER"
 * @param {Object} options - Pagination options { limit, skip }
 * @returns {Promise<Object>} - { products, totalCount, hasMore }
 */
export const getProductsFromBackend = async (productType, options = {}) => {
  try {
    const { limit, skip } = options;
    let url = `/client/products?type=${productType}`;

    if (limit) url += `&limit=${limit}`;
    if (skip) url += `&skip=${skip}`;

    const response = await axiosInstance.get(url);

    if (response.data.success) {
      return {
        products: response.data.products || [],
        totalCount: response.data.totalCount || 0,
        hasMore: response.data.hasMore || false
      };
    } else {
      console.warn("⚠️ Unexpected API response:", response.data);
      return { products: [], totalCount: 0, hasMore: false };
    }
  } catch (error) {
    console.error("Error fetching products from backend:", error);
    return { products: [], totalCount: 0, hasMore: false };
  }
};

/**
 * Get product by code from our backend
 * @param {string} code - Product code
 * @returns {Promise<Object|null>} - Product data or null if not found
 */
export const getProductByCode = async (code) => {
  try {
    const response = await axiosInstance.get(`/client/products/${code}`);

    if (response.data.success) {
      return response.data.product || null;
    } else {
      console.warn("⚠️ Product not found:", response.data);
      return null;
    }
  } catch (error) {
    console.error("Error fetching product by code:", error);
    return null;
  }
};

/**
 * Search products by query from our backend
 * @param {string} query - Search query
 * @returns {Promise<Object[]>} - Array of matching products
 */
export const searchProducts = async (query) => {
  try {
    const response = await axiosInstance.get(`/client/products/search/${encodeURIComponent(query)}`);

    if (response.data.success) {
      return response.data.products || [];
    } else {
      console.warn("⚠️ Search failed:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Error searching products:", error);
    return [];
  }
};

/**
 * Get the display price for a product
 * @param {Object} product - Product object from backend
 * @returns {Object} - Price display information
 */
export const getProductDisplayPrice = (product) => {
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
