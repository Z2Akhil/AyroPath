"use client";

import { useState, useEffect } from "react";
import ProfileCard from '@/components/cards/ProfileCard';
import SkeletonProfileCard from "@/components/skeletons/SkeletonProfileCard";
import Pagination from "@/components/ui/Pagination";
import { getProductsFromBackend } from "@/lib/api/productApi";
import { Product } from "@/types";
import { useProducts } from "@/providers/ProductProvider";

interface ProfilePageProps {
  limit?: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ limit }) => {
  const { packages: initialPackages, loading: initialLoading, error: initialError } = useProducts();

  const [packages, setPackages] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // If it's the landing page (with limit), use the context data
    if (limit) {
      setPackages(initialPackages.slice(0, limit));
      setLoading(initialLoading);
      setError(initialError);
      return;
    }

    // For the full page, fetch data based on pagination
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const skip = (currentPage - 1) * itemsPerPage;
        const result = await getProductsFromBackend('PROFILE', { limit: itemsPerPage, skip });
        setPackages(result.products);
        setTotalItems(result.totalCount);
        setError(null);
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [currentPage, itemsPerPage, limit, initialPackages, initialLoading, initialError]);

  if (loading && packages.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Available Health Profiles
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: limit || 8 }).map((_, index) => (
            <SkeletonProfileCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error && packages.length === 0) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Health Profiles
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {packages.length > 0 ? (
          packages.map((pkg, index) => <ProfileCard key={index} pkg={pkg} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No packages available.
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

export default ProfilePage;
