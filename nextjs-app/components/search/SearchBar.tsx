'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Loader2, Plus, Minus, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/providers/CartProvider';
import { slugify } from '@/lib/utils/slugify';
import { getProductsFromBackend } from '@/lib/api/productApi';
import type { Product } from '@/types';

interface SearchResult extends Product {
  sellingPrice?: number;
  originalPrice?: number;
}

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<SearchResult[]>([]);
  const [isInCartMap, setIsInCartMap] = useState<Record<string, boolean>>({});

  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { cart, addToCart, removeFromCart } = useCart();

  // Fetch all products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await getProductsFromBackend('ALL', { limit: 1000 });
        if (response.products) {
          setProducts(response.products as SearchResult[]);
        }
      } catch (error) {
        console.error('Error fetching products for search:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Update cart status map when cart changes
  useEffect(() => {
    const map: Record<string, boolean> = {};
    cart?.items?.forEach((item) => {
      map[`${item.productCode}-${item.productType}`] = true;
    });
    setIsInCartMap(map);
  }, [cart]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setShowDropdown(value.trim().length > 1);
      setHighlightIndex(0);
    }, 250);
  }, []);

  const results = useMemo(() => {
    if (query.trim().length <= 1) return [];
    const lower = query.toLowerCase();
    return products.filter((item) =>
      item.name.toLowerCase().includes(lower)
    ).slice(0, 10); // Limit to 10 results
  }, [query, products]);

  const isInCart = useCallback((item: SearchResult) => {
    return isInCartMap[`${item.code}-${item.type}`] || false;
  }, [isInCartMap]);

  const handleAddToCart = useCallback(async (item: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addToCart(item);
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  }, [addToCart]);

  const handleRemoveFromCart = useCallback(async (item: SearchResult, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFromCart(item.code, item.type);
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  }, [removeFromCart]);

  const handleSelect = useCallback((item: SearchResult) => {
    setShowDropdown(false);
    setQuery('');
    if (item.type === 'TEST') {
      // For tests, add to cart directly
      addToCart(item);
    } else {
      // For packages/offers, navigate to detail page
      router.push(`/profiles/${slugify(item.name)}/${item.type}/${item.code}`);
    }
  }, [router, addToCart]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % results.length);
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[highlightIndex];
      if (item) {
        handleSelect(item);
      }
    }

    if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  }, [results, highlightIndex, handleSelect]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'TEST':
        return { text: 'Test', className: 'bg-green-100 text-green-700' };
      case 'OFFER':
        return { text: 'Offer', className: 'bg-orange-100 text-orange-700' };
      case 'PROFILE':
      case 'POP':
        return { text: 'Package', className: 'bg-blue-100 text-blue-700' };
      default:
        return { text: type, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto">
      {/* Search Input */}
      <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <Search className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Search tests, packages, and offers..."
          className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400 bg-transparent"
          autoComplete="off"
        />
        {loading && <Loader2 className="h-4 w-4 text-gray-400 animate-spin ml-2" />}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50 animate-fade-in"
        >
          {loading ? (
            <div className="flex items-center justify-center p-6 text-gray-600">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              <span className="text-sm">Loading products...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {results.map((item, index) => {
                const isActive = index === highlightIndex;
                const badge = getTypeBadge(item.type);
                const inCart = isInCart(item);
                const hasDiscount = item.originalPrice && item.sellingPrice && item.originalPrice > item.sellingPrice;
                const discountPercent = hasDiscount && item.originalPrice && item.sellingPrice
                  ? Math.round(((item.originalPrice - item.sellingPrice) / item.originalPrice) * 100)
                  : 0;

                return (
                  <li
                    key={`${item.code}-${item.type}`}
                    className={`px-4 py-3 cursor-pointer transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightIndex(index)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>

                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                            {badge.text}
                          </span>

                          {item.sellingPrice && (
                            <span className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.sellingPrice)}
                            </span>
                          )}

                          {hasDiscount && item.originalPrice && (
                            <>
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                              <span className="text-xs text-green-600 font-medium">
                                {discountPercent}% off
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {item.type !== 'TEST' && (
                          <button
                            className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 border border-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(item);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </button>
                        )}

                        {inCart ? (
                          <button
                            className="flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full hover:bg-red-100 transition-colors"
                            onClick={(e) => handleRemoveFromCart(item, e)}
                          >
                            <Minus className="h-3 w-3" />
                            Remove
                          </button>
                        ) : (
                          <button
                            className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                            onClick={(e) => handleAddToCart(item, e)}
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs mt-1 text-gray-400">Try a different search term</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default SearchBar;