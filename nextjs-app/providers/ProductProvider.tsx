'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, ProductContextType } from '@/types';
import { getProductsFromBackend } from '@/lib/api/productApi';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const deduplicateProducts = (products: Product[]): Product[] => {
    return Array.from(
        new Map(products.map((p) => [`${p.code}-${p.type}`, p])).values()
    );
};

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

const INITIAL_LIMIT = 15;

export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [packages, setPackages] = useState<Product[]>([]);
    const [tests, setTests] = useState<Product[]>([]);
    const [offers, setOffers] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);

    const backgroundFetchDone = useRef(false);
    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (initialFetchDone.current) return;
        initialFetchDone.current = true;

        const fetchProducts = async () => {
            try {
                setLoading(true);

                const [offersResult, profilesResult, testsResult] = await Promise.all([
                    getProductsFromBackend("OFFER", { limit: INITIAL_LIMIT }),
                    getProductsFromBackend("PROFILE", { limit: INITIAL_LIMIT }),
                    getProductsFromBackend("TESTS", { limit: INITIAL_LIMIT })
                ]);

                const initialOffers = offersResult.products || [];
                const initialPackages = profilesResult.products || [];
                const initialTests = testsResult.products || [];

                const uniqueProducts = deduplicateProducts([
                    ...initialOffers,
                    ...initialPackages,
                    ...initialTests
                ]);

                setOffers(initialOffers);
                setPackages(initialPackages);
                setTests(initialTests);
                setAllProducts(uniqueProducts);

                const hasMore = offersResult.hasMore || profilesResult.hasMore || testsResult.hasMore;
                setHasMoreProducts(hasMore);
                setLoading(false);

                if (hasMore && !backgroundFetchDone.current) {
                    backgroundFetchDone.current = true;
                    setLoadingMore(true);

                    await new Promise(resolve => setTimeout(resolve, 100));

                    const [allOffersResult, allProfilesResult, allTestsResult] = await Promise.all([
                        getProductsFromBackend("OFFER"),
                        getProductsFromBackend("PROFILE"),
                        getProductsFromBackend("TESTS")
                    ]);

                    const allOfferProducts = allOffersResult.products || [];
                    const allPackageProducts = allProfilesResult.products || [];
                    const allTestProducts = allTestsResult.products || [];

                    const allUniqueProducts = deduplicateProducts([
                        ...allOfferProducts,
                        ...allPackageProducts,
                        ...allTestProducts
                    ]);

                    setOffers(allOfferProducts);
                    setPackages(allPackageProducts);
                    setTests(allTestProducts);
                    setAllProducts(allUniqueProducts);
                    setHasMoreProducts(false);
                    setLoadingMore(false);
                }

            } catch (err) {
                console.error("Error in ProductContext:", err);
                setError("Failed to load products");
                setLoading(false);
                setLoadingMore(false);
            }
        };

        fetchProducts();
    }, []);

    const value: ProductContextType = {
        allProducts,
        packages,
        tests,
        offers,
        loading,
        loadingMore,
        error,
        hasMoreProducts,
        refreshProducts: () => {
            backgroundFetchDone.current = false;
            window.location.reload();
        }
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
