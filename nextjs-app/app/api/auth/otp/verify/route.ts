import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, email, otp, purpose = 'verification' } = body;

    if ((!mobileNumber && !email) || !otp) {
      return NextResponse.json(
        { success: false, message: 'Mobile number/email and OTP are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const query = mobileNumber ? { mobileNumber, purpose } : { email, purpose };

    const otpRecord = await OTP.findOne({
      ...query,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= 3) {
      return NextResponse.json(
        { success: false, message: 'Too many failed attempts. Please request new OTP' },
        { status: 400 }
      );
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    return NextResponse.json({ success: true, message: 'OTP verified successfully' });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}