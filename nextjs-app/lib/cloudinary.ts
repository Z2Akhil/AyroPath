import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// ─── Folder paths ────────────────────────────────────────────────────────────
// All uploads are namespaced under ayropath/. Add new resource types here.
export const FOLDERS = {
  SITE: 'ayropath/site',
  THYROCARE_PACKAGES: 'ayropath/thyrocare/packages',
  THYROCARE_TESTS: 'ayropath/thyrocare/tests',
  THYROCARE_OFFERS: 'ayropath/thyrocare/offers',
  MEDICINES: 'ayropath/medicines',
  DOCTORS: 'ayropath/doctors',
  PRESCRIPTIONS: 'ayropath/prescriptions',
  USERS: 'ayropath/users',
} as const;

export type CloudinaryFolder = (typeof FOLDERS)[keyof typeof FOLDERS];

export interface UploadResult {
  url: string;
  publicId: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

interface UploadOptions {
  folder: string;
  publicId?: string;
  // 'auto' is required for prescriptions which may be PDFs
  resourceType?: 'image' | 'auto';
}

export const uploadBuffer = (buffer: Buffer, options: UploadOptions): Promise<UploadResult> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: options.folder,
          public_id: options.publicId,
          resource_type: options.resourceType ?? 'image',
          overwrite: true,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      )
      .end(buffer);
  });

// ─── Delete ──────────────────────────────────────────────────────────────────

export const deleteFromCloudinary = (publicId: string) =>
  cloudinary.uploader.destroy(publicId);

export { cloudinary };
