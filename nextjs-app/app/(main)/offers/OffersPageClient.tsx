'use client';

import { useState } from 'react';
import OfferCard from '@/components/cards/OfferCard';
import SkeletonOfferCard from '@/components/skeletons/SkeletonOfferCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { Product } from '@/types';

interface OffersPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
}

export default function OffersPageClient({ initialData, initialTotal, limit }: OffersPageClientProps) {
    const [offers, setOffers] = useState<Product[]>(initialData);
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
            const result = await getProductsFromBackend('OFFER', { limit: itemsPerPage, skip });
            setOffers(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching offers:', err);
            setError('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('OFFER', { limit: newLimit, skip: 0 });
            setOffers(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setError(null);
        } catch (err) {
            console.error('Error fetching offers:', err);
            setError('Failed to load offers');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                Offers on Health Packages
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Exclusive discounts on Thyrocare health packages. Book online with free home sample collection. Save up to 60% on diagnostic tests.
            </p>

            {error && (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonOfferCard key={i} />)
                    : offers.length > 0
                        ? offers.map((offer) => <OfferCard key={offer.code} pkg={offer} />)
                        : <p className="text-gray-500 col-span-full text-center">No offers available.</p>
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
