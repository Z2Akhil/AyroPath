import { useEffect, useState, useMemo } from "react";
import AdminTable from "../AdminTable";
import { getProducts } from "../../api/getProductApi";

const TestCatalog = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await getProducts("TEST");

        // The new API returns { success: true, products: [...] }
        const products = response.products || response || [];
        
        const uniqueTests = Array.from(
          new Map(products.map((test) => [test.code, test])).values()
        );

        setTests(uniqueTests || []);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const handleEdit = (item) => {
    console.log("Edit test:", item);
    // You can implement a modal for detailed editing here
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">
        Loading tests...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {tests.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminTable
            data={tests}
            onEdit={handleEdit}
          />
        </div>
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No tests available.
        </p>
      )}
    </div>
  );
};

export default TestCatalog;
