import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Verification token is required',
                },
                { status: 400 }
            );
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid or expired verification token',
                },
                { status: 400 }
            );
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
