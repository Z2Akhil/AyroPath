import { createContext, useContext, useState, useEffect } from 'react';
import { getProductsFromBackend } from '../api/backendProductApi';

const ProductContext = createContext();

export const useProducts = () => {
  return useContext(ProductContext);
};

export const ProductProvider = ({ children }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [packages, setPackages] = useState([]);
  const [tests, setTests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoading(true);
        // Fetch ALL products at once
        const data = await getProductsFromBackend("ALL");
        
        if (data && data.length > 0) {
          setAllProducts(data);

          // Filter into categories based on logic similar to backend or previous usage
          // Assuming 'PROFILE' corresponds to packages, 'TESTS' to tests, etc.
          // Adjust filtering logic if your backend API returns specific types in a specific way
          // For now, I will rely on the 'type' property if it exists, or groupName/code patterns if needed.
          // Based on previous file views, getProductsFromBackend takes a type. 
          // If we fetch "ALL", we expect the backend to return everything.
          // Let's categorize them.
          
          const uniqueProducts = Array.from(
            new Map(data.map((p) => [p.code, p])).values()
          );

          // Filter logic (adjust based on your actual data structure)
          // Usually: 
          // Packages/Profiles -> type === "PROFILE" or groupName === "PROFILE"
          // Tests -> type === "TEST"
          // Offers -> type === "OFFER" (if applicable)
          
          const pkgs = uniqueProducts.filter(p => p.type === "PROFILE" || p.type === "POP"); 
          const tsts = uniqueProducts.filter(p => p.type === "TEST");
          const offrs = uniqueProducts.filter(p => p.type === "OFFER");

          // Fallback: If type isn't distinct, we might need to rely on how the pages were fetching them.
          // PackagePage fetched "PROFILE". TestPage likely fetches "TESTS".
          // If the "ALL" endpoint returns everything with a 'type' field, this works.
          
          setPackages(pkgs);
          setTests(tsts);
          setOffers(offrs);
        }
      } catch (err) {
        console.error("Error in ProductContext:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchAllProducts();
  }, []);

  const value = {
    allProducts,
    packages,
    tests,
    offers,
    loading,
    error,
    // Expose a refresh function if needed later
    refreshProducts: () => window.location.reload() // Simple reload for now if data is stale
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};
