import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import OTPGenerator from '@/lib/utils/otpGenerator';
import EmailService from '@/lib/services/emailService';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email is required',
                },
                { status: 400 }
            );
        }

        const user = await User.findOne({ email, authProvider: 'local' });

        if (!user) {
            return NextResponse.json({
                success: true,
                message: 'If an account with that email exists, a password reset OTP has been sent',
            });
        }

        const otp = OTPGenerator.generateOTP();
        const expiresAt = OTPGenerator.getExpiryTime();

        await OTP.create({
            email,
            otp,
            purpose: 'forgot_password_email',
            expiresAt,
        });

        const emailResult = await EmailService.sendEmailOTP(email, otp, 'Password Reset');

        if (!emailResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Failed to send OTP email',
                },
                { status: 500 }
            );
        }

        const responseData: any = {
            success: true,
            message: 'If an account with that email exists, a password reset OTP has been sent',
        };

        if (process.env.NODE_ENV === 'development' || !process.env.SMTP_HOST || process.env.SMTP_HOST === 'your-smtp-host') {
            responseData.devMode = true;
            responseData.otp = otp;
            responseData.message = 'OTP logged to console (development mode)';
        }

        return NextResponse.json(responseData);
    } catch (error) {
        console.error('Forgot password email error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
