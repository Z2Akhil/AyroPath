'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertTriangle, Baby, Wine, Car, Activity } from 'lucide-react';
import { MedicineFormValues } from '@/types/medicine';

const textareaClass = "w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-300 outline-none focus:ring-2 transition-all resize-none";

interface WarningCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  placeholder: string;
  fieldName: keyof MedicineFormValues;
  theme: 'amber' | 'pink' | 'purple' | 'slate' | 'orange' | 'rose';
}

const themes = {
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-100', iconBg: 'bg-amber-100',  iconColor: 'text-amber-600',  title: 'text-amber-900',  sub: 'text-amber-600',  ring: 'focus:ring-amber-500/20 focus:border-amber-400' },
  pink:   { bg: 'bg-pink-50',   border: 'border-pink-100',  iconBg: 'bg-pink-100',   iconColor: 'text-pink-600',   title: 'text-pink-900',   sub: 'text-pink-500',   ring: 'focus:ring-pink-500/20 focus:border-pink-400' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-100',iconBg: 'bg-purple-100', iconColor: 'text-purple-600', title: 'text-purple-900', sub: 'text-purple-500', ring: 'focus:ring-purple-500/20 focus:border-purple-400' },
  slate:  { bg: 'bg-slate-50',  border: 'border-slate-200', iconBg: 'bg-slate-100',  iconColor: 'text-slate-600',  title: 'text-slate-900',  sub: 'text-slate-500',  ring: 'focus:ring-slate-500/20 focus:border-slate-400' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-100',iconBg: 'bg-orange-100', iconColor: 'text-orange-600', title: 'text-orange-900', sub: 'text-orange-500', ring: 'focus:ring-orange-500/20 focus:border-orange-400' },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-100',  iconBg: 'bg-rose-100',   iconColor: 'text-rose-600',   title: 'text-rose-900',   sub: 'text-rose-500',   ring: 'focus:ring-rose-500/20 focus:border-rose-400' },
};

function WarningCard({ icon, title, subtitle, placeholder, fieldName, theme }: WarningCardProps) {
  const { register } = useFormContext<MedicineFormValues>();
  const t = themes[theme];

  return (
    <div className={`${t.bg} border ${t.border} rounded-2xl p-5`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 ${t.iconBg} rounded-xl ${t.iconColor}`}>{icon}</div>
        <div>
          <h4 className={`text-sm font-bold ${t.title}`}>{title}</h4>
          <p className={`text-xs ${t.sub}`}>{subtitle}</p>
        </div>
      </div>
      <textarea
        {...register(fieldName as any)}
        rows={3}
        placeholder={placeholder}
        className={`${textareaClass} ${t.border} ${t.ring}`}
      />
    </div>
  );
}

export default function SafetyTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900">Safety Warnings</h2>
          <p className="text-sm text-gray-500">Provide clear safety information for vulnerable groups</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WarningCard
          icon={<Baby className="h-5 w-5" />}
          title="Pregnancy"
          subtitle="Safety during pregnancy"
          placeholder="e.g. SAFE — Considered safe when taken as directed during pregnancy. Consult your doctor."
          fieldName="pregnancyWarning"
          theme="pink"
        />

        <WarningCard
          icon={<Baby className="h-5 w-5" />}
          title="Breastfeeding"
          subtitle="Safety while breastfeeding"
          placeholder="e.g. SAFE — Safe to use during breastfeeding. Small amounts pass into breast milk."
          fieldName="breastfeedingWarning"
          theme="rose"
        />

        <WarningCard
          icon={<Wine className="h-5 w-5" />}
          title="Alcohol Interaction"
          subtitle="Interaction with alcohol"
          placeholder="e.g. CAUTION — Drinking alcohol with this medicine may increase drowsiness."
          fieldName="alcoholWarning"
          theme="amber"
        />

        <WarningCard
          icon={<Car className="h-5 w-5" />}
          title="Driving & Machinery"
          subtitle="Effect on alertness and driving"
          placeholder="e.g. SAFE — Does not affect driving ability at normal doses."
          fieldName="drivingWarning"
          theme="purple"
        />

        <WarningCard
          icon={<Activity className="h-5 w-5" />}
          title="Kidney"
          subtitle="Safety for kidney patients"
          placeholder="e.g. CAUTION — Use with caution. Dose adjustment may be required in kidney disease."
          fieldName="kidneyWarning"
          theme="orange"
        />

        <WarningCard
          icon={<Activity className="h-5 w-5" />}
          title="Liver"
          subtitle="Safety for liver patients"
          placeholder="e.g. UNSAFE — Avoid use or use with extreme caution in severe liver disease."
          fieldName="liverWarning"
          theme="slate"
        />
      </div>

      <p className="text-xs text-gray-400 text-center pt-2">
        Leave any field blank if not applicable. Accurate safety information is critical for patient safety.
      </p>
    </div>
  );
}
