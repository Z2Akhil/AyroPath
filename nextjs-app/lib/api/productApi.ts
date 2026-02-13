import { Product } from "@/types";

export interface GetProductsResponse {
    products: Product[];
    totalCount: number;
    hasMore: boolean;
}

export const getProductsFromBackend = async (productType: string, options: { limit?: number; skip?: number } = {}): Promise<GetProductsResponse> => {
    try {
        const { limit, skip } = options;
        let url = `/api/products?type=${productType}`;

        if (limit) url += `&limit=${limit}`;
        if (skip) url += `&skip=${skip}`;

        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            return {
                products: data.products || [],
                totalCount: data.totalCount || 0,
                hasMore: data.hasMore || false
            };
        } else {
            console.warn("⚠️ Unexpected API response:", data);
            return { products: [], totalCount: 0, hasMore: false };
        }
    } catch (error) {
        console.error("Error fetching products from backend:", error);
        return { products: [], totalCount: 0, hasMore: false };
    }
};

export const getProductByCode = async (code: string): Promise<Product | null> => {
    try {
        const response = await fetch(`/api/products/${code}`);
        const data = await response.json();

        if (data.success) {
            return data.product || null;
        } else {
            console.warn("⚠️ Product not found:", data);
            return null;
        }
    } catch (error) {
        console.error("Error fetching product by code:", error);
        return null;
    }
};

export const getProductDisplayPrice = (product: Product) => {
    if (!product) {
        return { displayPrice: 0, originalPrice: 0, hasDiscount: false, discountPercentage: 0, discountAmount: 0 };
    }

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