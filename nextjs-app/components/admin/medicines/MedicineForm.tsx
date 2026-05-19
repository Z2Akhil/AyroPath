'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
  Info, Tag, Stethoscope, ShieldAlert, Package, HelpCircle,
  Save, Globe, Loader2, AlertCircle, ChevronLeft,
} from 'lucide-react';

import { medicineSchema, medicinDefaultValues, MedicineFormValues, MedicineImage } from '@/types/medicine';
import adminMedicineApi, { CreateMedicinePayload } from '@/lib/api/adminMedicineApi';
import { useToast } from '@/providers/ToastProvider';

import BasicInfoTab from './tabs/BasicInfoTab';
import PricingTab from './tabs/PricingTab';
import MedicalInfoTab from './tabs/MedicalInfoTab';
import SafetyTab from './tabs/SafetyTab';
import InventoryTab from './tabs/InventoryTab';
import FaqSeoTab from './tabs/FaqSeoTab';

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS = [
  { id: 'basic',     label: 'Basic Info',    icon: Info,        fields: ['name', 'slug', 'type'] },
  { id: 'pricing',   label: 'Pricing',       icon: Tag,         fields: ['mrp', 'offerPrice'] },
  { id: 'medical',   label: 'Medical Info',  icon: Stethoscope, fields: [] },
  { id: 'safety',    label: 'Safety',        icon: ShieldAlert, fields: [] },
  { id: 'inventory', label: 'Inventory',     icon: Package,     fields: ['stockQuantity'] },
  { id: 'faq-seo',   label: 'FAQ & SEO',     icon: HelpCircle,  fields: [] },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Slug generator ───────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  initialData?: Partial<MedicineFormValues>;
  initialImages?: MedicineImage[];
  initialThumbnail?: MedicineImage | null;
  medicineId?: string;
}

export default function MedicineForm({ initialData, initialImages = [], initialThumbnail = null, medicineId }: Props) {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [images, setImages] = useState<MedicineImage[]>(initialImages);
  const [thumbnail, setThumbnail] = useState<MedicineImage | null>(initialThumbnail);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const slugManuallyEdited = useRef(false);

  const methods = useForm<MedicineFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(medicineSchema) as any,
    defaultValues: { ...medicinDefaultValues, ...initialData },
    mode: 'onTouched',
  });

  const { handleSubmit, getValues, setValue, watch, formState: { errors } } = methods;

  // Auto-generate slug from name
  const name = watch('name');
  useEffect(() => {
    if (!slugManuallyEdited.current && name) {
      setValue('slug', toSlug(name), { shouldValidate: false });
    }
  }, [name, setValue]);

  // Auto-sync inStock when stock qty reaches 0
  const stockQuantity = watch('stockQuantity');
  useEffect(() => {
    if (Number(stockQuantity) === 0) setValue('inStock', false);
    else if (Number(stockQuantity) > 0) setValue('inStock', true);
  }, [stockQuantity, setValue]);

  // Tab error badge
  const tabHasError = (fields: readonly string[]) =>
    fields.some((f) => f in errors);

  const buildPayload = (formValues: MedicineFormValues, publish: boolean): CreateMedicinePayload => ({
    ...formValues,
    images,
    thumbnail,
    discountPercentage:
      formValues.mrp > 0
        ? Math.round(((formValues.mrp - formValues.offerPrice) / formValues.mrp) * 100)
        : 0,
    isPublished: publish,
    isDraft: !publish,
  });

  const saveDraft = async () => {
    setIsSavingDraft(true);
    try {
      const formValues = getValues();
      const payload = buildPayload(formValues, false);

      if (medicineId) {
        await adminMedicineApi.update(medicineId, payload);
      } else {
        await adminMedicineApi.create(payload);
      }
      success('Draft saved successfully!');
      router.push('/admin/medicines');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const publishMedicine = handleSubmit(async (data) => {
    const formValues = data as MedicineFormValues;
    setIsPublishing(true);
    try {
      const payload = buildPayload(formValues, true);

      if (medicineId) {
        await adminMedicineApi.update(medicineId, payload);
      } else {
        await adminMedicineApi.create(payload);
      }
      success('Medicine published successfully!');
      router.push('/admin/medicines');
    } catch (err: any) {
      toastError(err.response?.data?.message || err.message || 'Failed to publish');
    } finally {
      setIsPublishing(false);
    }
  });

  const handleNameChange = (name: string) => {
    // slugManuallyEdited ref stays false so slug auto-updates unless user has touched it
  };

  const activeTabConfig = TABS.find((t) => t.id === activeTab)!;
  const isBusy = isSavingDraft || isPublishing;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/medicines')}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Medicines
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {medicineId ? 'Edit Medicine' : 'Add New Medicine'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details across all tabs before publishing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveDraft}
            disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => publishMedicine()}
            disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all"
          >
            {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Validation error banner */}
      {Object.keys(errors).length > 0 && (
        <div className="flex items-center gap-3 mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 font-medium">
            Please fix {Object.keys(errors).length} validation error{Object.keys(errors).length > 1 ? 's' : ''} before publishing.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 overflow-x-auto pb-0.5 mb-6 scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const hasError = tabHasError(tab.fields as readonly string[]);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span>{tab.label}</span>
              {hasError && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <FormProvider {...methods}>
        <div>
          {activeTab === 'basic' && (
            <BasicInfoTab
              images={images}
              thumbnail={thumbnail}
              onImagesChange={setImages}
              onThumbnailChange={setThumbnail}
              onNameChange={handleNameChange}
            />
          )}
          {activeTab === 'pricing' && <PricingTab />}
          {activeTab === 'medical' && <MedicalInfoTab />}
          {activeTab === 'safety' && <SafetyTab />}
          {activeTab === 'inventory' && <InventoryTab />}
          {activeTab === 'faq-seo' && <FaqSeoTab />}
        </div>
      </FormProvider>

      {/* Floating bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-t border-gray-100 px-6 py-4 lg:pl-72">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="font-medium">Tab:</span>
            <span className="text-gray-900 font-semibold">{activeTabConfig.label}</span>
            {images.length > 0 && (
              <span className="ml-3 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                {images.length} image{images.length > 1 ? 's' : ''} uploaded
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={saveDraft}
              disabled={isBusy}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              {isSavingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => publishMedicine()}
              disabled={isBusy}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-500/25 transition-all"
            >
              {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
              Publish Medicine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
