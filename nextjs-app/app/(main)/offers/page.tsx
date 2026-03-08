"use client";

import { useState, useEffect } from "react";
import OfferCard from "@/components/cards/OfferCard";
import SkeletonOfferCard from "@/components/skeletons/SkeletonOfferCard";
import Pagination from "@/components/ui/Pagination";
import { getProductsFromBackend } from "@/lib/api/productApi";
import { Product } from "@/types";
import { useProducts } from "@/providers/ProductProvider";

interface OfferPageProps {
  limit?: number;
}

const OfferPage: React.FC<OfferPageProps> = ({ limit }) => {
  const { offers: initialOffers, loading: initialLoading, error: initialError } = useProducts();
  
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    // If it's the landing page (with limit), use the context data
    if (limit) {
      setOffers(initialOffers.slice(0, limit));
      setLoading(initialLoading);
      setError(initialError);
      return;
    }

    // For the full page, fetch data based on pagination
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const skip = (currentPage - 1) * itemsPerPage;
        const result = await getProductsFromBackend('OFFER', { limit: itemsPerPage, skip });
        setOffers(result.products);
        setTotalItems(result.totalCount);
        setError(null);
      } catch (err) {
        console.error("Error fetching offers:", err);
        setError("Failed to load offers");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [currentPage, itemsPerPage, limit, initialOffers, initialLoading, initialError]);

  if (loading && offers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
          Offers on Health Packages
        </h1>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: limit || 8 }).map((_, index) => (
            <SkeletonOfferCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error && offers.length === 0) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Offers on Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {offers.length > 0 ? (
          offers.map((offer, index) => <OfferCard key={index} pkg={offer} />)
        ) : (
          <p className="text-gray-500 col-span-full text-center">
            No offers available.
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

export default OfferPage;
