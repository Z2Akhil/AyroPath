import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db/mongoose';
import User from '@/lib/models/User';
import { generateToken } from '@/lib/utils/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, mobileNumber, email, password } = body;

    if (!firstName || !lastName || !mobileNumber || !password) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser?.isVerified && existingUser?.password) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }

    let user;
    if (existingUser) {
      user = await User.findOneAndUpdate(
        { mobileNumber },
        { firstName, lastName, password, isVerified: true, email },
        { new: true }
      );
    } else {
      user = await User.create({
        firstName,
        lastName,
        mobileNumber,
        email,
        password,
        isVerified: true,
      });
    }

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json(
        { success: false, message: 'User already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Registration failed' },
      { status: 500 }
    );
  }
}