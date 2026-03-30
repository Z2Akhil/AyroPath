'use client';

import { useState } from 'react';
import ProfileCard from '@/components/cards/ProfileCard';
import SkeletonProfileCard from '@/components/skeletons/SkeletonProfileCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { Product } from '@/types';

interface ProfilesPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
}

export default function ProfilesPageClient({ initialData, initialTotal, limit }: ProfilesPageClientProps) {
    const [packages, setPackages] = useState<Product[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12);
    const [totalItems, setTotalItems] = useState(initialTotal);

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('PROFILE', { limit: itemsPerPage, skip });
            setPackages(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('PROFILE', { limit: newLimit, skip: 0 });
            setPackages(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setError(null);
        } catch (err) {
            console.error('Error fetching packages:', err);
            setError('Failed to load packages');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                Health Checkup Packages
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Book Thyrocare health checkup profiles online with free home sample collection. NABL &amp; CAP accredited labs, reports in 24–48 hours.
            </p>

            {error && (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonProfileCard key={i} />)
                    : packages.length > 0
                        ? packages.map((pkg) => <ProfileCard key={pkg.code} pkg={pkg} />)
                        : <p className="text-gray-500 col-span-full text-center">No packages available.</p>
                }
            </div>

            {(!limit) && totalItems > itemsPerPage && totalPages > 1 && (
                <div className="mt-3 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                        totalItems={totalItems}
                    />
                </div>
            )}
        </div>
    );
}
