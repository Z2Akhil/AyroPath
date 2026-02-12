'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils/slugify';

interface Product {
  code: string;
  name: string;
  type: 'TEST' | 'PROFILE' | 'OFFER';
  price: number;
}

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setShowDropdown(value.trim().length > 1);
    }, 250);
  };

  const results = useMemo(() => {
    if (query.trim().length <= 1) return [];
    const lower = query.toLowerCase();
    return products.filter((item) =>
      item.name.toLowerCase().includes(lower)
    );
  }, [query, products]);

  const handleSelect = (item: Product) => {
    setShowDropdown(false);
    const type = item.type || 'PROFILE';
    router.push(`/packages/${slugify(item.name)}/${type}/${item.code}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;

    if (e.key === 'ArrowDown') {
      setHighlightIndex((prev) => (prev + 1) % results.length);
    }

    if (e.key === 'ArrowUp') {
      setHighlightIndex((prev) => (prev - 1 + results.length) % results.length);
    }

    if (e.key === 'Enter') {
      const item = results[highlightIndex];
      if (item) {
        handleSelect(item);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xl mx-auto">
      <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 shadow-none focus-within:border-blue-500 transition">
        <Search className="h-5 w-5 text-gray-400 mr-2" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="search tests, packages, and offers..."
          className="flex-1 outline-none text-sm placeholder:text-gray-500"
        />
      </div>

      {showDropdown && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50"
        >
          {loading ? (
            <div className="flex items-center justify-center p-4 text-gray-600">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Loading...
            </div>
          ) : results.length > 0 ? (
            <ul className="divide-y">
              {results.map((item, index) => {
                const isActive = index === highlightIndex;

                return (
                  <li
                    key={item.code}
                    className={`px-4 py-3 cursor-pointer transition ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full ${item.type === 'TEST' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {item.type === 'TEST' ? 'Test' : item.type === 'OFFER' ? 'Offer' : 'Package'}
                        </span>
                      </div>
                      <button
                        className="text-xs bg-gray-800 text-white px-3 py-1 rounded-full hover:bg-gray-900"
                        onMouseDown={() => handleSelect(item)}
                      >
                        View
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-600">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;