'use client';

import { useEffect, useState, useMemo, use } from "react";
import { AlertCircle, Home, Percent, Share2, ChevronDown, Calendar, CreditCard, CheckCircle, MapPin, Clock } from "lucide-react";
import BookingForm from "@/components/booking/BookingForm";
import { getProductDisplayPrice } from "@/lib/api/productApi";
import SkeletonPackageDetailed from "@/components/skeletons/SkeletonPackageDetailed";
import { useProducts } from "@/providers/ProductProvider";
import SEO from "@/components/ui/SEO";
import { slugify } from "@/lib/slugify";
import { useCart } from "@/providers/CartProvider";
import Link from "next/link";
import { Product } from "@/types";

interface PageProps {
    params: Promise<{
        slug: string;
        type: string;
        code: string;
    }>;
}

const PackageDetailPage = ({ params }: PageProps) => {
    const { slug, type, code } = use(params);
    const { allProducts, loading: productsLoading, error: productsError } = useProducts();
    const [pkg, setPkg] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openCategory, setOpenCategory] = useState<Set<string>>(new Set());
    const { cart } = useCart();

    const formItems = useMemo(() => {
        if (!pkg) return [];
        return [{ productCode: pkg.code, productType: pkg.type, name: pkg.name }];
    }, [pkg]);

    useEffect(() => {
        const findAndSetProduct = async () => {
            if (allProducts.length > 0) {
                let found = allProducts.find(
                    (p) => p.code === code && (p.type?.toUpperCase() === type.toUpperCase())
                );
                if (!found) found = allProducts.find((p) => p.code === code);
                if (found) {
                    setPkg(found);
                    setLoading(false);
                    setError(null);
                    return;
                }
            }

            try {
                setLoading(true);
                const { getProductByCode } = await import("@/lib/api/productApi");
                const fetchedPkg = await getProductByCode(code);
                if (fetchedPkg) {
                    setPkg(fetchedPkg);
                    setError(null);
                } else {
                    setError("Package not found");
                }
            } catch (err) {
                setError("Error loading package details");
            } finally {
                setLoading(false);
            }
        };
        findAndSetProduct();
    }, [allProducts, code, type]);

    const groupedTests = useMemo(() => {
        if (!pkg?.childs) return {};
        return pkg.childs.reduce((acc, test) => {
            const group = test.groupName || "General Parameters";
            if (!acc[group]) acc[group] = [];
            acc[group].push(test.name);
            return acc;
        }, {} as Record<string, string[]>);
    }, [pkg]);

    useEffect(() => {
        if (Object.keys(groupedTests).length > 0) {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
                setOpenCategory(new Set(Object.keys(groupedTests)));
            }
        }
    }, [groupedTests]);

    if (loading && !pkg) return <SkeletonPackageDetailed />;
    if (error || productsError) return <div className="text-center py-20 text-red-600 font-bold">{error || productsError}</div>;
    if (!pkg) return <div className="text-center py-20 text-gray-600 font-bold">Package not found</div>;

    const { displayPrice, originalPrice, hasDiscount, discountPercentage } = getProductDisplayPrice(pkg);

    const toggleCategory = (cat: string) => {
        setOpenCategory(prev => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    return (
        <div className="min-h-screen bg-white pb-20">
            <SEO
                title={`${pkg.name} - Book Online | Ayropath`}
                description={`Book ${pkg.name} online with Ayropath. Total ${pkg.testCount || pkg.childs?.length || 0} tests included. Powered by Thyrocare. Fast results, affordable pricing starting at ₹${displayPrice}.`}
            />

            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <nav className="flex items-center space-x-2 text-sm text-gray-600">
                    <Link href="/" className="hover:text-blue-600 transition-colors flex items-center">
                        Home
                    </Link>
                    <ChevronDown size={14} className="rotate-270 text-gray-400" />
                    <Link href="/packages" className="hover:text-blue-600 transition-colors">
                        Packages
                    </Link>
                    <ChevronDown size={14} className="rotate-270 text-gray-400" />
                    <span className="text-gray-900 font-medium truncate">{pkg.name}</span>
                </nav>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-1">
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                                <div className="space-y-4">
                                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                                        {pkg.name}
                                    </h1>
                                    <div className="flex flex-wrap items-center gap-4 text-gray-600 text-sm">
                                        <span className="flex items-center gap-1.5 py-1 px-3 bg-green-50 text-green-700 rounded-full font-semibold">
                                            <CheckCircle size={16} /> {pkg.testCount || pkg.childs?.length || 0} Tests Included
                                        </span>
                                        {pkg.fasting && (
                                            <span className="flex items-center gap-1.5 py-1 px-3 bg-orange-50 text-orange-700 rounded-full font-semibold">
                                                <AlertCircle size={16} /> {pkg.fasting === "CF" ? "Fasting Required" : "No Fasting"}
                                            </span>
                                        )}
                                        <button className="flex items-center gap-1.5 py-1 px-3 bg-emerald-50 text-emerald-700 rounded-full font-semibold hover:bg-emerald-100 transition-colors">
                                            <Share2 size={16} /> Share
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl p-6 mb-8 border border-blue-50">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-4xl font-black text-blue-700">₹{displayPrice}</span>
                                    {hasDiscount && (
                                        <div className="flex flex-col">
                                            <span className="text-gray-400 line-through text-lg font-medium">₹{originalPrice}</span>
                                            <span className="text-green-600 text-sm font-bold">Save {discountPercentage}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Important Instructions */}
                            {pkg.fasting && (
                                <div className="border-l-4 border-blue-600 bg-blue-50/50 rounded-r-2xl p-6 mb-8">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="text-blue-600 w-6 h-6 shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 mb-1">Important Instructions</h3>
                                            <p className="text-gray-700 leading-relaxed text-sm">
                                                {pkg.fasting === "CF"
                                                    ? "For accurate results, please do not consume anything other than water for 8-10 hours before the test. You may drink water as needed."
                                                    : "No special preparation required. You can take this test at any time of the day."}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Included Tests List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-gray-900">Included Tests ({pkg.testCount || pkg.childs?.length || 0})</h2>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">All Grouped By Category</span>
                                </div>
                                <div className="space-y-4">
                                    {(Object.entries(groupedTests) as [string, string[]][]).map(([category, tests], idx) => (
                                        <div key={idx} className="border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                                            <button
                                                onClick={() => toggleCategory(category)}
                                                className="w-full flex items-center justify-between p-5 bg-white hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-gray-900 text-lg">{category}</span>
                                                    <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">{tests.length} tests</span>
                                                </div>
                                                <ChevronDown
                                                    size={20}
                                                    className={`text-gray-400 transition-transform duration-500 ${openCategory.has(category) ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                            {openCategory.has(category) && (
                                                <div className="p-6 bg-white border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in zoom-in-95 duration-300">
                                                    {tests.map((testName: string, tIdx: number) => (
                                                        <div key={tIdx} className="flex items-center text-sm font-medium text-gray-600 bg-gray-50/50 px-4 py-3 rounded-2xl border border-gray-100/50">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 shadow-sm shadow-blue-200" />
                                                            {testName}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Informational Sections */}
                        <div className="mt-16 space-y-16 py-12 border-t border-gray-100">
                            {/* Why Book With Us */}
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">WHY BOOK WITH AYROPATH?</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
                                    {[
                                        { icon: MapPin, text: "100% Safe & Hygienic" },
                                        { icon: Home, text: "Free Home Collection" },
                                        { icon: Percent, text: "Heavy Discounts" },
                                        { icon: Calendar, text: "Reports Online" },
                                        { icon: CreditCard, text: "Secure Payments" },
                                    ].map((item, i) => (
                                        <div key={i} className="flex flex-col items-center group">
                                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors duration-300">
                                                <item.icon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-700 uppercase leading-tight">{item.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="text-center">
                                <h2 className="text-2xl font-black text-gray-900 mb-10 tracking-tight">HOW IT WORKS</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { title: "1. Book Test", icon: CheckCircle, desc: "Choose your test and preferred slot online easily." },
                                        { title: "2. Collection", icon: Home, desc: "Our expert phlebotomist collects sample from home." },
                                        { title: "3. Reports", icon: Calendar, desc: "Access reports online within 24–48 hours." },
                                    ].map((step, i) => (
                                        <div key={i} className="bg-gray-50 rounded-3xl p-8 hover:shadow-lg transition-all border border-gray-100">
                                            <step.icon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                            <h4 className="font-black text-gray-900 mb-2 uppercase">{step.title}</h4>
                                            <p className="text-gray-500 text-sm font-medium">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar - Booking Form */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <BookingForm
                                pkgName={pkg.name}
                                priceInfo={{
                                    displayPrice,
                                    originalPrice,
                                    discountPercentage,
                                    discountAmount: originalPrice - displayPrice,
                                    hasDiscount
                                }}
                                pkgId={pkg.code}
                                items={formItems}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetailPage;
