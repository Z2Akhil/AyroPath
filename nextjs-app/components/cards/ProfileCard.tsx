"use client";

import Link from "next/link";
import { getProductDisplayPrice, getImageUrl } from "@/lib/productUtils";
import { slugify } from "@/lib/slugify";
import { useState } from "react";
import AddToCartWithValidation from "./AddToCartWithValidation";

interface ProfileCardProps {
  pkg: any;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ pkg }) => {
  const {
    name = "Health Package",
    testCount = 0,
    bookedCount = 0,
    category,
    specimenType,
    fasting,
  } = pkg;

  const imgSrc = getImageUrl(pkg);
  const priceInfo = getProductDisplayPrice(pkg);

  const detailPath = `/profiles/${slugify(name)}/${pkg.type || "PROFILE"}/${pkg.code}`;

  return (
    <div className="w-full sm:max-w-sm bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      {/* IMAGE BLOCK */}
      <div className="relative h-48 sm:h-52 shrink-0">
        <img
          src={imgSrc}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/packagePic.webp";
          }}
          className="w-full h-full object-cover"
        />

        {/* Chevron – detail link */}
        <Link
          href={detailPath}
          className="absolute top-2 right-2 bg-black/40 text-white p-1.5 rounded-full hover:bg-black/60 transition z-10"
          aria-label="View details"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Category badge */}
        {category && (
          <span className="absolute top-2 right-12 bg-gray-700 text-white text-xs sm:text-sm px-2 py-1 rounded shadow-md">
            {category}
          </span>
        )}

        {/* Bottom title strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-3 py-2 text-sm sm:text-base font-semibold">
          {name}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-3 sm:p-4 flex flex-col grow">
        <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2 line-clamp-1">
          {name}
        </h2>

        <div className="flex items-center justify-between bg-gray-100 rounded-full py-2 px-3 sm:px-4 mb-3 text-xs sm:text-sm">
          <span className="font-medium text-gray-700">{testCount} Tests</span>
          <span className="text-gray-500">
            Booked: <strong>{bookedCount}</strong>
          </span>
        </div>

        <div className="flex justify-between text-xs sm:text-sm text-gray-600 mb-3">
          <p>
            Specimen: <span className="font-medium">{specimenType || "N/A"}</span>
          </p>
          <p>
            Fasting: <span className="font-medium">{fasting || "N/A"}</span>
          </p>
        </div>

        <div className="min-h-[50px] flex flex-col justify-center mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-blue-700 font-bold text-xl sm:text-2xl">
              ₹{priceInfo.originalPrice}
            </p>
            {priceInfo.hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                Up to {priceInfo.discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <AddToCartWithValidation
            productCode={pkg.code}
            productType={pkg.type || "PROFILE"}
            productName={name}
            className="flex-1"
          />
          <Link
            href={detailPath}
            className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium flex-1 text-center flex items-center justify-center"
          >
            Book Now
          </Link>
        </div>

        <div className="border-t border-gray-300 pt-3 mt-auto">
          <ul className="list-disc pl-5 space-y-1 text-xs text-gray-600">
            <li>NABL, CAP, ISO 9001 Certified</li>
            <li>Free Home Sample Pickup</li>
            <li>Online Report Delivery</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
