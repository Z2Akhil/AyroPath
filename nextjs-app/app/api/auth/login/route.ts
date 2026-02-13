import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import validator from 'validator';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json({
                success: false,
                message: 'Mobile number/email and password are required'
            }, { status: 400 });
        }

        const isMobileNumber = validator.isMobilePhone(identifier, 'any', { strictMode: false });
        const isEmail = validator.isEmail(identifier);

        if (!isMobileNumber && !isEmail) {
            return NextResponse.json({
                success: false,
                message: 'Please enter a valid mobile number or email address'
            }, { status: 400 });
        }

        const query: { mobileNumber?: string; email?: string; isVerified: boolean } = { isVerified: true };
        if (isMobileNumber) {
            query.mobileNumber = identifier;
        } else {
            query.email = identifier.toLowerCase();
        }

        const user = await User.findOne(query).select('+password');

        if (!user || !user.isActive) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        if (!user.password) {
            return NextResponse.json({
                success: false,
                message: 'Please login with your social account or complete registration'
            }, { status: 400 });
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                message: 'Invalid credentials'
            }, { status: 401 });
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        return NextResponse.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                email: user.email,
                isVerified: user.isVerified,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}