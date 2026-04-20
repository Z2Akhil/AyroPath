import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import OTP from '@/lib/models/OTP';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();

        const { firstName, lastName, mobileNumber, password, email } = await req.json();

        if (!firstName || !lastName || !mobileNumber || !password) {
            return NextResponse.json({
                success: false,
                message: 'All fields are required (firstName, lastName, mobileNumber, password)'
            }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({
                success: false,
                message: 'Password must be at least 6 characters long'
            }, { status: 400 });
        }

        let user = await User.findOne({ mobileNumber });

        if (!user) {
            // Check if OTP was verified
            const otpRecord = await OTP.findOne({ 
                mobileNumber, 
                purpose: 'verification', 
                isUsed: true 
            }).sort({ createdAt: -1 });

            if (!otpRecord) {
                return NextResponse.json({
                    success: false,
                    message: 'Mobile number not verified. Please verify OTP first.'
                }, { status: 400 });
            }

            user = new User({
                firstName,
                lastName,
                mobileNumber,
                password,
                isVerified: true
            });

            if (email) {
                const emailExists = await User.findOne({ email });
                if (emailExists) {
                    return NextResponse.json({
                        success: false,
                        message: 'Email is already in use by another account'
                    }, { status: 400 });
                }
                user.email = email;
            }
            
            await user.save();
        } else {
            if (user.isVerified && user.password) {
                return NextResponse.json({
                    success: false,
                    message: 'User with this mobile number already exists.'
                }, { status: 400 });
            }

            user.firstName = firstName;
            user.lastName = lastName;
            user.password = password;
            user.isVerified = true;
            user.updatedAt = new Date();

            if (email) {
                const emailExists = await User.findOne({ email });
                if (emailExists && emailExists._id.toString() !== user._id.toString()) {
                    return NextResponse.json({
                        success: false,
                        message: 'Email is already in use by another account'
                    }, { status: 400 });
                }
                user.email = email;
            }

            await user.save();
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'] }
        );

        return NextResponse.json({
            success: true,
            message: 'Registration completed successfully',
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                mobileNumber: user.mobileNumber,
                isVerified: user.isVerified,
                email: user.email,
                emailVerified: user.emailVerified
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({
            success: false,
            message
        }, { status: 500 });
    }
}