import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getProductsFromBackend } from '../api/backendProductApi';

const ProductContext = createContext();

// Helper to remove duplicate products (outside component to avoid recreation)
const deduplicateProducts = (products) => {
  return Array.from(
    new Map(products.map((p) => [`${p.code}-${p.type}`, p])).values()
  );
};

export const useProducts = () => {
  return useContext(ProductContext);
};

// Initial items to fetch per type for fast first load
const INITIAL_LIMIT = 15;

export const ProductProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [tests, setTests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  // Track if we've done the background fetch
  const backgroundFetchDone = useRef(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        // PHASE 1: Fetch first batch of each type in parallel (fast)
        const [offersResult, profilesResult, testsResult] = await Promise.all([
          getProductsFromBackend("OFFER", { limit: INITIAL_LIMIT }),
          getProductsFromBackend("PROFILE", { limit: INITIAL_LIMIT }),
          getProductsFromBackend("TESTS", { limit: INITIAL_LIMIT })
        ]);

        const initialOffers = offersResult.products || [];
        const initialPackages = profilesResult.products || [];
        const initialTests = testsResult.products || [];

        // Deduplicate
        const uniqueProducts = deduplicateProducts([
          ...initialOffers,
          ...initialPackages,
          ...initialTests
        ]);

        setOffers(initialOffers);
        setPackages(initialPackages);
        setTests(initialTests);
        setAllProducts(uniqueProducts);

        // Check if there's more to load
        const hasMore = offersResult.hasMore || profilesResult.hasMore || testsResult.hasMore;
        setHasMoreProducts(hasMore);

        // Stop loading - user sees content now!
        setLoading(false);

        // PHASE 2: Fetch remaining products in background (if any)
        if (hasMore && !backgroundFetchDone.current) {
          backgroundFetchDone.current = true;
          setLoadingMore(true);

          // Small delay to let UI settle
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

          // Merge without flickering - only add new items
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

  const value = {
    allProducts,
    packages,
    tests,
    offers,
    loading,
    loadingMore,
    error,
    hasMoreProducts,
    // Expose a refresh function if needed later
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
