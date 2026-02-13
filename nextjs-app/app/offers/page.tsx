"use client";

import { useState, useEffect } from "react";
import OfferCard from "@/components/cards/OfferCard";
import SkeletonOfferCard from "@/components/skeletons/SkeletonOfferCard";
import Pagination from "@/components/ui/Pagination";

interface Offer {
  code: string;
  name: string;
  type: string;
  childs?: any[];
  testCount?: number;
  [key: string]: any;
}

interface OfferPageProps {
  limit?: number;
}

const OfferPage: React.FC<OfferPageProps> = ({ limit }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/client/products?type=OFFER`);
        if (!response.ok) {
          throw new Error('Failed to fetch offers');
        }
        const data = await response.json();
        if (data.success) {
          setOffers(data.products || []);
        } else {
          throw new Error(data.message || 'Failed to fetch offers');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  if (loading) {
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

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const totalItems = offers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const displayOffers = limit ? offers.slice(0, limit) : offers.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Offers on Health Packages
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayOffers.length > 0 ? (
          displayOffers.map((offer, index) => <OfferCard key={index} pkg={offer} />)
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
