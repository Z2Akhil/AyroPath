import { useCart } from "../context/CartContext";
import { Trash2, ShoppingCart, LogIn } from "lucide-react";
import Form from "../components/Form";
import { getCartPriceInfo } from "../utils/cartPriceInfo";
import { Link } from "react-router-dom";
const CartPage = () => {
  const { cart, removeFromCart } = useCart();
  const priceInfo = getCartPriceInfo(cart?.items);//displayPrice,originalPrice,discountAmount,discountPercentage,margin,payable
  const pkgNames = cart?.items?.map((item) => item?.name) || [];
  const pkgIds = cart?.items?.map((item) => item?.productCode) || [];
  return (
    <div className="max-w-7xl mx-auto py-12 px-1 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart className="text-blue-600 w-7 h-7" />
        <h1 className="text-2xl font-bold text-gray-800">Items in your cart</h1>
      </div>

      {cart?.totalItems === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow-sm border">
          <p className="text-gray-500 text-lg mb-4">🛒 Your cart is empty</p>
          <p className="text-gray-400 text-sm">Add some tests to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 🧾 Cart Section */}
          <div className="lg:col-span-2 bg-white rounded-xl">
            {/* Table */}
            <div className="rounded-xl overflow-hidden border">
              {/* Desktop Header */}
              <div className="hidden sm:grid grid-cols-7 bg-blue-50 text-gray-800 font-semibold border-b border-blue-200 text-sm">
                <div className="col-span-3 py-3 px-4 border-r border-blue-200">Item</div>
                <div className="col-span-2 py-3 px-4 border-r border-blue-200">Price</div>
                <div className="col-span-2 py-3 px-4 text-center">Action</div>
              </div>

              {/* Body */}
              <div className="divide-y divide-gray-100">
                {cart?.items?.map((item) => (
                  <div
                    key={item.productCode}
                    className="grid grid-cols-1 sm:grid-cols-7 gap-3 sm:gap-0 p-4 sm:p-0 hover:bg-gray-50 transition text-sm"
                  >
                    {/* Item Name - Full width on mobile, 3 cols on desktop */}
                    <div className="sm:col-span-3 py-2 sm:py-3 px-4 text-gray-800 font-medium">
                      <div className="text-base font-semibold mb-1">{item.name}</div>
                      <div className="text-xs text-gray-500">Code: {item.productCode}</div>
                    </div>

                    {/* Price - Full width on mobile, 2 cols on desktop */}
                    <div className="sm:col-span-2 py-2 sm:py-3 px-4">
                      <div className="flex flex-col">
                        {item.discount > 0 ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 line-through text-sm">
                                ₹{item.originalPrice.toFixed(2)}
                              </span>
                              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded">
                                Save ₹{item.discount.toFixed(2)}
                              </span>
                            </div>
                            <span className="text-blue-700 font-bold text-lg">
                              ₹{item.sellingPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span className="text-blue-700 font-bold text-lg">
                            ₹{item.sellingPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action - Full width on mobile, 2 cols on desktop */}
                    <div className="sm:col-span-2 py-2 sm:py-3 px-4 text-center">
                      <button
                        onClick={() => removeFromCart(item.productCode, item.productType)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Row */}
              <div className="py-4 px-6 bg-gray-50 border-t border-gray-200">
                {/* Collection Charge Warning */}
                {cart.hasCollectionCharge && cart.collectionCharge > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <div className="shrink-0">
                        <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Collection Charge Applied
                        </h3>
                        <div className="mt-1 text-sm text-yellow-700">
                          <p>
                            Additional collection charge of ₹{cart.collectionCharge.toFixed(2)} is applicable 
                            because your order amount is less than ₹300.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Price Summary */}
                <div className="space-y-2 mb-4">
                  {/* Original Price (MRP) */}
                  {cart.subtotal > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Original Price:</span>
                      <span>₹{cart.subtotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Discount */}
                  {cart.totalDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-₹{cart.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Product Total (After Discount) */}
                  {cart.productTotal > 0 && (
                    <div className="flex justify-between text-sm font-medium text-gray-800 pt-2 border-t border-gray-200">
                      <span>Product Total:</span>
                      <span>₹{cart.productTotal.toFixed(2)}</span>
                    </div>
                  )}
                  
                  {/* Collection Charge (if applicable) */}
                  {cart.collectionCharge > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Collection Charge:</span>
                      <span className="text-yellow-700 font-medium">₹{cart.collectionCharge.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Grand Total */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0 pt-4 border-t border-gray-300">
                  <div>
                    <p className="text-lg sm:text-base font-semibold text-gray-800">
                      Total Payable Amount:
                    </p>
                    {cart.hasCollectionCharge && cart.collectionCharge > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Includes ₹{cart.collectionCharge.toFixed(2)} collection charge
                      </p>
                    )}
                    {cart.totalDiscount > 0 && (
                      <p className="text-xs text-green-600 mt-1">
                        You saved ₹{cart.totalDiscount.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-blue-700">
                    ₹{cart.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Add More Button */}
            <div className="p-4 bg-white">
              <Link
                to="/tests"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base px-5 py-2.5 rounded-md shadow-sm transition"
              >
                + Add More Tests
              </Link>
            </div>
          </div>

          {/* 🧩 Form Section */}
          <Form pkgName={pkgNames} priceInfo={priceInfo} pkgId={pkgIds} items={cart?.items} />
        </div>
      )}
    </div>
  );
};

export default CartPage;
