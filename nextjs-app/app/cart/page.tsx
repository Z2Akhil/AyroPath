"use client";

import { useCart } from "@/providers/CartProvider";
import { Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import BookingForm from "@/components/BookingForm";
import { getCartPriceInfo } from "@/lib/cartUtils";
import Link from "next/link";

const CartPage = () => {
    const { cart, removeFromCart } = useCart();
    const priceInfo = getCartPriceInfo(cart?.items || []);
    const pkgNames = cart?.items?.map((item) => item?.name).join(", ") || "";
    const pkgIds = cart?.items?.map((item) => item?.productCode) || [];

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-200">
                        <ShoppingCart className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Your Cart</h1>
                        <p className="text-gray-500 text-sm font-medium">Manage your items and proceed to checkout</p>
                    </div>
                </div>

                {!cart || cart.items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="text-gray-300 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">Looks like you haven't added any health packages yet.</p>
                        <Link
                            href="/profiles"
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-100"
                        >
                            Browse Packages
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* 🧾 Cart Items Section */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Items in Cart ({cart.items.length})</h3>
                                    <Link href="/profiles" className="text-blue-600 text-xs font-bold hover:underline">
                                        + Add More
                                    </Link>
                                </div>

                                <div className="divide-y divide-gray-50">
                                    {cart.items.map((item) => (
                                        <div
                                            key={`${item.productCode}-${item.productType}`}
                                            className="p-6 hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                            {item.productType}
                                                        </span>
                                                        <span className="text-xs font-medium text-gray-400">Code: {item.productCode}</span>
                                                    </div>
                                                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                        {item.name}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center justify-between sm:justify-end gap-6">
                                                    <div className="text-right">
                                                        {item.originalPrice > item.sellingPrice ? (
                                                            <div className="flex flex-col items-end">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <span className="text-gray-400 line-through text-xs font-medium">
                                                                        ₹{item.originalPrice.toFixed(0)}
                                                                    </span>
                                                                    <span className="bg-red-50 text-red-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                                                                        -{Math.round(((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100)}%
                                                                    </span>
                                                                </div>
                                                                <span className="text-xl font-black text-gray-900">
                                                                    ₹{item.sellingPrice.toFixed(0)}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xl font-black text-gray-900">
                                                                ₹{item.sellingPrice.toFixed(0)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => removeFromCart(item.productCode, item.productType)}
                                                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                        aria-label="Remove item"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-gray-900">Cart Total</p>
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                                Final price calculated based on number of persons
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-blue-700">
                                                ₹{cart.productTotal.toFixed(0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Info Banner */}
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-lg shadow-blue-100">
                                <h3 className="text-xl font-bold mb-2">Need help with booking?</h3>
                                <p className="text-blue-100 text-sm mb-0 flex items-center gap-2 font-medium">
                                    <ArrowRight size={16} />
                                    Our experts are available to assist you in choosing the right tests.
                                </p>
                            </div>
                        </div>

                        {/* 🧩 Booking Form Section */}
                        <div className="lg:col-span-1 sticky top-8">
                            <BookingForm
                                pkgName={pkgNames}
                                priceInfo={priceInfo}
                                pkgId={pkgIds.join(", ")}
                                items={cart.items}
                                hasDiscount={priceInfo.hasDiscount}
                                discountPercentage={priceInfo.discountPercentage}
                                discountAmount={priceInfo.discountAmount}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPage;
