'use client';

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
  itemColor?: 'blue' | 'green' | 'red' | 'amber';
}

const colorMap = {
  blue: { pill: 'bg-blue-50 text-blue-800 border-blue-100', remove: 'text-blue-400 hover:text-red-500 hover:bg-red-50' },
  green: { pill: 'bg-green-50 text-green-800 border-green-100', remove: 'text-green-400 hover:text-red-500 hover:bg-red-50' },
  red: { pill: 'bg-red-50 text-red-800 border-red-100', remove: 'text-red-400 hover:text-red-600 hover:bg-red-100' },
  amber: { pill: 'bg-amber-50 text-amber-800 border-amber-100', remove: 'text-amber-400 hover:text-red-500 hover:bg-red-50' },
};

export default function DynamicListInput({ name, label, placeholder = 'Type and press Enter...', itemColor = 'blue' }: Props) {
  const { watch, setValue } = useFormContext<any>();
  const items: string[] = watch(name) ?? [];
  const [inputValue, setInputValue] = useState('');
  const colors = colorMap[itemColor];

  const add = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || items.includes(trimmed)) return;
    setValue(name, [...items, trimmed], { shouldDirty: true });
    setInputValue('');
  };

  const remove = (index: number) => {
    setValue(name, items.filter((_, i) => i !== index), { shouldDirty: true });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</p>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-sm font-medium ${colors.pill}`}
            >
              {item}
              <button
                type="button"
                onClick={() => remove(i)}
                className={`rounded transition-colors ${colors.remove}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          placeholder={placeholder}
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
        />
        <button
          type="button"
          onClick={add}
          disabled={!inputValue.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>
    </div>
  );
}
