"use client";

import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
    imgSrc: string;
    name: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imgSrc, name, onClose }) => {
    if (!imgSrc) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm transition-all duration-300"
            onClick={onClose}
        >
            <div
                className="relative bg-white rounded-2xl p-2 max-w-3xl w-[95%] sm:w-full mx-4 shadow-2xl animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* close icon */}
                <button
                    onClick={onClose}
                    className="absolute -top-4 -right-4 text-white bg-blue-700 hover:bg-blue-800 rounded-full w-10 h-10 flex items-center justify-center transition-all duration-300 shadow-lg active:scale-90 z-[101]"
                    aria-label="Close"
                >
                    <X size={24} />
                </button>

                <div className="overflow-hidden rounded-xl">
                    <img
                        src={imgSrc}
                        loading="lazy"
                        alt={name}
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/packagePic.webp";
                        }}
                        referrerPolicy="no-referrer"
                        className="w-full h-auto max-h-[85vh] object-contain"
                    />

                </div>

                {name && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white px-4 py-2 rounded-lg text-sm font-semibold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {name}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImagePreviewModal;
