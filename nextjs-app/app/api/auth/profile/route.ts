import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/utils/authMiddleware';

export async function GET(req: NextRequest) {
    return withAuth(req, async (req, user) => {
        try {
            return NextResponse.json({
                success: true,
                user: {
                    id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    mobileNumber: user.mobileNumber,
                    email: user.email,
                    isVerified: user.isVerified,
                    emailVerified: user.emailVerified,
                    authProvider: user.authProvider,
                    createdAt: user.createdAt,
                },
            });
        } catch (error) {
            console.error('Get profile error:', error);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Internal server error',
                },
                { status: 500 }
            );
        }
    });
}
