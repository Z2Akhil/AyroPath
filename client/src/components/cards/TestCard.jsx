import React from "react";
import { useCart } from "../../context/CartContext";
import { getProductDisplayPrice } from "../../api/backendProductApi";
import { Link } from "react-router-dom";

const TestCard = ({ test }) => {
  const {
    name = "Unknown Test",
    code = "",
    category = "",
    specimenType = "N/A",
    units = "",
    fasting = "N/A",
    bookedCount = "0",
  } = test;

  const priceInfo = getProductDisplayPrice(test);
  const { cart, addToCart } = useCart();
  const inCart = cart?.items?.some((item) => item.productCode === code) || false;

  return (
    <div className="bg-white rounded-xl p-4 sm:p-5 w-full flex flex-col h-full border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Header: Name + Price - Now flex-row on ALL sizes for better mobile positioning (price stays top-right) */}
      <div className="flex flex-row justify-between items-start gap-3 mb-4 flex-wrap">
        {/* Name + Category - Takes available space, truncates if needed */}
        <div className="flex-1 min-w-0">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider block">
            {category || "General"}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1 line-clamp-2 wrap-break-words">
            {name}
          </h2>
        </div>

        {/* Price Section - Stays top-right, no distortion, shrinks if needed */}
        <div className="flex flex-col items-end shrink-0 text-right">
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            {priceInfo.hasDiscount && (
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 line-through whitespace-nowrap">
                ₹{priceInfo.originalPrice}
              </span>
            )}
            <span className="text-lg sm:text-xl font-bold text-blue-700 whitespace-nowrap">
              ₹{priceInfo.displayPrice}
            </span>
          </div>

          {priceInfo.hasDiscount && (
            <span className="mt-1 inline-block bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded">
              {priceInfo.discountPercentage}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Pills - Safe wrapping, no overflow */}
      <div className="flex flex-wrap gap-2 mb-4 sm:mb-5 -mx-1">
        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-[11px] sm:text-xs font-medium rounded-full border border-gray-300 whitespace-nowrap">
          {code || "—"}
        </span>

        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-medium rounded-full border border-blue-200 whitespace-nowrap">
          {specimenType}
        </span>

        {units && (
          <span className="px-3 py-1 bg-orange-50 text-orange-700 text-[11px] sm:text-xs font-medium rounded-full border border-orange-200 whitespace-nowrap">
            {units}
          </span>
        )}

        {fasting && fasting !== "N/A" && (
          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-[11px] sm:text-xs font-medium rounded-full border border-purple-200 whitespace-nowrap">
            Fasting: {fasting}
          </span>
        )}
      </div>

      {/* Action Section - Buttons right-aligned and matched */}
      <div className="mt-auto pt-4 border-t border-gray-100">
        <div className="flex flex-col items-end gap-2 sm:gap-3">
          {/* Matched Buttons - Right-aligned, consistent styling */}
          {inCart ? (
            <Link
              to="/cart"
              className="px-4 sm:px-5 py-2 bg-blue-600 text-white font-medium text-xs sm:text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
              View Cart
            </Link>
          ) : (
            <button
              onClick={() => addToCart(test)}
              className="px-4 sm:px-5 py-2 bg-green-600 text-white font-medium text-xs sm:text-sm rounded-md hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap"
            >
              Add to Cart
            </button>
          )}

          {/* Booked Count */}
          {bookedCount && parseInt(bookedCount) > 0 && (
            <p className="text-center w-full text-[10px] sm:text-xs text-gray-500 leading-tight">
              ✓ Booked by <strong>{bookedCount}</strong> patients
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestCard;