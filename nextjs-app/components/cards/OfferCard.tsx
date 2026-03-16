"use client";

import React from "react";
import Link from "next/link";
import { getProductDisplayPrice } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import AddToCartWithValidation from "./AddToCartWithValidation";

interface OfferCardProps {
  pkg: any;
}

const OfferCard: React.FC<OfferCardProps> = ({ pkg }) => {
  const { name, childs = [], testCount = 0 } = pkg;
  const priceInfo = getProductDisplayPrice(pkg);

  const testPreview = childs.slice(0, 3).map((c: any) => c.name).join(", ");

  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "OFFER"}/${pkg.code}`;

  return (
    <div className="relative flex h-full w-full max-w-sm flex-col rounded-xl border border-gray-100 bg-white p-5 shadow-lg transition hover:shadow-xl">
      {/* Chevron top-right */}
      <Link
        href={detailPath}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        aria-label="View details"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>

      {/* Header */}
      <h2 className="mb-2 pr-6 text-lg font-bold text-gray-900 uppercase">
        <Link href={detailPath} className="hover:text-blue-600 transition-colors">
          {name}
        </Link>
      </h2>

      {/* Test list */}
      <p className="mb-6 text-sm text-gray-700 lowercase">
        {testPreview}{" "}
        <span className="text-blue-500 font-medium">+{testCount} Tests</span>
      </p>

      <div className="mt-auto">
        {/* Price & discount */}
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <p className="text-xl font-bold text-gray-900">
            ₹{priceInfo.originalPrice}
          </p>

          {priceInfo.hasDiscount && (
            <span
              className="rounded-md bg-red-500 px-2 py-1 text-xs font-bold text-white"
              style={{
                clipPath:
                  "polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%)",
              }}
            >
              Up to {priceInfo.discountPercentage}% OFF
            </span>
          )}
        </div>

        {/* Buttons row */}
        <div className="mb-3 grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-2">
          <AddToCartWithValidation
            productCode={pkg.code}
            productType={pkg.type || "OFFER"}
            productName={name}
            className="min-w-0"
            showIcon={false}
          />

          <Link
            href={detailPath}
            className="flex min-w-0 items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-center text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all duration-300 hover:bg-blue-800 active:scale-95"
          >
            Book
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OfferCard;
