import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import SMSService from '@/lib/services/smsService';
import { generateOTP, getExpiryTime } from '@/lib/utils/otp';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const { mobileNumber } = await req.json();

        if (!mobileNumber) {
            return NextResponse.json({
                success: false,
                message: 'Mobile number is required'
            }, { status: 400 });
        }

        const user = await User.findOne({ mobileNumber, isVerified: true });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        const otp = generateOTP();
        const expiresAt = getExpiryTime(10);

        // Send OTP via MessageCentral
        const smsResult = await SMSService.sendOTP(mobileNumber, otp, { purpose: 'forgot_password' });

        if (!smsResult.success) {
            return NextResponse.json({
                success: false,
                message: smsResult.message || 'Failed to send OTP'
            }, { status: 500 });
        }

        // Create OTP record
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
            purpose: 'forgot_password',
            expiresAt,
            provider: 'MessageCentral',
        };

        if (smsResult.verificationId) {
            otpData.verificationId = smsResult.verificationId;
        }

        await OTP.create(otpData);

        const response: { success: boolean; message: string; verificationId?: string; otp?: string } = {
            success: true,
            message: 'OTP sent for password reset',
            verificationId: smsResult.verificationId,
        };

        if (process.env.NODE_ENV === 'development') {
            response.otp = otp;
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Forgot password error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}