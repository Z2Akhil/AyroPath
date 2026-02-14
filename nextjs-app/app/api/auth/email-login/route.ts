import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email and password are required',
                },
                { status: 400 }
            );
        }

        const user = await User.findOne({
            email,
            authProvider: 'local',
            isActive: true,
        }).select('+password');

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid credentials',
                },
                { status: 401 }
            );
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Invalid credentials',
                },
                { status: 401 }
            );
        }

        if (!user.emailVerified) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Email not verified',
                    code: 'EMAIL_NOT_VERIFIED',
                    email: user.email
                },
                { status: 403 }
            );
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
        );


        return NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isVerified: user.isVerified,
                emailVerified: user.emailVerified,
                authProvider: user.authProvider,
            },
        });
    } catch (err) {
        console.error('Email login error:', err);
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
