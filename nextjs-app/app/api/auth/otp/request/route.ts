import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';
import { generateOTP, getExpiryTime } from '@/lib/utils/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, email, purpose = 'verification' } = body;

    if (!mobileNumber && !email) {
      return NextResponse.json(
        { success: false, message: 'Mobile number or email is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const otp = generateOTP();
    const expiresAt = getExpiryTime(10);

    await OTP.create({
      mobileNumber,
      email,
      otp,
      purpose,
      expiresAt,
      provider: 'Mock',
    });

    const response: { success: boolean; message: string; otp?: string } = {
      success: true,
      message: 'OTP sent successfully',
    };

    if (process.env.NODE_ENV === 'development') {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Failed to send OTP' },
      { status: 500 }
    );
  }
}