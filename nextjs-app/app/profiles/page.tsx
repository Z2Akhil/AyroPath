"use client";

import { useState, useEffect } from "react";
import ProfileCard from '@/components/cards/ProfileCard';
import SkeletonProfileCard from "@/components/skeletons/SkeletonProfileCard";
import Pagination from "@/components/ui/Pagination";

interface Package {
  code: string;
  name: string;
  type: string;
  testCount?: number;
  bookedCount?: number;
  category?: string;
  specimenType?: string;
  fasting?: string;
  imageLocation?: string;
  imageMaster?: any[];
  [key: string]: any;
}

interface ProfilePageProps {
  limit?: number;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ limit }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/client/products?type=PROFILE`);
        if (!response.ok) {
          throw new Error('Failed to fetch packages');
        }
        const data = await response.json();
        if (data.success) {
          setPackages(data.products || []);
        } else {
          throw new Error(data.message || 'Failed to fetch packages');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
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

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  const totalItems = packages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedPackages = limit ? packages.slice(0, limit) : packages.slice(startIndex, endIndex);

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        Available Health Profiles
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {displayedPackages.length > 0 ? (
          displayedPackages.map((pkg, index) => <ProfileCard key={index} pkg={pkg} />)
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
