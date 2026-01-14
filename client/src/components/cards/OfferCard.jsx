import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProductDisplayPrice } from "../../api/backendProductApi";
import { slugify } from "../../utils/slugify";
import { FiChevronRight } from "react-icons/fi"; // npm i react-icons
import AddToCartWithValidation from "../AddToCartWithValidation";
import { useCart } from "../../context/CartContext";

const OfferCard = ({ pkg }) => {
  const { name, childs = [], testCount = 0 } = pkg;
  const priceInfo = getProductDisplayPrice(pkg);
  const navigate = useNavigate();
  const { cart } = useCart();

  const isInCart = cart?.items?.some(item => item.productCode === pkg?.code);

  const testPreview =
    childs.slice(0, 3).map((c) => c.name).join(", ") +
    (childs.length > 3 ? "..." : "");

  const detailPath = `/packages/${slugify(name)}/${pkg.type || "OFFER"}/${pkg.code
    }`;

  return (
    <div className="bg-white shadow-lg rounded-xl p-5 max-w-sm w-full flex flex-col justify-between hover:shadow-xl transition relative">

      {/* ---------- 1.  Chevron top-right ---------- */}
      <Link
        to={detailPath}
        state={{ from: "offer" }}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
        aria-label="View details"
      >
        <FiChevronRight size={20} />
      </Link>

      {/* ---------- 2.  Header  ---------- */}
      <h2
        onClick={() => navigate(detailPath)}
        className="font-bold text-lg text-gray-900 mb-2 uppercase cursor-pointer pr-6"
      >
        {name}
      </h2>

      {/* ---------- 3.  Test list  ---------- */}
      <p className="text-gray-700 text-sm mb-6 lowercase">
        {testPreview}{" "}
        <span className="text-blue-500 font-medium">+{testCount} Tests</span>
      </p>

      {/* ---------- 4.  Price & discount (same row)  ---------- */}
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

      {/* ---------- 5.  Buttons row  ---------- */}
      <div className="flex gap-2 mb-3">
        {isInCart ? (
          <Link
            to="/cart"
            className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-2 rounded-md hover:bg-emerald-200 transition-colors text-sm font-medium flex-1 text-center flex items-center justify-center"
          >
            Go to Cart
          </Link>
        ) : (
          <AddToCartWithValidation
            productCode={pkg.code}
            productType={pkg.type || "OFFER"}
            productName={pkg.name}
            quantity={1}
            buttonText="Add to Cart"
            showIcon={false}
            className="!bg-gray-200 !text-black hover:!bg-gray-300 border-none shadow-none flex-1 !rounded-md"
          />
        )}

        <Link
          to={detailPath}
          state={{ from: "offer" }}
          className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition-colors text-sm font-medium flex-1 text-center flex items-center justify-center"
        >
          Book
        </Link>
      </div>
    </div>
  );
};

export default OfferCard;
