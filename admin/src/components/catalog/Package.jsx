import { useEffect, useState, useMemo } from "react";
import AdminTable from "../AdminTable";
import { getProducts } from "../../api/getProductApi";

const PackageCatalog = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await getProducts("PROFILE");

        // The new API returns { success: true, products: [...] }
        const products = response.products || response || [];
        
        const uniquePackages = Array.from(
          new Map(products.map((pkg) => [pkg.code, pkg])).values()
        )

        setPackages(uniquePackages || []);

      } catch (err) {
        console.error(err);
        setError("Failed to fetch packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handleEdit = (item) => {
    console.log("Edit package:", item);
    // You can implement a modal for detailed editing here
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading packages...</div>;
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {packages.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <AdminTable
            data={packages}
            onEdit={handleEdit}
          />
        </div>
      ) : (
        <p className="text-gray-500 col-span-full text-center">
          No packages available.
        </p>
      )}
    </div>

  );
};

export default PackageCatalog;
