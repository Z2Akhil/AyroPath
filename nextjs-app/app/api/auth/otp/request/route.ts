import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import OTP from '@/lib/models/OTP';
import SMSService from '@/lib/services/smsService';
import { generateOTP, getExpiryTime } from '@/lib/utils/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mobileNumber, email, purpose = 'verification' } = body;

    if (!mobileNumber) {
      return NextResponse.json(
        { success: false, message: 'Mobile number is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const otp = generateOTP();
    const expiresAt = getExpiryTime(10);

    // Send OTP via MessageCentral
    const smsResult = await SMSService.sendOTP(mobileNumber, otp, { purpose });
    
    if (!smsResult.success) {
      return NextResponse.json(
        { success: false, message: smsResult.message },
        { status: 500 }
      );
    }

    // Create OTP record - always use MessageCentral
    const otpData: {
      mobileNumber: string;
      otp: string;
      purpose: string;
      expiresAt: Date;
      provider: 'MessageCentral';
      verificationId?: string;
    } = {
      mobileNumber,
      otp,
      purpose,
      expiresAt,
      provider: 'MessageCentral',
    };

    if (smsResult.verificationId) {
      otpData.verificationId = smsResult.verificationId;
    }

    await OTP.create(otpData);

    const response: { 
      success: boolean; 
      message: string; 
      otp?: string;
      verificationId?: string;
    } = {
      success: true,
      message: 'OTP sent successfully',
      verificationId: smsResult.verificationId,
    };

    // Include OTP in development mode
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('OTP request error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send OTP';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}