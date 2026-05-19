'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, Star, Loader2, ImageIcon } from 'lucide-react';
import { MedicineImage } from '@/types/medicine';

interface Props {
  images: MedicineImage[];
  thumbnail: MedicineImage | null;
  onImagesChange: (images: MedicineImage[]) => void;
  onThumbnailChange: (thumbnail: MedicineImage | null) => void;
}

function getAdminApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('admin_auth');
    if (stored) return JSON.parse(stored)?.apiKey ?? null;
  } catch {}
  return null;
}

async function uploadToCloudinary(file: File): Promise<MedicineImage> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'ayropath/medicines');

  const headers: HeadersInit = {};
  const apiKey = getAdminApiKey();
  if (apiKey) headers['x-api-key'] = apiKey;

  const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data.data as MedicineImage;
}

export default function ImageUploader({ images, thumbnail, onImagesChange, onThumbnailChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const galleryRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setUploadError('');
    try {
      const results = await Promise.all(files.map(uploadToCloudinary));
      onImagesChange([...images, ...results]);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  const handleThumbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setThumbUploading(true);
    setUploadError('');
    try {
      const result = await uploadToCloudinary(file);
      onThumbnailChange(result);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    } finally {
      setThumbUploading(false);
      if (thumbRef.current) thumbRef.current.value = '';
    }
  };

  const removeImage = (publicId: string) => {
    onImagesChange(images.filter((img) => img.publicId !== publicId));
    if (thumbnail?.publicId === publicId) onThumbnailChange(null);
  };

  const setAsThumbnail = (img: MedicineImage) => {
    onThumbnailChange(img);
  };

  return (
    <div className="space-y-6">
      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Medicine Images</p>
            <p className="text-xs text-gray-400 mt-0.5">Click ★ on any image to set as thumbnail</p>
          </div>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Upload Images'}
          </button>
          <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} />
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((img) => (
              <div key={img.publicId} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-gray-100 bg-gray-50">
                <img src={img.url} alt="Medicine" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAsThumbnail(img)}
                    className={`p-1.5 rounded-full shadow transition-colors ${
                      thumbnail?.publicId === img.publicId ? 'bg-yellow-400' : 'bg-white hover:bg-yellow-100'
                    }`}
                    title="Set as thumbnail"
                  >
                    <Star className={`h-3.5 w-3.5 ${thumbnail?.publicId === img.publicId ? 'text-gray-800 fill-gray-800' : 'text-gray-600'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(img.publicId)}
                    className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 shadow transition-colors"
                    title="Remove"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </div>
                {thumbnail?.publicId === img.publicId && (
                  <span className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Thumbnail
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-10 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all"
          >
            <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-400">Click to upload medicine images</p>
            <p className="text-xs text-gray-300 mt-1">PNG, JPG, WebP up to 5 MB each</p>
          </button>
        )}
      </div>

      {/* Separate thumbnail upload (when not set via gallery) */}
      {!thumbnail && (
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => thumbRef.current?.click()}
            disabled={thumbUploading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {thumbUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {thumbUploading ? 'Uploading...' : 'Upload Thumbnail Separately'}
          </button>
          <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={handleThumbUpload} />
          <span className="text-xs text-gray-400">Or pick from the gallery above</span>
        </div>
      )}

      {thumbnail && (
        <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2.5">
            <img src={thumbnail.url} alt="Thumbnail" className="w-10 h-10 object-cover rounded-lg" />
            <div>
              <p className="text-xs font-bold text-yellow-800">Active Thumbnail</p>
              <p className="text-[11px] text-yellow-600">This image shows in product cards</p>
            </div>
            <button type="button" onClick={() => onThumbnailChange(null)} className="ml-2 p-1 text-yellow-500 hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{uploadError}</p>
      )}
    </div>
  );
}
