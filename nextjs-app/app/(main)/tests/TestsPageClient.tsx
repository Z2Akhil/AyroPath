'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import TestCard from '@/components/cards/TestCard';
import SkeletonTestCard from '@/components/skeletons/SkeletonTestCard';
import Pagination from '@/components/ui/Pagination';
import { getProductsFromBackend } from '@/lib/api/productApi';
import { getProductDisplayPrice } from '@/lib/productUtils';
import { Product } from '@/types';

interface TestsPageClientProps {
    initialData: Product[];
    initialTotal: number;
    limit?: number;
    showHeader?: boolean;
    mobileScroll?: boolean;
}

type SortKey = 'default' | 'name_asc' | 'price_asc' | 'price_desc';

export default function TestsPageClient({
    initialData,
    initialTotal,
    limit,
    showHeader = true,
    mobileScroll = false,
}: TestsPageClientProps) {
    const [tests, setTests]               = useState<Product[]>(initialData);
    const [loading, setLoading]           = useState(false);
    const [error, setError]               = useState<string | null>(null);
    const [currentPage, setCurrentPage]   = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalItems, setTotalItems]     = useState(initialTotal);
    const [search, setSearch]             = useState('');
    const [sort, setSort]                 = useState<SortKey>('default');
    const [searchResults, setSearchResults] = useState<Product[] | null>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isWidget    = !!limit;
    const isSearching = search.trim() !== '';

    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (!search.trim()) { setSearchResults(null); return; }
        setSearchLoading(true);
        searchTimerRef.current = setTimeout(async () => {
            try {
                const res = await getProductsFromBackend('TESTS', { search: search.trim() });
                setSearchResults(res.products);
            } catch {
                setSearchResults([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [search]);

    const handlePageChange = async (page: number) => {
        if (page === currentPage) return;
        setLoading(true);
        try {
            const skip = (page - 1) * itemsPerPage;
            const result = await getProductsFromBackend('TESTS', { limit: itemsPerPage, skip });
            setTests(result.products);
            setTotalItems(result.totalCount);
            setCurrentPage(page);
            setSearch('');
            setError(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests. Please try again.');
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
            setSearch('');
            setError(null);
        } catch (err) {
            console.error('Error fetching tests:', err);
            setError('Failed to load tests. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const displayed = useMemo(() => {
        let out = isSearching ? (searchResults ?? []) : [...tests];
        if (sort === 'name_asc')   out.sort((a, b) => a.name.localeCompare(b.name));
        if (sort === 'price_asc')  out.sort((a, b) => getProductDisplayPrice(a).originalPrice - getProductDisplayPrice(b).originalPrice);
        if (sort === 'price_desc') out.sort((a, b) => getProductDisplayPrice(b).originalPrice - getProductDisplayPrice(a).originalPrice);
        return out;
    }, [tests, searchResults, isSearching, sort]);

    const totalPages   = Math.ceil(totalItems / itemsPerPage);
    const showSkeleton = loading || (isSearching && searchLoading);

    /* ── Widget / home page embed ─────────────────────────────── */
    if (isWidget) {
        return (
            <div className="px-4">
                <div className={
                    mobileScroll
                        ? 'flex gap-3 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-3 lg:grid-cols-4 md:overflow-visible md:pb-0'
                        : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'
                }>
                    {tests.map((t) => (
                        <div key={t.code} className={mobileScroll ? 'shrink-0 w-52 md:w-auto' : undefined}>
                            <TestCard test={t} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    /* ── Full page ────────────────────────────────────────────── */
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

            {/* Page header */}
            {showHeader && (
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-3">
                        Lab Tests Online – Book Individual Blood Tests with Home Sample Pickup
                    </h1>
                    <div className="space-y-3 text-sm sm:text-base text-gray-600 max-w-4xl leading-relaxed mb-4">
                        <p>
                            Sometimes you do not need a full health package. Your doctor may have asked for a single test, you may be tracking a condition, or you may simply want to check one number. Ayropath makes this easy. Our lab tests online catalogue lists more than 550 individual tests covering everything from routine blood counts to specialized hormone and vitamin assays.
                        </p>
                        <p>
                            All samples are processed at NABL and CAP accredited Thyrocare laboratories, and a certified phlebotomist visits your home for collection at no extra charge. Reports are delivered digitally in 24 to 48 hours.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-full mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Discover over {totalItems.toLocaleString()} individual lab tests available for booking
                    </div>

                    {/* How to Find the Right Test? Banner */}
                    <div className="bg-gradient-to-br from-blue-50/70 via-gray-50 to-indigo-50/40 rounded-3xl p-5 sm:p-6 border border-blue-100/70 mb-6">
                        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                            </svg>
                            How to Find the Right Test?
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                            Use the search bar below to type any test name, organ (like liver, thyroid, kidney) or parameter (like TSH, HbA1c, B12). You can sort results by price or alphabetical order to find what you need quickly.
                        </p>
                    </div>
                </div>
            )}

            {/* Search + sort */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
                <div className="relative flex-1">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 111 11a6 6 0 0116 0z" />
                    </svg>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search tests (e.g. thyroid, CBC, vitamin D…)"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
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
                    className="py-2.5 px-3 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-blue-400 cursor-pointer sm:w-44"
                >
                    <option value="default">Default order</option>
                    <option value="name_asc">Name A–Z</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* Search results label */}
            {isSearching && !searchLoading && !loading && (
                <p className="text-sm text-gray-500 mb-4">
                    {displayed.length === 0
                        ? `No results for "${search}"`
                        : `${displayed.length} result${displayed.length !== 1 ? 's' : ''} for "${search}"`}
                </p>
            )}

            {error && (
                <div className="mb-4 py-3 px-4 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                    {error}
                </div>
            )}

            {/* Card grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {showSkeleton
                    ? Array.from({ length: itemsPerPage }).map((_, i) => (
                          <SkeletonTestCard key={i} />
                      ))
                    : displayed.length > 0
                    ? displayed.map((test) => (
                          <TestCard key={test.code} test={test} />
                      ))
                    : (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            <p className="text-sm font-medium">
                                {isSearching ? `No tests found for "${search}"` : 'No tests available'}
                            </p>
                            {isSearching && (
                                <button
                                    onClick={() => { setSearch(''); setSearchResults(null); }}
                                    className="mt-2 text-sm text-blue-500 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    )}
            </div>

            {/* Pagination */}
            {!isSearching && totalItems > itemsPerPage && totalPages > 1 && (
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

                    {/* Section: Diabetes Blood Test Results */}
                    <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Understand Your Diabetes Blood Test Results
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Diabetes testing goes beyond a simple finger-prick test. Ayropath offers both routine and advanced diabetes markers to help you understand your glucose control clearly.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
                                <h3 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                                    Common Reference Ranges
                                </h3>
                                <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
                                    <li className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/50">
                                        <div className="font-bold text-gray-900 mb-0.5">Fasting Blood Sugar</div>
                                        <div>Normal is &lt;100 mg/dL. 100 to 125 mg/dL indicates prediabetes. 126 mg/dL or higher on more than one test suggests diabetes.</div>
                                    </li>
                                    <li className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/50">
                                        <div className="font-bold text-gray-900 mb-0.5">Post-Meal (PP) Blood Sugar</div>
                                        <div>Normal is &lt;140 mg/dL two hours after a meal. 140 to 199 mg/dL points to impaired glucose tolerance; 200 mg/dL or above suggests diabetes.</div>
                                    </li>
                                    <li className="p-3 rounded-xl bg-blue-50/40 border border-blue-100/50">
                                        <div className="font-bold text-gray-900 mb-0.5">HbA1c (Glycated Hemoglobin)</div>
                                        <div>Normal is below 5.7%. 5.7% to 6.4% indicates prediabetes. 6.5% or higher on two separate tests indicates diabetes.</div>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs flex flex-col justify-between">
                                <div>
                                    <h3 className="font-bold text-base text-gray-900 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                        What to Do Next?
                                    </h3>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4">
                                        If your numbers fall outside the normal range, do not panic. An elevated fasting sugar or HbA1c is a signal to consult your physician. In many cases, catching high blood sugar early allows you to reverse it through diet, exercise and weight management before medications are needed.
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-600">
                                    <span className="font-bold text-gray-900 block mb-1">Recommended Next Step:</span>
                                    Periodic testing every 3 to 6 months helps track trends and evaluate whether your lifestyle changes are keeping blood sugar under control.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Hemoglobin Blood Test Results */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Low or High Hemoglobin Blood Test Results
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            A Complete Blood Count (CBC) is the most frequently ordered blood test, and hemoglobin is its central parameter. Hemoglobin is the protein inside red blood cells that carries oxygen from your lungs to every organ in your body.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-base text-gray-900 mb-3">Typical Ranges</h3>
                                <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
                                    <li className="flex justify-between py-1.5 border-b border-gray-200/60">
                                        <span className="font-medium text-gray-800">Adult Men</span>
                                        <span className="font-bold text-gray-900">13.8 to 17.2 g/dL</span>
                                    </li>
                                    <li className="flex justify-between py-1.5 border-b border-gray-200/60">
                                        <span className="font-medium text-gray-800">Adult Women</span>
                                        <span className="font-bold text-gray-900">12.1 to 15.1 g/dL</span>
                                    </li>
                                    <li className="flex justify-between py-1.5">
                                        <span className="font-medium text-gray-800">Pregnancy</span>
                                        <span className="font-bold text-gray-900">&gt; 11.0 g/dL acceptable</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-base text-gray-900 mb-3">Why Values Change?</h3>
                                <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    <p>
                                        <strong className="text-gray-900">Low Hemoglobin (Anaemia):</strong> Most commonly caused by iron deficiency, vitamin B12 or folate deficiency, chronic blood loss, or kidney disease. Symptoms include fatigue, weakness, pale skin, cold hands and dizziness.
                                    </p>
                                    <p>
                                        <strong className="text-gray-900">High Hemoglobin:</strong> Can occur with dehydration, living at high altitudes, smoking, chronic lung disease, or conditions like polycythemia vera.
                                    </p>
                                    <p className="text-xs text-gray-500 italic pt-1">
                                        If your report shows abnormal hemoglobin, your doctor will likely review red blood cell indices (MCV, MCH, MCHC) and may recommend ferritin, iron profile or B12 testing.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Vitamin B12 Deficiency */}
                    <div className="bg-gradient-to-br from-indigo-50/60 via-white to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-indigo-100/70">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Identify Vitamin B12 Deficiency Results
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Vitamin B12 is essential for nerve function, red blood cell formation and DNA synthesis. Your body does not make B12 on its own, it must come from food (primarily animal products) or supplements.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Who Is More Likely to Be Low?</h3>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                                    B12 deficiency is widespread in India, especially among vegetarians and vegans. Other at-risk groups include people over 50, those taking metformin for diabetes, individuals using acid-reducing medications (PPIs) long term, and anyone with digestive conditions like celiac disease or Crohn&apos;s.
                                </p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
                                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-2">Understanding the Report</h3>
                                <ul className="space-y-1.5 text-xs sm:text-sm text-gray-600 mb-4">
                                    <li className="flex justify-between"><span>Normal:</span> <strong className="text-emerald-700">Above 300 pg/mL</strong></li>
                                    <li className="flex justify-between"><span>Borderline:</span> <strong className="text-amber-700">200 to 300 pg/mL (symptoms may still occur)</strong></li>
                                    <li className="flex justify-between"><span>Deficient:</span> <strong className="text-red-700">Below 200 pg/mL</strong></li>
                                </ul>
                                <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-900">
                                    Ayropath also offers the <strong>Active Vitamin B12 (Holotranscobalamin) test (₹1,205)</strong>, which measures the biologically usable fraction of B12 and detects deficiency earlier than total serum B12 testing.
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Liver Function Test Price Online */}
                    <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                            Liver Function Test Price Online
                        </h2>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Your liver performs over 500 essential functions every day, from processing nutrients and medications to filtering toxins. A Liver Function Test (LFT) checks enzyme and protein levels in your blood to evaluate how well it is working.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">Liver Function Test (LFT)</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">12 parameters – ₹790</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Complete panel including SGOT (AST), SGPT (ALT), Bilirubin (Total, Direct, Indirect), Alkaline Phosphatase, Total Protein, Albumin, Globulin and A:G ratio.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">Alanine Transaminase (ALT/SGPT)</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">Single parameter – ₹225</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    The most specific single marker for liver cell damage, frequently ordered for medication monitoring.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">Albumin &amp; Alkaline Phosphatase</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">Individual – ₹235 each</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Key markers for chronic liver conditions and bile duct health to evaluate protein synthesis.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-1.5">Single Test or Full Panel?</h3>
                                <p className="leading-relaxed">
                                    If your doctor asked to recheck a specific enzyme after starting medication, an individual test like SGPT is sufficient. If you are investigating symptoms (fatigue, dark urine, abdominal discomfort, yellowing eyes) or doing a routine check, the full 12 parameter LFT gives far more context.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-1.5">Why Prices May Vary?</h3>
                                <p className="leading-relaxed">
                                    Prices depend on whether the test is run as a single parameter or as part of a panel. Packages offer significant savings per parameter compared to booking each test individually.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Diabetes Test Price Online & Blood Sugar Test */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Diabetes Test Price Online */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                    Diabetes Test Price Online
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    Managing diabetes requires regular monitoring. Ayropath offers single tests and focused diabetes panels at competitive prices with free home pickup:
                                </p>
                                <ul className="space-y-2 mb-4 text-xs sm:text-sm">
                                    <li className="flex justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-gray-800">Fasting / Random Blood Sugar</span>
                                        <span className="font-bold text-blue-600">From ₹199</span>
                                    </li>
                                    <li className="flex justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-gray-800">HbA1c (Glycated Hemoglobin)</span>
                                        <span className="font-bold text-blue-600">₹350 to ₹450</span>
                                    </li>
                                    <li className="flex justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-gray-800">1,5-Anhydroglucitol (Intermediate control)</span>
                                        <span className="font-bold text-blue-600">₹940</span>
                                    </li>
                                    <li className="flex justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <span className="text-gray-800">Jaanch Diabetic Profile Basic (52 tests)</span>
                                        <span className="font-bold text-blue-600">₹2,199</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-gray-700">
                                <h3 className="font-bold text-gray-900 mb-1">Saving on Regular Testing</h3>
                                <p>If you test blood sugar and HbA1c quarterly, combine them with kidney function (creatinine, microalbumin) every six months to save 30% to 50% compared to individual tests.</p>
                            </div>
                        </div>

                        {/* Blood Sugar Test Online */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                    Blood Sugar Test Online
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    A blood sugar test is the fastest way to check glucose levels in your bloodstream. Ayropath offers multiple blood sugar testing options:
                                </p>
                                <div className="space-y-2 mb-4 text-xs sm:text-sm text-gray-600">
                                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 text-xs mb-0.5">Fasting Blood Sugar (FBS)</h3>
                                        <p>Requires 8 to 10 hours overnight fasting. Baseline glucose level; gold standard for diabetes and insulin resistance screening.</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 text-xs mb-0.5">Post-Prandial Blood Sugar (PPBS)</h3>
                                        <p>Taken exactly 2 hours after meal start. Evaluates insulin efficiency in response to carbohydrates.</p>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                        <h3 className="font-bold text-gray-900 text-xs mb-0.5">Random Blood Sugar (RBS)</h3>
                                        <p>Taken at any time without fasting; useful for rapid checks or when fasting is impractical.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-600">
                                <h3 className="font-bold text-gray-900 mb-1">When to Test?</h3>
                                <p>Annual blood sugar testing is recommended for adults over 35, or earlier for individuals with elevated BMI, sedentary routines or family history.</p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Thyroid Test Online */}
                    <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Thyroid Test Online
                            </h2>
                            <span className="self-start sm:self-auto text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                42M+ affected in India • Early Screening
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed mb-6">
                            Thyroid disorders are among the most common endocrine conditions in India, affecting an estimated 42 million people. Because symptoms develop gradually, many people live with thyroid imbalances for years without realizing it.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">TSH Ultrasensitive</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">₹260</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    The primary screening test for both underactive (hypothyroid) and overactive (hyperthyroid) conditions.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">Thyroid Profile (T3, T4, USTSH)</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">₹420</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Measures all three key hormones for a complete view of thyroid metabolic regulation.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs">
                                <div className="font-bold text-sm text-gray-900 mb-1">Free Thyroid Profile (FT3, FT4, USTSH)</div>
                                <div className="text-xs font-bold text-blue-600 mb-2">₹550</div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Measures unbound, biologically active hormone levels for greater diagnostic accuracy.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-1.5">Which Thyroid Test Should You Choose?</h3>
                                <p className="leading-relaxed">
                                    If you have no prior history and want a general check, start with TSH Ultrasensitive. If you already take thyroid medication (like levothyroxine), your doctor may order either TSH alone for dosage monitoring or the full T3-T4-TSH panel to assess total hormone balance.
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-1.5">Do You Need to Fast?</h3>
                                <p className="leading-relaxed">
                                    Fasting is not strictly required for thyroid tests, but having the sample collected in the morning before breakfast is recommended because TSH levels follow a daily circadian rhythm. If you take thyroid medication, take your tablet after the blood draw unless your doctor advises otherwise.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section: Beta HCG Blood Test & Pregnancy */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Book a Beta HCG Blood Test Online */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                                        Book a Beta HCG Blood Test Online
                                    </h2>
                                    <span className="shrink-0 text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                                        Quantitative • ₹550–₹750
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    Human Chorionic Gonadotropin (hCG) is a hormone produced primarily by the placenta during pregnancy. A quantitative Beta hCG blood test measures the exact concentration of hCG in your bloodstream, offering far greater sensitivity and precision than home urine test kits.
                                </p>
                                <div className="space-y-2 mb-4">
                                    <h3 className="font-semibold text-xs sm:text-sm text-gray-900">Why Doctors Order It?</h3>
                                    <ul className="space-y-1.5 text-xs text-gray-600">
                                        <li>• <strong>Confirm early pregnancy:</strong> Detects hCG 8 to 10 days after ovulation, before a missed period.</li>
                                        <li>• <strong>Track pregnancy progression:</strong> hCG doubles roughly every 48 to 72 hours in healthy development.</li>
                                        <li>• <strong>Evaluate complications:</strong> Helps identify ectopic pregnancy, threatened miscarriage or molar pregnancy.</li>
                                        <li>• <strong>Fertility monitoring:</strong> Tracks response during IVF and assisted reproduction.</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-gray-700">
                                <h3 className="font-bold text-gray-900 mb-1">Quantitative Results Explained</h3>
                                <p>Below 5 mIU/mL is negative for pregnancy; above 25 mIU/mL confirms pregnancy. Results between 6 and 24 mIU/mL fall in the grey zone and usually require a retest in 48 hours.</p>
                            </div>
                        </div>

                        {/* Beta HCG Test for Pregnancy */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs flex flex-col justify-between">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                                    Beta HCG Test for Pregnancy
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mb-4 leading-relaxed">
                                    Home urine tests are convenient, but a Beta hCG blood test is the gold standard for confirming pregnancy. It detects much lower hormone levels and gives your doctor an exact number to work with.
                                </p>
                                <div className="space-y-3 mb-4">
                                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 mb-1">When Is the Best Time to Test?</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            For the most reliable result, schedule your blood test on or after the first day of your expected period. While blood tests can detect hCG earlier (around 9-11 days post-conception), testing too early may produce a very low value that requires a repeat test to confirm.
                                        </p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                        <h3 className="font-bold text-xs sm:text-sm text-gray-900 mb-1">What Happens After a Positive Result?</h3>
                                        <p className="text-xs text-gray-600 leading-relaxed">
                                            A positive Beta hCG test is your first official milestone. Share the result with your obstetrician, who will likely schedule a dating ultrasound between 6 and 8 weeks of pregnancy and prescribe prenatal supplements (folic acid, iron).
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                                <span className="text-gray-500 font-medium">Free Home Collection Included</span>
                                <span className="text-blue-600 font-bold">Reports in 24–48 hrs</span>
                            </div>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions About Lab Tests Online
                        </h2>
                        <div className="space-y-3">
                            {[
                                {
                                    q: "Can I book a single blood test without a full package?",
                                    a: "Yes. You can order any individual test from our catalogue of 550+ tests without having to book a full health package.",
                                },
                                {
                                    q: "Is home sample collection free for individual tests?",
                                    a: "Yes. Ayropath provides free home sample collection for individual tests and packages alike, with no extra travel charge.",
                                },
                                {
                                    q: "Do I need a doctor's prescription?",
                                    a: "Most routine tests (sugar, thyroid, CBC, vitamins, lipid) do not require a prescription. You can book them directly online.",
                                },
                                {
                                    q: "How should I prepare for a fasting blood test?",
                                    a: "Fast for 8 to 12 hours overnight. Drink only plain water. Avoid morning tea, coffee, breakfast, tobacco and strenuous exercise before sample collection.",
                                },
                                {
                                    q: "When will I receive my test report?",
                                    a: "Most routine test reports are ready within 24 hours of sample pickup. Specialized tests may take 36 to 48 hours. You will receive an SMS and WhatsApp notification with your download link.",
                                },
                                {
                                    q: "How do I know the results are accurate?",
                                    a: "All samples are processed at NABL and CAP accredited Thyrocare laboratories using automated robotic analysers with internal and external quality control checks.",
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

                    {/* Book Your Test Today CTA */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
                        <h2 className="text-xl sm:text-2xl font-bold mb-2">
                            Book Your Test Today
                        </h2>
                        <p className="text-sm text-blue-100 max-w-2xl leading-relaxed mb-6">
                            Do not put off the tests your doctor recommended or the check you have been meaning to do. Booking an individual test on Ayropath takes less than two minutes:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 1</span>
                                <h3 className="font-bold text-sm mb-1">Search &amp; Select</h3>
                                <p className="text-xs text-blue-100">Search and select your test from our catalogue of 550+ tests above.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 2</span>
                                <h3 className="font-bold text-sm mb-1">Choose Slot &amp; Address</h3>
                                <p className="text-xs text-blue-100">Choose your preferred date, morning time slot and home collection address.</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xs p-4 rounded-2xl border border-white/15">
                                <span className="text-xs font-bold text-blue-200 bg-white/15 px-2 py-0.5 rounded-full inline-block mb-2">Step 3</span>
                                <h3 className="font-bold text-sm mb-1">Pickup &amp; Fast Report</h3>
                                <p className="text-xs text-blue-100">Pay online or COD. Phlebotomist visits with sterile kits; reports delivered within 24–48 hours.</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-white/20 text-xs text-blue-100">
                            <span>Need assistance choosing a test? Contact us at <a href="tel:9955955296" className="underline font-bold text-white">9955955296</a></span>
                            <span className="font-medium text-white/90">NABL &amp; CAP Accredited Partner</span>
                        </div>
                    </div>

                    {/* Hidden Keywords for SEO */}
                    <div className="sr-only" aria-hidden="true">
                        lab tests online, diabetes blood results, hemoglobin blood results, vitamin b12 blood results, liver function test price online, diabetes test price online, blood sugar test online, thyroid test online, beta hcg blood test online, beta hcg test for pregnancy
                    </div>

                </div>
            )}
        </div>
    );
}
