import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email, OTP and new password are required',
                },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                },
                { status: 400 }
            );
        }

        const otpRecord = await OTP.findOne({
            email,
            purpose: 'forgot_password_email',
            isUsed: false,
            expiresAt: { $gt: new Date() },
        }).sort({ createdAt: -1 });

        if (!otpRecord) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired OTP',
                },
                { status: 400 }
            );
        }

        if (otpRecord.attempts >= 3) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Too many failed attempts. Please request new OTP',
                },
                { status: 400 }
            );
        }

        if (otpRecord.otp !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();

            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid OTP',
                },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email, authProvider: 'local' });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User not found',
                },
                { status: 404 }
            );
        }

        otpRecord.isUsed = true;
        await otpRecord.save();

        user.password = newPassword;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('Reset password email error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
