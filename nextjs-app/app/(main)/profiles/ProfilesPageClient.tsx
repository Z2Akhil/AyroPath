'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import ProfileCard from '@/components/cards/ProfileCard';
import SkeletonProfileCard from '@/components/skeletons/SkeletonProfileCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

type SortKey = 'default' | 'name_asc' | 'price_asc' | 'price_desc' | 'tests_desc';

interface ProfilesPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

export default function ProfilesPageClient({
    initialData,
    initialTotal,
    limit,
    showHeader = true,
    mobileScroll = false,
}: ProfilesPageClientProps) {
    const [packages, setPackages]             = useState<Product[]>(initialData);
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState<string | null>(null);
    const [currentPage, setCurrentPage]       = useState(1);
    const [itemsPerPage, setItemsPerPage]     = useState(12);
    const [totalItems, setTotalItems]         = useState(initialTotal);
    const [search, setSearch]                 = useState('');
    const [sort, setSort]                     = useState<SortKey>('default');
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchResults, setSearchResults]   = useState<Product[] | null>(null);
    const [searchLoading, setSearchLoading]   = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isWidget    = !!limit;
    const isSearching = search.trim() !== '';

    // Debounced server-side search
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!search.trim()) { setSearchResults(null); return; }
        setSearchLoading(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await getProductsFromBackend('PROFILE', { search: search.trim() });
                setSearchResults(res.products);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [search]);

    const categories = useMemo(() => {
        const cats = new Set<string>();
        packages.forEach((p) => { if (p.category) cats.add(p.category as string); });
        return ['All', ...Array.from(cats).sort()];
    }, [packages]);

    const displayed = useMemo(() => {
        let out = isSearching ? (searchResults ?? []) : [...packages];
        if (!isSearching && activeCategory !== 'All') out = out.filter((p) => (p.category as string) === activeCategory);
        if (sort === 'name_asc')   out.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        if (sort === 'price_asc')  out.sort((a, b) => getProductDisplayPrice(a).displayPrice - getProductDisplayPrice(b).displayPrice);
        if (sort === 'price_desc') out.sort((a, b) => getProductDisplayPrice(b).displayPrice - getProductDisplayPrice(a).displayPrice);
        if (sort === 'tests_desc') out.sort((a, b) => (b.testCount || 0) - (a.testCount || 0));
        return out;
    }, [packages, searchResults, isSearching, sort, activeCategory]);

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('PROFILE', { limit: itemsPerPage, skip });
            setPackages(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setSearch('');
            setActiveCategory('All');
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch {
            setError('Failed to load packages. Please try again.');
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
            setSearch('');
            setActiveCategory('All');
            setError(null);
        } catch {
            setError('Failed to load packages. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => { setSearch(''); setSearchResults(null); setActiveCategory('All'); };
    const isFiltering  = isSearching || activeCategory !== 'All';
    const totalPages   = Math.ceil(totalItems / itemsPerPage);
    const showSkeleton = loading || (isSearching && searchLoading);

    /* ── Widget / home page embed ─────────────────────────────── */
    if (isWidget) {
        return (
            <div className="px-4">
                <div className={
                    mobileScroll
                        ? 'flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 md:overflow-visible md:pb-0'
                        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'
                }>
                    {packages.map((pkg) => (
                        <div key={pkg.code} className={mobileScroll ? 'shrink-0 w-64 md:w-auto' : undefined}>
                            <ProfileCard pkg={pkg} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Full page ────────────────────────────────────────────── */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

            {/* Header */}
            {showHeader && (
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
                        Full Body Checkup &amp; Thyrocare Health Packages Online
                    </h1>
                    <div className="space-y-3 text-sm sm:text-base text-gray-600 max-w-4xl leading-relaxed mb-4">
                        <p>
                            A regular health checkup is one of the simplest ways to catch problems early, yet most of us keep postponing it. Ayropath brings preventive health testing directly to your doorstep. You do not need to take time off work or travel to a clinic. Our certified phlebotomists visit your home or office, collect samples using single use sterile kits and transport them under controlled conditions to NABL accredited Thyrocare laboratories.
                        </p>
                        <p>
                            Packages start at ₹499, and each listing shows the number of tests, the price and whether fasting is needed, so you can compare options without guesswork.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {totalItems.toLocaleString()} packages available
                    </div>

                    {/* Section: How to Choose the Right Health Package? */}
                    <div className="bg-gradient-to-br from-blue-50/70 via-gray-50 to-indigo-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100/70 mb-8">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                            How to Choose the Right Health Package?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-blue-100/60 shadow-xs">
                                <h3 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                    Under 30 and generally healthy
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    A basic screening covering complete blood count, fasting blood sugar, lipid profile, liver function and kidney function is usually enough. It gives you a reliable baseline without unnecessary tests.
                                </p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-blue-100/60 shadow-xs">
                                <h3 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                    30 to 45 years
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Look for packages that add thyroid function (TSH), vitamin D and vitamin B12. Sedentary work, stress and irregular diets often show up first in these numbers.
                                </p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-blue-100/60 shadow-xs">
                                <h3 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                    Above 45 years
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Consider comprehensive panels that include cardiac risk markers, iron deficiency parameters, HbA1c for long term sugar monitoring, and urine analysis.
                                </p>
                            </div>
                            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-blue-100/60 shadow-xs">
                                <h3 className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                                    Specific concerns
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    If you have a family history of diabetes, heart trouble or thyroid conditions, choose a profile that checks those areas in depth.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Search + Sort */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-3">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search packages (e.g. Aarogyam, thyroid, diabetes…)"
                        className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-52"
                >
                    <option value="default">Most Popular</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="tests_desc">Most Tests First</option>
                </select>
            </div>

            {/* Category pills — horizontal scroll on mobile */}
            {categories.length > 2 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-4">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                                activeCategory === cat
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Filter result count */}
            {isFiltering && !showSkeleton && (
                <p className="text-sm text-gray-500 mb-4">
                    {isSearching && searchLoading
                        ? 'Searching…'
                        : displayed.length === 0
                        ? 'No packages match your filters'
                        : `${displayed.length} package${displayed.length !== 1 ? 's' : ''} found`}
                    <button onClick={clearFilters} className="ml-2 text-blue-500 hover:underline">
                        Clear filters
                    </button>
                </p>
            )}

            {error && (
                <div className="mb-4 py-3 px-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {showSkeleton
                    ? Array.from({ length: itemsPerPage }).map((_, i) => <SkeletonProfileCard key={i} />)
                    : displayed.length > 0
                    ? displayed.map((pkg) => <ProfileCard key={pkg.code} pkg={pkg} />)
                    : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">
                                {isFiltering ? 'No packages match your filters' : 'No packages available'}
                            </p>
                            {isFiltering && (
                                <button onClick={clearFilters} className="mt-2 text-sm text-blue-500 hover:underline">
                                    Clear filters
                                </button>
                            )}
                        </div>
                    )}
            </div>

            {/* Pagination — hidden while filtering */}
            {!isFiltering && totalItems > itemsPerPage && totalPages > 1 && (
                <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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

            {/* ── SEO Content & FAQ Section ───────────────────────────── */}
            {showHeader && (
                <div className="mt-16 space-y-10">

                    {/* Section: Routine Urine Test */}
                    <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Routine Urine Test What It Checks and Why It Matters?
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Routine urine analysis is one of the most useful diagnostic tests available. A single sample can reveal signs of urinary tract infections, early kidney stress, diabetes and liver conditions before you feel any discomfort.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <h3 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                    What the Test Looks At?
                                </h3>
                                <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600">
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-gray-800 shrink-0">• Physical appearance:</span>
                                        <span>Colour, clarity and concentration (specific gravity) show how well your body is balancing fluid.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-gray-800 shrink-0">• Chemical parameters:</span>
                                        <span>Urine pH, protein, glucose, ketones, bilirubin and urobilinogen. Protein in urine can indicate kidney stress; glucose can point to diabetes.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="font-semibold text-gray-800 shrink-0">• Microscopic exam:</span>
                                        <span>Red blood cells, white blood cells, epithelial cells, bacteria, crystals and casts. Elevated white blood cells often point to a UTI, while crystals can signal a tendency toward kidney stones.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                        Price and Preparation
                                    </h3>
                                    <div className="space-y-2.5 mb-4">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/60">
                                            <span className="font-semibold text-sm text-gray-900">Routine Urine Analysis (14 tests)</span>
                                            <span className="font-bold text-blue-700 text-sm">₹180</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/50 border border-blue-100/60">
                                            <span className="font-semibold text-sm text-gray-900">Complete Urine Analysis (24 tests)</span>
                                            <span className="font-bold text-blue-700 text-sm">₹449</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    Collection is simple: collect a midstream urine sample in the sterile container provided during the home visit. Fasting is not required unless your package includes blood tests that need it.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Routine Urine Analysis Report Online */}
                    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-indigo-100/70">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Routine Urine Analysis Report Online – Fast, Clear Results
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Getting your report is completely digital with Ayropath. Once your sample reaches the lab, testing is completed using automated analysers and the report is uploaded to your account within 24 to 48 hours. You also receive a WhatsApp and email notification with a download link.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">How to Read Your Report?</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Every parameter is shown alongside standard reference intervals. Numbers that fall within the normal range appear clearly marked. If a value is high or low, it is highlighted so you and your doctor can spot it right away.
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Keep a Record Over Time</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Because reports stay stored in your Ayropath account, you can access past tests whenever needed. Comparing results year on year helps you see whether lifestyle changes, diet adjustments or medications are making a difference.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Aarogyam Male & Female Panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Male Panel */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                        Aarogyam Male Health Checkup
                                    </h2>
                                    <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                        103 tests • ₹2,799
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    Men often skip routine doctor visits until something feels wrong. The Aarogyam Male Health Checkup is designed to make preventive testing simple, affordable and thorough.
                                </p>
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">Who Should Consider It?</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Recommended for men aged 25 and above, especially those dealing with high stress, long desk hours, irregular meals or a family history of heart disease, hypertension or diabetes. It gives you a complete picture in a single visit.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">Why Does a Wide Panel Help?</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Conditions like fatty liver, borderline high cholesterol and prediabetes usually develop quietly with no symptoms at all. By testing over 100 parameters at once, the Aarogyam Male package spots these patterns early, when simple diet and exercise changes can reverse them.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Free Home Collection Included</span>
                                <Link href="/profiles" className="text-xs font-bold text-blue-600 hover:underline">View Male Panels →</Link>
                            </div>
                        </div>

                        {/* Female Panel */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                        Aarogyam Female Health Checkup
                                    </h2>
                                    <span className="shrink-0 text-xs font-bold text-pink-700 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-200">
                                        104 tests • ₹2,999
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    Women balance demanding routines, and preventive health often falls to the bottom of the list. The Aarogyam Female Health Checkup covers the full spectrum of female health needs in one comprehensive panel.
                                </p>
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">Why Is It Worth Booking?</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Tests for conditions that affect women most frequently: iron deficiency anaemia, thyroid imbalance, vitamin D deficiency and vitamin B12 shortage. It also includes comprehensive liver, kidney, cardiac and lipid profiles.
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-xs sm:text-sm text-gray-900 mb-1">A Note on Special Situations</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            If you are pregnant, planning a pregnancy or going through menopause, mention this when reviewing your results with your doctor. Reference ranges for some parameters (like thyroid hormones and iron) shift during these stages.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-500 font-medium">Free Home Collection Included</span>
                                <Link href="/profiles" className="text-xs font-bold text-pink-600 hover:underline">View Female Panels →</Link>
                            </div>
                        </div>
                    </div>

                    {/* Section: Full Body Checkup Thyrocare */}
                    <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Full Body Checkup Thyrocare
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Thyrocare is one of India&apos;s most trusted diagnostic networks, operating automated central processing laboratories that hold both NABL and CAP accreditations. When you book a Thyrocare full body checkup through Ayropath, you get the exact same lab quality with the convenience of free home sample collection.
                        </p>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-bold text-base text-gray-900 mb-3">Popular Thyrocare Packages on Ayropath</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                        <div className="font-bold text-gray-900 text-sm mb-1">Advanced Full Body Checkup with Vitamins</div>
                                        <div className="text-xs font-bold text-blue-600 mb-2">92 tests – ₹1,800</div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            A balanced panel covering thyroid, liver, kidney, lipid, complete hemogram, vitamins D &amp; B12, and iron deficiency.
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                        <div className="font-bold text-gray-900 text-sm mb-1">Complete Health Check with Vitamins</div>
                                        <div className="text-xs font-bold text-blue-600 mb-2">122 tests – ₹2,099</div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            Adds toxic elements, pancreatic enzymes and advanced cardiac risk markers for deeper screening.
                                        </p>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                        <div className="font-bold text-gray-900 text-sm mb-1">Extensive Full Body Health Checkup</div>
                                        <div className="text-xs font-bold text-blue-600 mb-2">127 tests – ₹3,699</div>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            The most detailed profile available, adding hormone panels, arthritis markers and extensive metabolic screening.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-100">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1.5">Why Lab Accreditation Matters?</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    NABL (National Accreditation Board for Testing and Calibration Laboratories) and CAP (College of American Pathologists) accreditations mean the laboratory follows rigorous international standards for calibration, quality control and reporting accuracy. Your doctor can trust every result on the page.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Aarogyam Advanced Health Checkup */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Aarogyam Advanced Health Checkup
                            </h2>
                            <span className="self-start sm:self-auto text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
                                New Aarogyam Advanced with USTSH • 78 tests – ₹1,999
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            If basic health screenings leave you wondering about hidden nutrient gaps or thyroid fluctuations, the Aarogyam Advanced Health Checkup bridges the gap between essential and premium testing.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                                <h3 className="font-bold text-sm text-gray-900 mb-1.5">When to Choose Advanced Over Basic?</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    Choose this package if you feel tired often, have unexplained weight changes, or want more than just a routine blood count. The inclusion of ultrasensitive TSH (USTSH) gives a much more precise reading of thyroid function than standard screening, catching subclinical thyroid issues early.
                                </p>
                            </div>
                            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                                <h3 className="font-bold text-sm text-emerald-950 mb-1.5 flex items-center gap-1.5">
                                    <span className="text-emerald-600 font-bold">✓</span> Save Tax on Preventive Checkups (Section 80D)
                                </h3>
                                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                                    Under Section 80D of the Income Tax Act, you can claim a deduction of up to ₹5,000 per financial year for preventive health checkups for yourself, your spouse, children and dependent parents. Ayropath provides a valid tax invoice with every booking.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-3">
                            {[
                                {
                                    q: "How long does the home collection visit take?",
                                    a: "The phlebotomist usually completes the blood draw and sample collection in 10 to 15 minutes.",
                                },
                                {
                                    q: "Do I need to fast before a full body checkup?",
                                    a: "Most full body checkups require 10 to 12 hours of overnight fasting for accurate blood sugar and lipid readings. You may drink plain water.",
                                },
                                {
                                    q: "How quickly do I receive my reports?",
                                    a: "Digital reports are delivered to your registered email and Ayropath dashboard within 24 to 48 hours.",
                                },
                                {
                                    q: "Are Ayropath reports accepted by doctors and hospitals?",
                                    a: "Yes. All tests are processed at NABL and CAP accredited Thyrocare laboratories, making the reports valid across India.",
                                },
                                {
                                    q: "Can I book for multiple family members in one slot?",
                                    a: "Yes. You can add tests for family members during booking and the phlebotomist will collect all samples in the same visit.",
                                },
                                {
                                    q: "Is home sample collection really free?",
                                    a: "Yes. Free home sample collection is included with every package on Ayropath with no hidden technician or travel fees.",
                                },
                            ].map((faq, i) => (
                                <details
                                    key={i}
                                    className="group border border-gray-200 rounded-2xl bg-white overflow-hidden"
                                >
                                    <summary className="flex items-center justify-between p-4 sm:p-5 cursor-pointer list-none font-semibold text-gray-900 hover:bg-gray-50 transition-colors text-sm gap-4">
                                        <span>{faq.q}</span>
                                        <svg
                                            className="w-4 h-4 text-gray-400 shrink-0 group-open:rotate-180 transition-transform duration-300"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </summary>
                                    <div className="px-4 sm:px-5 pb-5 pt-2 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                                        {faq.a}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Book Your Health Package Today CTA */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                            Book Your Health Package Today
                        </h2>
                        <p className="text-sm text-blue-100 max-w-2xl leading-relaxed mb-6">
                            Taking care of your health does not have to be complicated. With Ayropath, you can book a full body checkup online in three simple steps:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 1</span>
                                <h3 className="font-bold text-sm mb-1">Select Your Package</h3>
                                <p className="text-xs text-blue-100">Choose from over 370+ Thyrocare packages listed above.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 2</span>
                                <h3 className="font-bold text-sm mb-1">Pick Date &amp; Slot</h3>
                                <p className="text-xs text-blue-100">Choose a convenient date, time slot and address for home collection.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 3</span>
                                <h3 className="font-bold text-sm mb-1">Sample Pickup &amp; Report</h3>
                                <p className="text-xs text-blue-100">Pay securely online or COD. Certified phlebotomist arrives with sterile kits; reports within 24–48 hours.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/20 text-xs text-blue-100">
                            <span>Questions? Call or WhatsApp our health advisors at <a href="tel:9955955296" className="underline font-bold text-white">9955955296</a></span>
                            <span className="font-medium text-white/90">NABL &amp; CAP Accredited Testing</span>
                        </div>
                    </div>

                    {/* Hidden Keywords for SEO */}
                    <div className="sr-only" aria-hidden="true">
                        full body checkup at home, normal routine urine test, routine urine analysis report online, aarogyam male health checkup, aarogyam female health checkup, full body checkup thyrocare, aarogyam advanced health checkup, aarogyam xl pro health checkup
                    </div>

                </div>
            )}
        </div>
    );
}
