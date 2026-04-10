'use client';

import { useState, useMemo, useEffect } from "react";
import { AlertCircle, Home, Share2, ChevronDown, CheckCircle, ShieldCheck, Clock, Microscope } from "lucide-react";
import BookingForm from "@/components/booking/BookingForm";
import { getProductDisplayPrice } from "@/lib/productUtils";
import Link from "next/link";
import { Product } from "@/types";

interface PackageDetailClientProps {
    product: Product;
}

const PackageDetailClient = ({ product: pkg }: PackageDetailClientProps) => {
    const [openCategory, setOpenCategory] = useState<Set<string>>(new Set());
    const [shareLabel, setShareLabel] = useState('Share');

    const formItems = useMemo(() => {
        return [{ productCode: pkg.code, productType: pkg.type, name: pkg.name }];
    }, [pkg]);

    const { displayPrice, originalPrice, hasDiscount, discountPercentage } = getProductDisplayPrice(pkg);

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
            {/* Breadcrumbs */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <nav className="flex items-center space-x-2 text-sm text-gray-600">
                    <Link href="/" className="hover:text-blue-600 transition-colors flex items-center">
                        Home
                    </Link>
                    <ChevronDown size={14} className="rotate-270 text-gray-400" />
                    <Link href="/profiles" className="hover:text-blue-600 transition-colors">
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
                                        <button
                                            onClick={async () => {
                                                const url = window.location.href;
                                                const title = pkg.name;
                                                if (navigator.share) {
                                                    try {
                                                        await navigator.share({ title, url });
                                                    } catch (_) { }
                                                } else {
                                                    await navigator.clipboard.writeText(url);
                                                    setShareLabel('Copied!');
                                                    setTimeout(() => setShareLabel('Share'), 2000);
                                                }
                                            }}
                                            className="flex items-center gap-1.5 py-1 px-3 bg-emerald-50 text-emerald-700 rounded-full font-semibold hover:bg-emerald-100 transition-colors"
                                        >
                                            <Share2 size={16} /> {shareLabel}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Price Section */}
                            <div className="bg-linear-to-r from-blue-50 to-white rounded-2xl p-6 mb-8 border border-blue-50">
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
                                <h2 className="text-2xl font-black text-gray-900">What&apos;s Included in {pkg.name}? ({pkg.testCount || pkg.childs?.length || 0} Parameters Covered)</h2>
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
                    </div>

                    {/* Sidebar - Booking Form */}
                    <div className="lg:col-span-1 lg:row-span-2">
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

                    {/* Lab Quality Promise + Package Stats */}
                    <div className="lg:col-span-2 mt-8 lg:mt-0 py-10 border-t border-gray-100 space-y-8">

                        {/* Key Stats Bar */}
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                            <div className="text-center p-3 sm:p-5 bg-blue-50 rounded-xl sm:rounded-2xl">
                                <p className="text-xl sm:text-3xl font-black text-blue-700">{pkg.testCount || pkg.childs?.length || 0}+</p>
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 uppercase tracking-tight sm:tracking-wider leading-tight">Parameters</p>
                            </div>
                            <div className="text-center p-3 sm:p-5 bg-emerald-50 rounded-xl sm:rounded-2xl">
                                <p className="text-lg sm:text-2xl font-black text-emerald-700">24-48h</p>
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 uppercase tracking-tight sm:tracking-wider leading-tight">Report</p>
                            </div>
                            <div className="text-center p-3 sm:p-5 bg-violet-50 rounded-xl sm:rounded-2xl">
                                <p className="text-lg sm:text-2xl font-black text-violet-700">Free</p>
                                <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 uppercase tracking-tight sm:tracking-wider leading-tight">Collection</p>
                            </div>
                        </div>

                        {/* NABL / CAP Accreditation Panel */}
                        <div className="bg-linear-to-br from-blue-950 to-blue-800 rounded-3xl p-8 text-white">
                            <div className="flex items-start gap-4 mb-6">
                                <ShieldCheck className="w-9 h-9 text-blue-300 shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-base font-black mb-1 leading-snug">
                                        NABL &amp; CAP Accredited Thyrocare Laboratories
                                    </h3>
                                    <p className="text-blue-200 text-sm leading-relaxed">
                                        Your {pkg.name} sample is processed at Thyrocare&apos;s state-of-the-art diagnostic facilities —
                                        certified to the highest national and international quality standards,
                                        trusted by 2,000+ hospitals across India.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { icon: ShieldCheck, label: "NABL Certified", sub: "National Accreditation" },
                                    { icon: Microscope,  label: "CAP Accredited", sub: "Global Lab Standards" },
                                    { icon: CheckCircle, label: "2,000+ Hospitals", sub: "Partner Network" },
                                    { icon: Clock,       label: "Digitally Signed", sub: "Tamper-Proof Reports" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
                                        <item.icon className="w-4 h-4 text-blue-300 shrink-0" />
                                        <div>
                                            <p className="text-xs font-bold text-white leading-none">{item.label}</p>
                                            <p className="text-[10px] text-blue-300 mt-0.5">{item.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Booking Steps — compact horizontal */}
                        <div>
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">How It Works</h3>
                            <div className="flex flex-col sm:flex-row gap-4">
                                {[
                                    { n: "01", title: "Book Online",      desc: "Pick a slot in under 2 minutes." },
                                    { n: "02", title: "Home Collection",  desc: "Certified phlebotomist visits you." },
                                    { n: "03", title: "Digital Report",   desc: `${pkg.name} results in 24–48 hrs.` },
                                ].map((step, i) => (
                                    <div key={i} className="flex-1 flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <span className="text-2xl font-black text-blue-100 leading-none shrink-0">{step.n}</span>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{step.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetailClient;
