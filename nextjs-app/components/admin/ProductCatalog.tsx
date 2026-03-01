'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, LayoutGrid, List, Package as PackageIcon } from 'lucide-react';
import AdminTable, { AdminProduct } from './AdminTable';
import { adminProductApi } from '@/lib/api/adminProductApi';

interface ProductCatalogProps {
    type: 'OFFER' | 'TEST' | 'PROFILE' | 'ALL';
    title: string;
    icon: React.ReactNode;
}

const ProductCatalog: React.FC<ProductCatalogProps> = ({ type, title, icon }) => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = useCallback(async (isSync = false) => {
        if (isSync) setSyncing(true);
        else setLoading(true);

        setError(null);
        try {
            const apiCall = isSync ? adminProductApi.syncProducts : adminProductApi.fetchProducts;
            const response = await apiCall(type);

            if (response.success) {
                setProducts(response.products);
            } else {
                setError(response.error || 'Failed to fetch products');
            }
        } catch (err: any) {
            setError(err.error || 'An unexpected error occurred');
        } finally {
            setLoading(false);
            setSyncing(false);
        }
    }, [type]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm">
                        {icon}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage and sync products from Thyrocare</p>
                    </div>
                </div>

                <button
                    onClick={() => fetchProducts(true)}
                    disabled={syncing || loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 active:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing...' : 'Sync from Thyrocare'}
                </button>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center gap-3 text-rose-700">
                    <div className="p-2 bg-rose-100 rounded-lg">
                        <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold">Sync Error</p>
                        <p className="text-xs opacity-80">{error}</p>
                    </div>
                    <button
                        onClick={() => fetchProducts()}
                        className="ml-auto text-xs font-bold underline bg-rose-100 px-3 py-1.5 rounded-lg hover:bg-rose-200"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Main table section */}
            <div className="relative group">
                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 flex flex-col items-center justify-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <p className="text-gray-400 font-medium animate-pulse">Loading catalog...</p>
                    </div>
                ) : (
                    <AdminTable data={products} onDataUpdate={setProducts} />
                )}

                {syncing && !loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-30 flex items-center justify-center rounded-2xl transition-all">
                        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center gap-3 scale-110">
                            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                            <p className="text-sm font-bold text-gray-900">Syncing database...</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-center py-4 text-[11px] text-gray-400 font-medium uppercase tracking-widest gap-2">
                <div className="h-px bg-gray-100 w-12" />
                End of {title.toLowerCase()}
                <div className="h-px bg-gray-100 w-12" />
            </div>
        </div>
    );
};

export default ProductCatalog;
