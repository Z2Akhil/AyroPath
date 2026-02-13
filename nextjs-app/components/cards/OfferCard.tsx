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

  const testPreview =
    childs.slice(0, 3).map((c: any) => c.name).join(", ") +
    (childs.length > 3 ? "..." : "");

  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "OFFER"}/${pkg.code}`;

  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between hover:shadow-xl transition relative">
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
      <h2 className="font-bold text-lg text-gray-900 mb-2 uppercase pr-6">
        {name}
      </h2>

      {/* Test list */}
      <p className="text-gray-700 text-sm mb-6 lowercase">
        {testPreview}{" "}
        <span className="text-blue-500 font-medium">+{testCount} Tests</span>
      </p>

      {/* Price & discount */}
      <div className="flex items-center gap-3 mb-3">
        <p className="text-xl font-bold text-gray-900">
          ₹{priceInfo.originalPrice}
        </p>

        {priceInfo.hasDiscount && (
          <span
            className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md"
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
      <div className="flex gap-2 mb-3">
        <AddToCartWithValidation
          productCode={pkg.code}
          productType={pkg.type || "OFFER"}
          productName={name}
          className="flex-1"
          showIcon={false}
        />

        <Link
          href={detailPath}
          className="bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-all duration-300 shadow-sm active:scale-95 text-sm font-bold flex-1 text-center flex items-center justify-center"
        >
          Book
        </Link>
      </div>
    </div>
  );
};

export default OfferCard;
