import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import SMSService from '@/lib/services/smsService';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const { mobileNumber, otp, newPassword, verificationId } = await req.json();

        if (!mobileNumber || !otp || !newPassword) {
            return NextResponse.json({
                success: false,
                message: 'Mobile number, OTP and new password are required'
            }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'Password must be at least 6 characters long'
            }, { status: 400 });
        }

        const otpRecord = await OTP.findOne({
            mobileNumber,
            purpose: 'forgot_password',
            isUsed: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return NextResponse.json({
                success: false,
                message: 'Invalid or expired OTP'
            }, { status: 400 });
        }

        if (otpRecord.attempts >= 3) {
            return NextResponse.json({
                success: false,
                message: 'Too many failed attempts. Please request new OTP'
            }, { status: 400 });
        }

        // Validate OTP via MessageCentral
        const actualVerificationId = verificationId || otpRecord.verificationId;

        if (!actualVerificationId) {
            return NextResponse.json({
                success: false,
                message: 'Verification ID not found'
            }, { status: 400 });
        }

        const validationResult = await SMSService.validateOTP(actualVerificationId, otp);

        if (!validationResult.success) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return NextResponse.json({
                success: false,
                message: validationResult.message,
                errorCode: validationResult.errorCode
            }, { status: 400 });
        }

        const user = await User.findOne({ mobileNumber, isVerified: true });

        if (!user) {
            return NextResponse.json({
                success: false,
                message: 'User not found'
            }, { status: 404 });
        }

        user.password = newPassword;
        await user.save();

        otpRecord.isUsed = true;
        await otpRecord.save();

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
            provider: 'MessageCentral'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}