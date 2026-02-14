import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import EmailService from '@/lib/services/emailService';

export async function POST(req: NextRequest) {
    try {
        await dbConnect();

        const { firstName, lastName, email, password } = await req.json();

        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'All fields are required (firstName, lastName, email, password)',
                },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'Password must be at least 6 characters long',
                },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User with this email already exists',
                },
                { status: 400 }
            );
        }

        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            isVerified: true,
            authProvider: 'local',
        });

        EmailService.sendWelcomeEmail(email, firstName).catch(err => {
            console.error('Failed to send welcome email:', err);
        });

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET as string,
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as string }
        );


        return NextResponse.json({
            success: true,
            message: 'Registration successful',
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
    } catch (err: any) {
        console.error('Email registration error:', err);
        if (err.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'User with this email already exists',
                },
                { status: 400 }
            );
        }
        return NextResponse.json(
            {
                success: false,
                message: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
