'use client';

import React from 'react';

export default function PlaceholderPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="bg-white p-12 rounded-3xl shadow-xl max-w-md border border-gray-100">
                <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">🚧</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">Under Development</h1>
                <p className="text-gray-500 font-medium leading-relaxed">
                    This section of the admin panel is currently being migrated.
                    Please check back soon!
                </p>
                <div className="mt-8 pt-8 border-t border-gray-50 flex gap-4 justify-center">
                    <div className="h-2 w-2 rounded-full bg-indigo-200 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                </div>
            </div>
        </div>
    );
}
