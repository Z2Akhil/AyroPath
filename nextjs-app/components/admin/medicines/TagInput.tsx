'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

interface Props {
  name: string;
  label: string;
  placeholder?: string;
}

export default function TagInput({ name, label, placeholder = 'Add tag and press Enter...' }: Props) {
  const { watch, setValue } = useFormContext<any>();
  const tags: string[] = watch(name) ?? [];
  const [inputValue, setInputValue] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag || tags.includes(tag)) return;
    setValue(name, [...tags, tag], { shouldDirty: true });
    setInputValue('');
  };

  const removeTag = (index: number) => {
    setValue(name, tags.filter((_, i) => i !== index), { shouldDirty: true });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</p>
      <div className="min-h-[46px] flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 focus-within:bg-white transition-all">
        {tags.map((tag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg"
          >
            #{tag}
            <button type="button" onClick={() => removeTag(i)} className="text-blue-400 hover:text-blue-700 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => inputValue.trim() && addTag(inputValue)}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />
      </div>
      <p className="text-[11px] text-gray-400 mt-1">Press Enter or comma to add · Backspace to remove last</p>
    </div>
  );
}
