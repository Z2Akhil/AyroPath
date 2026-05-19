'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { IndianRupee, Package, Factory } from 'lucide-react';
import { MedicineFormValues } from '@/types/medicine';

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";

function Field({ label, required, error, children, hint }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-red-400 normal-case font-normal">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: {
  icon: any; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/50`}>
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function PricingTab() {
  const { register, watch, formState: { errors } } = useFormContext<MedicineFormValues>();

  const mrp = parseFloat(String(watch('mrp') ?? 0)) || 0;
  const offerPrice = parseFloat(String(watch('offerPrice') ?? 0)) || 0;
  const discount = mrp > 0 ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <SectionCard icon={IndianRupee} title="Pricing" color="text-green-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="MRP (₹)" required error={errors.mrp?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                {...register('mrp')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`${inputClass} pl-8 ${errors.mrp ? 'border-red-300' : ''}`}
              />
            </div>
          </Field>

          <Field label="Offer Price (₹)" required error={errors.offerPrice?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                {...register('offerPrice')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`${inputClass} pl-8 ${errors.offerPrice ? 'border-red-300' : ''}`}
              />
            </div>
          </Field>

          {/* Auto-calculated discount */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Discount %
              <span className="ml-2 text-[10px] font-normal text-gray-400 normal-case">(auto-calculated)</span>
            </label>
            <div className={`flex items-center justify-center h-[46px] rounded-xl border text-lg font-black ${
              discount > 0 ? 'bg-green-50 border-green-100 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'
            }`}>
              {discount > 0 ? `${discount}% OFF` : '0%'}
            </div>
          </div>

          <Field label="Price Per Unit (₹)" hint="e.g. price per tablet">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">₹</span>
              <input
                {...register('pricePerUnit')}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={`${inputClass} pl-8`}
              />
            </div>
          </Field>
        </div>

        {/* Price summary */}
        {mrp > 0 && offerPrice > 0 && (
          <div className="mt-5 p-4 bg-green-50 border border-green-100 rounded-xl flex flex-wrap items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">MRP</p>
              <p className="text-lg font-black text-gray-400 line-through">₹{mrp.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">Selling Price</p>
              <p className="text-xl font-black text-green-700">₹{offerPrice.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 font-medium">You Save</p>
              <p className="text-lg font-black text-green-600">₹{(mrp - offerPrice).toFixed(2)} ({discount}%)</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Packaging */}
      <SectionCard icon={Package} title="Packaging Details" color="text-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Pack Size" hint="e.g. Strip of 15 tablets">
            <input
              {...register('packSize')}
              placeholder="e.g. Strip of 15 tablets"
              className={inputClass}
            />
          </Field>

          <Field label="Tablet / Unit Count">
            <input
              {...register('tabletCount')}
              type="number"
              min="1"
              placeholder="e.g. 15"
              className={inputClass}
            />
          </Field>

          <Field label="Weight / Volume" hint="e.g. 100ml, 500mg">
            <input
              {...register('weightVolume')}
              placeholder="e.g. 100ml"
              className={inputClass}
            />
          </Field>
        </div>
      </SectionCard>

      {/* Manufacturer */}
      <SectionCard icon={Factory} title="Manufacturer Information" color="text-purple-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Made By">
            <input {...register('madeBy')} placeholder="Manufacturer name" className={inputClass} />
          </Field>
          <Field label="Marketed By">
            <input {...register('marketedBy')} placeholder="Marketing company" className={inputClass} />
          </Field>
          <Field label="Country of Origin">
            <input {...register('countryOfOrigin')} placeholder="India" className={inputClass} />
          </Field>
        </div>
      </SectionCard>
    </div>
  );
}
