import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import { uploadBuffer, FOLDERS, CloudinaryFolder } from '@/lib/cloudinary';

// ─── Config ──────────────────────────────────────────────────────────────────

const ALLOWED_FOLDERS = new Set<string>(Object.values(FOLDERS));

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const DOC_TYPES = [...IMAGE_TYPES, 'application/pdf'];

// Prescriptions allow PDFs and have a higher size cap
const FOLDER_CONFIG: Record<string, { maxBytes: number; allowedTypes: string[] }> = {
  [FOLDERS.PRESCRIPTIONS]: { maxBytes: 10 * 1024 * 1024, allowedTypes: DOC_TYPES },
};
const DEFAULT_CONFIG = { maxBytes: 5 * 1024 * 1024, allowedTypes: IMAGE_TYPES };

// ─── POST /api/upload ─────────────────────────────────────────────────────────
// Expects: multipart/form-data with `file` (File) and `folder` (string) fields.
// Returns: { success: true, data: { url, publicId } }

export async function POST(request: NextRequest) {
  const authResult = await adminAuth(request);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { success: false, message: authResult.error },
      { status: authResult.status }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const folder = formData.get('folder') as string | null;

  // ── Validate inputs ────────────────────────────────────────────────────────

  if (!file || file.size === 0) {
    return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
  }

  if (!folder || !ALLOWED_FOLDERS.has(folder)) {
    return NextResponse.json(
      {
        success: false,
        message: `Invalid folder. Allowed values: ${[...ALLOWED_FOLDERS].join(', ')}`,
      },
      { status: 400 }
    );
  }

  const { maxBytes, allowedTypes } = FOLDER_CONFIG[folder] ?? DEFAULT_CONFIG;

  if (file.size > maxBytes) {
    return NextResponse.json(
      { success: false, message: `File too large. Max size: ${maxBytes / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, message: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` },
      { status: 400 }
    );
  }

  // ── Upload to Cloudinary ───────────────────────────────────────────────────

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBuffer(buffer, {
      folder: folder as CloudinaryFolder,
      resourceType: folder === FOLDERS.PRESCRIPTIONS ? 'auto' : 'image',
    });

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Upload] Cloudinary error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Upload failed' },
      { status: 500 }
    );
  }
}
