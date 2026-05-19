'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Stethoscope, FlaskConical } from 'lucide-react';
import { MedicineFormValues } from '@/types/medicine';
import DynamicListInput from '../DynamicListInput';

const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all";
const textareaClass = `${inputClass} resize-y`;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
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

export default function MedicalInfoTab() {
  const { register } = useFormContext<MedicineFormValues>();

  return (
    <div className="space-y-6">
      {/* Composition */}
      <SectionCard icon={FlaskConical} title="Composition & Uses" color="text-teal-500">
        <Field label="Salt Composition" hint="e.g. Paracetamol (500mg) + Caffeine (65mg)">
          <input
            {...register('saltComposition')}
            placeholder="Active ingredients and their strengths"
            className={inputClass}
          />
        </Field>

        <DynamicListInput
          name="uses"
          label="Uses / Indications"
          placeholder="e.g. Relief from fever, headache..."
          itemColor="blue"
        />

        <DynamicListInput
          name="benefits"
          label="Key Benefits"
          placeholder="e.g. Fast-acting pain relief..."
          itemColor="green"
        />

        <Field label="How It Works">
          <textarea
            {...register('howItWorks')}
            rows={4}
            placeholder="Explain the mechanism of action in simple terms..."
            className={textareaClass}
          />
        </Field>
      </SectionCard>

      {/* Directions */}
      <SectionCard icon={Stethoscope} title="Dosage & Directions" color="text-blue-500">
        <Field label="Dosage / Directions for Use">
          <textarea
            {...register('dosage')}
            rows={4}
            placeholder="e.g. Adults: 1–2 tablets every 4–6 hours. Do not exceed 8 tablets in 24 hours..."
            className={textareaClass}
          />
        </Field>

        <DynamicListInput
          name="sideEffects"
          label="Side Effects"
          placeholder="e.g. Nausea, dizziness, allergic reaction..."
          itemColor="red"
        />

        <DynamicListInput
          name="precautions"
          label="Precautions & Warnings"
          placeholder="e.g. Not for use in children under 12..."
          itemColor="amber"
        />

        <Field label="Storage Instructions">
          <input
            {...register('storageInstructions')}
            placeholder="e.g. Store below 25°C in a dry place. Keep away from sunlight."
            className={inputClass}
          />
        </Field>

        <Field label="Drug Interactions">
          <textarea
            {...register('drugInteractions')}
            rows={3}
            placeholder="List any known drug interactions..."
            className={textareaClass}
          />
        </Field>
      </SectionCard>
    </div>
  );
}
