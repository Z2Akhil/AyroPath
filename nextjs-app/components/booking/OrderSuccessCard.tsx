'use client';

import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface OrderSuccessCardProps {
    orderId: string;
    packageName: string;
    amount: string | number;
    onClose: () => void;
}

const OrderSuccessCard: React.FC<OrderSuccessCardProps> = ({ orderId, packageName, amount, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative animate-in zoom-in-95 fade-in duration-300 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-2xl transition-all active:scale-90"
                    onClick={onClose}
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                        <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Order Confirmed!</h2>
                    <p className="text-gray-500 font-medium mt-1">Your health journey starts here.</p>
                </div>

                {/* Details Section */}
                <div className="bg-gray-50/80 border border-gray-100 rounded-3xl p-6 mb-8 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
                        <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">#{orderId}</span>
                    </div>

                    <div className="space-y-1">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Package/Tests</span>
                        <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-relaxed">{packageName}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-900">Total Amount</span>
                        <span className="text-2xl font-black text-gray-900">₹{amount}</span>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Next Steps</h3>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold">1</div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">Our clinical experts will call you to confirm the appointment.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold">2</div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">Sample collection as per your scheduled time.</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold">3</div>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">Digital reports delivered within 24-48 hours.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <button
                    onClick={onClose}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-[0.98] shadow-lg shadow-gray-200"
                >
                    Dismiss
                </button>
            </div>
        </div>
    );
};

export default OrderSuccessCard;
