import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import SiteSettings from '@/lib/models/SiteSettings';
import { adminAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    let settings = await SiteSettings.findOne();

    if (!settings) {
      settings = await SiteSettings.create({});
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await adminAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, message: authResult.error },
        { status: authResult.status }
      );
    }

    await connectToDatabase();

    const formData = await request.formData();
    const helplineNumber = formData.get('helplineNumber') as string | null;
    const email = formData.get('email') as string | null;
    const socialMediaStr = formData.get('socialMedia') as string | null;
    const logoFile = formData.get('logo') as File | null;
    const heroImageFile = formData.get('heroImage') as File | null;

    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({});
    }

    const updates: any = {
      updatedBy: authResult.admin._id,
    };

    if (helplineNumber !== null) updates.helplineNumber = helplineNumber;
    if (email !== null) updates.email = email;
    
    if (socialMediaStr) {
      try {
        updates.socialMedia = JSON.parse(socialMediaStr);
      } catch (e) {
        console.error('Invalid social media JSON');
      }
    }

    // Handle File Uploads
    if (logoFile && logoFile.size > 0 && typeof logoFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      const base64Str = buffer.toString('base64');
      const mimeType = logoFile.type || 'image/png';
      updates.logo = `data:${mimeType};base64,${base64Str}`;
    }

    if (heroImageFile && heroImageFile.size > 0 && typeof heroImageFile.arrayBuffer === 'function') {
      const buffer = Buffer.from(await heroImageFile.arrayBuffer());
      const base64Str = buffer.toString('base64');
      const mimeType = heroImageFile.type || 'image/jpeg';
      updates.heroImage = `data:${mimeType};base64,${base64Str}`;
    }

    Object.assign(settings, updates);
    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings,
    });
  } catch (err: any) {
    console.error('Error updating settings:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Server Error' },
      { status: 500 }
    );
  }
}