'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Package, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { MedicineFormValues } from '@/types/medicine';

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";

function Field({ label, children, error, hint }: { label: string; children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Toggle({ value, onChange, label, description }: { value: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
          value ? 'bg-blue-500 focus:ring-blue-500' : 'bg-gray-300 focus:ring-gray-400'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-50 bg-gray-50/50">
        <Icon className={`h-4 w-4 ${color}`} />
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );
}

export default function InventoryTab() {
  const { register, watch, setValue, formState: { errors } } = useFormContext<MedicineFormValues>();

  const inStock = watch('inStock');
  const prescriptionRequired = watch('prescriptionRequired');
  const uploadPrescriptionRequired = watch('uploadPrescriptionRequired');
  const stockQuantity = watch('stockQuantity');
  const lowStockThreshold = watch('lowStockThreshold');

  const isLowStock = inStock && Number(stockQuantity) <= Number(lowStockThreshold) && Number(stockQuantity) > 0;

  return (
    <div className="space-y-6">
      {/* Stock */}
      <SectionCard icon={Package} title="Stock Management" color="text-blue-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Stock Quantity" error={errors.stockQuantity?.message}>
            <input
              {...register('stockQuantity', {
                onChange: (e) => {
                  const val = parseInt(e.target.value) || 0;
                  if (val === 0) setValue('inStock', false);
                  else if (!inStock) setValue('inStock', true);
                },
              })}
              type="number"
              min="0"
              placeholder="0"
              className={`${inputClass} ${errors.stockQuantity ? 'border-red-300' : ''}`}
            />
          </Field>

          <Field label="Low Stock Threshold" hint="Shows warning when stock drops below this">
            <input
              {...register('lowStockThreshold')}
              type="number"
              min="0"
              placeholder="10"
              className={inputClass}
            />
          </Field>

          <Field label="Expiry Date">
            <input
              {...register('expiryDate')}
              type="date"
              className={inputClass}
            />
          </Field>

          <Field label="SKU" hint="Stock Keeping Unit identifier">
            <input {...register('sku')} placeholder="e.g. MED-PARA-500" className={inputClass} />
          </Field>

          <Field label="Batch Number">
            <input {...register('batchNumber')} placeholder="e.g. BT2024001" className={inputClass} />
          </Field>
        </div>

        <Toggle
          value={inStock}
          onChange={(v) => setValue('inStock', v)}
          label="In Stock"
          description={inStock ? 'Available for purchase' : 'Hidden from customers'}
        />

        {/* Stock alerts */}
        {Number(stockQuantity) === 0 && (
          <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">Stock is 0 — medicine is marked as out of stock.</p>
          </div>
        )}
        {isLowStock && (
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <p className="text-sm text-amber-700 font-medium">
              Low stock alert — only {stockQuantity} units remaining (threshold: {lowStockThreshold}).
            </p>
          </div>
        )}
      </SectionCard>

      {/* Prescription */}
      <SectionCard icon={FileText} title="Prescription Settings" color="text-purple-500">
        <div className="space-y-3">
          <Toggle
            value={prescriptionRequired}
            onChange={(v) => {
              setValue('prescriptionRequired', v);
              if (!v) setValue('uploadPrescriptionRequired', false);
            }}
            label="Prescription Required"
            description="Customer must have a valid prescription to purchase this medicine"
          />

          {prescriptionRequired && (
            <Toggle
              value={uploadPrescriptionRequired}
              onChange={(v) => setValue('uploadPrescriptionRequired', v)}
              label="Upload Prescription Required"
              description="Customer must upload a photo of the prescription at checkout"
            />
          )}
        </div>

        {prescriptionRequired && (
          <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-xl mt-4">
            <ClipboardList className="h-5 w-5 text-purple-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-purple-800">Rx Required badge will be shown</p>
              <p className="text-xs text-purple-600 mt-0.5">
                This medicine will display a "Prescription Required" badge on the product page.
              </p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
