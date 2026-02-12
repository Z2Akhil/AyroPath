"use client";

import { useState, useEffect } from "react";
import TestCard from "@/components/TestCard";
import SkeletonTestCard from "@/components/SkeletonTestCard";
import Pagination from "@/components/Pagination";

interface Test {
  code: string;
  name: string;
  category?: string;
  specimenType?: string;
  units?: string;
  fasting?: string;
  bookedCount?: string;
  [key: string]: any;
}

interface TestPageProps {
  limit?: number;
}

const TestPage: React.FC<TestPageProps> = ({ limit }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/client/products?type=TESTS`);
        if (!response.ok) {
          throw new Error('Failed to fetch tests');
        }
        const data = await response.json();
        if (data.success) {
          setTests(data.products || []);
        } else {
          throw new Error(data.message || 'Failed to fetch tests');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
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

  if (error) {
    return (
      <div className="text-center py-20 text-red-500">{error}</div>
    );
  }

  const totalItems = tests.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayTests = limit ? tests.slice(0, limit) : tests.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Tests
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayTests.length > 0 ? (
          displayTests.map((test) => (
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
