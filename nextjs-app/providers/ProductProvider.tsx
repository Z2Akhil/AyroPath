'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, ProductContextType } from '@/types';
import { getProductsFromBackend } from '@/lib/api/productApi';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const CACHE_KEY = 'ayropath_products';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const INITIAL_LIMIT = 20;

interface ProductCache {
    timestamp: number;
    offers: Product[];
    packages: Product[];
    tests: Product[];
}

const loadFromCache = (): ProductCache | null => {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed: ProductCache = JSON.parse(raw);
        if (Date.now() - parsed.timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

const saveToCache = (data: Omit<ProductCache, 'timestamp'>) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch {
        // storage might be full – silently ignore
    }
};

export const clearProductCache = () => {
    if (typeof window !== 'undefined') localStorage.removeItem(CACHE_KEY);
};

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
            // --- Try cache first ---
            const cached = loadFromCache();
            if (cached) {
                const allUnique = deduplicateProducts([
                    ...cached.offers,
                    ...cached.packages,
                    ...cached.tests,
                ]);
                setOffers(cached.offers);
                setPackages(cached.packages);
                setTests(cached.tests);
                setAllProducts(allUnique);
                setHasMoreProducts(false);
                setLoading(false);
                return;
            }

            // --- No cache: fetch initial batch ---
            try {
                setLoading(true);

                const [offersResult, profilesResult, testsResult] = await Promise.all([
                    getProductsFromBackend('OFFER', { limit: INITIAL_LIMIT }),
                    getProductsFromBackend('PROFILE', { limit: INITIAL_LIMIT }),
                    getProductsFromBackend('TESTS', { limit: INITIAL_LIMIT }),
                ]);

                const initialOffers = offersResult.products || [];
                const initialPackages = profilesResult.products || [];
                const initialTests = testsResult.products || [];

                setOffers(initialOffers);
                setPackages(initialPackages);
                setTests(initialTests);
                setAllProducts(deduplicateProducts([...initialOffers, ...initialPackages, ...initialTests]));

                const hasMore = offersResult.hasMore || profilesResult.hasMore || testsResult.hasMore;
                setHasMoreProducts(hasMore);
                setLoading(false);

                // --- Background: fetch the rest and cache ---
                if (hasMore && !backgroundFetchDone.current) {
                    backgroundFetchDone.current = true;
                    setLoadingMore(true);

                    await new Promise(resolve => setTimeout(resolve, 100));

                    const [allOffersResult, allProfilesResult, allTestsResult] = await Promise.all([
                        getProductsFromBackend('OFFER'),
                        getProductsFromBackend('PROFILE'),
                        getProductsFromBackend('TESTS'),
                    ]);

                    const allOfferProducts = allOffersResult.products || [];
                    const allPackageProducts = allProfilesResult.products || [];
                    const allTestProducts = allTestsResult.products || [];

                    setOffers(allOfferProducts);
                    setPackages(allPackageProducts);
                    setTests(allTestProducts);
                    setAllProducts(deduplicateProducts([...allOfferProducts, ...allPackageProducts, ...allTestProducts]));
                    setHasMoreProducts(false);
                    setLoadingMore(false);

                    // Persist full list to cache
                    saveToCache({ offers: allOfferProducts, packages: allPackageProducts, tests: allTestProducts });
                } else if (!hasMore) {
                    // Initial fetch already got everything — cache it
                    saveToCache({ offers: initialOffers, packages: initialPackages, tests: initialTests });
                }

            } catch (err) {
                console.error('Error in ProductContext:', err);
                setError('Failed to load products');
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
            clearProductCache();
            window.location.reload();
        },
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};

