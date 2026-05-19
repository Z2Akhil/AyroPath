'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Info } from 'lucide-react';
import { MedicineFormValues, MEDICINE_TYPES, MEDICINE_CATEGORIES, MedicineImage } from '@/types/medicine';
import ImageUploader from '../ImageUploader';
import TagInput from '../TagInput';

interface Props {
  images: MedicineImage[];
  thumbnail: MedicineImage | null;
  onImagesChange: (images: MedicineImage[]) => void;
  onThumbnailChange: (thumbnail: MedicineImage | null) => void;
  onNameChange: (name: string) => void;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-400 normal-case font-normal">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";

export default function BasicInfoTab({ images, thumbnail, onImagesChange, onThumbnailChange, onNameChange }: Props) {
  const { register, formState: { errors } } = useFormContext<MedicineFormValues>();

  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <Info className="h-4 w-4 text-blue-500" />
          <h3 className="text-sm font-bold text-gray-800">Medicine Identity</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Medicine Name" required error={errors.name?.message}>
            <input
              {...register('name', {
                onChange: (e) => onNameChange(e.target.value),
              })}
              placeholder="e.g. Paracetamol 500mg"
              className={`${inputClass} ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
            />
          </Field>

          <Field label="URL Slug" required error={errors.slug?.message}>
            <input
              {...register('slug')}
              placeholder="auto-generated-from-name"
              className={`${inputClass} font-mono text-xs ${errors.slug ? 'border-red-300 focus:border-red-400 focus:ring-red-500/20' : ''}`}
            />
            <p className="text-[11px] text-gray-400 mt-1">Used in URL. Only lowercase letters, numbers, hyphens.</p>
          </Field>

          <Field label="Medicine Type" required error={errors.type?.message}>
            <select
              {...register('type')}
              className={`${inputClass} capitalize ${errors.type ? 'border-red-300' : ''}`}
            >
              {MEDICINE_TYPES.map((t) => (
                <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </Field>

          <Field label="Category">
            <select {...register('category')} className={inputClass}>
              <option value="">— Select category —</option>
              {MEDICINE_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <div className="md:col-span-2">
            <Field label="Short Description">
              <textarea
                {...register('shortDescription')}
                rows={2}
                placeholder="Brief one-liner shown in product cards (max 160 chars)"
                maxLength={160}
                className={`${inputClass} resize-none`}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <Field label="Full Description">
              <textarea
                {...register('fullDescription')}
                rows={5}
                placeholder="Detailed description of the medicine, its uses, and key highlights..."
                className={`${inputClass} resize-y`}
              />
            </Field>
          </div>

          <div className="md:col-span-2">
            <TagInput name="tags" label="Tags" placeholder="Add tags (e.g. fever, pain, inflammation)..." />
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-800">Product Images</h3>
          <span className="text-xs text-gray-400 font-normal">PNG, JPG, WebP · Max 5 MB each</span>
        </div>
        <div className="p-6">
          <ImageUploader
            images={images}
            thumbnail={thumbnail}
            onImagesChange={onImagesChange}
            onThumbnailChange={onThumbnailChange}
          />
        </div>
      </div>
    </div>
  );
}
