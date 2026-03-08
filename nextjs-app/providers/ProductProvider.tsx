'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, ProductContextType } from '@/types';
import { getProductsFromBackend, getHomePageData } from '@/lib/api/productApi';

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
            setLoading(true);
            // --- Try cache first ---
            const cached = loadFromCache();
            if (cached) {
                console.log('Loading products from cache');
                const allUnique = deduplicateProducts([
                    ...cached.offers,
                    ...cached.packages,
                    ...cached.tests,
                ]);
                setOffers(cached.offers);
                setPackages(cached.packages);
                setTests(cached.tests);
                setAllProducts(allUnique);
                setHasMoreProducts(true); 
                setLoading(false);
                return;
            }

            // --- No cache: fetch homepage data ---
            try {
                console.log('Fetching homepage data...');
                const homepageData = await getHomePageData();

                if (homepageData) {
                    setOffers(homepageData.offers);
                    setPackages(homepageData.profiles);
                    setTests(homepageData.tests);
                    setAllProducts(deduplicateProducts([
                        ...homepageData.offers,
                        ...homepageData.profiles,
                        ...homepageData.tests
                    ]));
                    
                    setHasMoreProducts(true);
                    
                    // Cache the homepage data
                    saveToCache({
                        offers: homepageData.offers,
                        packages: homepageData.profiles,
                        tests: homepageData.tests
                    });
                } else {
                    console.error('Homepage data was null');
                    setError('Failed to load homepage products');
                }
            } catch (err) {
                console.error('Error in fetchProducts:', err);
                setError('Failed to load products');
            } finally {
                setLoading(false);
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

