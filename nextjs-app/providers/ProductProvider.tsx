'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, ProductContextType } from '@/types';
import { getHomePageData } from '@/lib/api/productApi';

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

export const ProductProvider = ({ children }: { children: ReactNode }) => {
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [packages, setPackages] = useState<Product[]>([]);
    const [tests, setTests] = useState<Product[]>([]);
    const [offers, setOffers] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);

    const initialFetchDone = useRef(false);

    useEffect(() => {
        if (initialFetchDone.current) return;
        initialFetchDone.current = true;

        const fetchProducts = async () => {
            setLoading(true);
            try {
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
                } else {
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
            window.location.reload();
        },
    };

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
