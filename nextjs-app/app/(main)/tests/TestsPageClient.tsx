'use client';

import { useState } from 'react';
import TestCard from '@/components/cards/TestCard';
import SkeletonTestCard from '@/components/skeletons/SkeletonTestCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { Product } from '@/types';

interface TestsPageClientProps {
    initialData: Product[];
    initialTotal: number;
}

export default function TestsPageClient({ initialData, initialTotal }: TestsPageClientProps) {
    const [tests, setTests] = useState<Product[]>(initialData);
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
            const result = await getProductsFromBackend('TESTS', { limit: itemsPerPage, skip });
            setTests(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const handleItemsPerPageChange = async (newLimit: number) => {
        setLoading(true);
        try {
            const result = await getProductsFromBackend('TESTS', { limit: newLimit, skip: 0 });
            setTests(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(1);
            setItemsPerPage(newLimit);
            setError(null);
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 py-4 sm:py-10">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">
                Lab Tests &amp; Diagnostics
            </h1>
            <p className="text-gray-500 text-sm mb-6">
                Book individual lab tests online with free home sample collection. Blood tests, thyroid tests, diabetes tests and more. Powered by Thyrocare, NABL accredited labs.
            </p>

            {error && (
                <div className="text-center py-6 text-red-500 text-sm">{error}</div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {loading
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonTestCard key={i} />)
                    : tests.length > 0
                        ? tests.map((test) => <TestCard key={test.code} test={test} />)
                        : <p className="text-gray-500 col-span-full text-center">No tests available.</p>
                }
            </div>

            {totalItems > itemsPerPage && totalPages > 1 && (
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
