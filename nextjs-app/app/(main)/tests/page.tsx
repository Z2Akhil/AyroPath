"use client";

import { useState, useEffect } from "react";
import TestCard from "@/components/cards/TestCard";
import SkeletonTestCard from "@/components/skeletons/SkeletonTestCard";
import Pagination from "@/components/ui/Pagination";
import { getProductsFromBackend } from "@/lib/api/productApi";
import { Product } from "@/types";
import { useProducts } from "@/providers/ProductProvider";

interface TestPageProps {
  limit?: number;
}

const TestPage: React.FC<TestPageProps> = ({ limit }) => {
  const { tests: initialTests, loading: initialLoading, error: initialError } = useProducts();

  const [tests, setTests] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // If it's the landing page (with limit), use the context data
    if (limit) {
      setTests(initialTests.slice(0, limit));
      setLoading(initialLoading);
      setError(initialError);
      return;
    }

    // For the full page, fetch data based on pagination
    const fetchTests = async () => {
      setLoading(true);
      try {
        const skip = (currentPage - 1) * itemsPerPage;
        const result = await getProductsFromBackend('TESTS', { limit: itemsPerPage, skip });
        setTests(result.products);
        setTotalItems(result.totalCount);
        setError(null);
      } catch (err) {
        console.error("Error fetching tests:", err);
        setError("Failed to load tests");
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [currentPage, itemsPerPage, limit, initialTests, initialLoading, initialError]);

  if (loading && tests.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Tests
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: limit || 8 }).map((_, index) => (
            <SkeletonTestCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error && tests.length === 0) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Tests
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {tests.length > 0 ? (
          tests.map((test) => (
            <TestCard key={test.code} test={test} />
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No tests available.
          </p>
        )}
      </div>

      {!limit && totalItems > itemsPerPage && totalPages > 1 && (
        <div className="mt-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
          />
        </div>
      )}
    </div>
  );
};

export default TestPage;
