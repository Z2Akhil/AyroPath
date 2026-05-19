'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Search, HelpCircle } from 'lucide-react';
import { MedicineFormValues } from '@/types/medicine';
import FaqInput from '../FaqInput';
import TagInput from '../TagInput';

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";

function Field({ label, children, hint, charCount }: {
  label: string; children: React.ReactNode; hint?: string; charCount?: { current: number; max: number };
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
        {charCount && (
          <span className={`text-[11px] font-medium ${charCount.current > charCount.max ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount.current}/{charCount.max}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
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
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

export default function FaqSeoTab() {
  const { register, watch } = useFormContext<MedicineFormValues>();

  const metaTitle = watch('metaTitle') ?? '';
  const metaDescription = watch('metaDescription') ?? '';

  return (
    <div className="space-y-6">
      {/* FAQs */}
      <SectionCard icon={HelpCircle} title="Frequently Asked Questions" color="text-blue-500">
        <FaqInput />
      </SectionCard>

      {/* SEO */}
      <SectionCard icon={Search} title="SEO Settings" color="text-green-500">
        <div className="space-y-5">
          <Field
            label="Meta Title"
            hint="Shown in browser tab and search results. Recommended: 50–60 chars"
            charCount={{ current: metaTitle.length, max: 60 }}
          >
            <input
              {...register('metaTitle')}
              maxLength={60}
              placeholder="e.g. Buy Paracetamol 500mg Online | AyroPath"
              className={inputClass}
            />
          </Field>

          <Field
            label="Meta Description"
            hint="Shown in search engine results. Recommended: 120–160 chars"
            charCount={{ current: metaDescription.length, max: 160 }}
          >
            <textarea
              {...register('metaDescription')}
              rows={3}
              maxLength={160}
              placeholder="e.g. Buy Paracetamol 500mg online at best price. Fast delivery, genuine medicines, prescription not required."
              className={`${inputClass} resize-none`}
            />
          </Field>

          <Field label="Search Keywords" hint="Comma-separated keywords for internal search boost">
            <input
              {...register('searchKeywords')}
              placeholder="paracetamol, fever, headache, pain relief, analgesic"
              className={inputClass}
            />
          </Field>

          <TagInput
            name="seoTags"
            label="SEO Tags"
            placeholder="Add SEO tags..."
          />

          {/* Preview */}
          {(metaTitle || metaDescription) && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Search Preview</p>
              <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-1">
                <p className="text-[13px] text-green-700 font-medium">ayropath.com › medicines › slug</p>
                <p className="text-blue-700 text-base font-medium hover:underline cursor-pointer">
                  {metaTitle || 'Medicine Name | AyroPath'}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {metaDescription || 'No description provided.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
