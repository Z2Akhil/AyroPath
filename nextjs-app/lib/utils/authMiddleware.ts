import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import User from '@/lib/models/User';
import dbConnect from '@/lib/db/mongoose';

export interface AuthenticatedRequest extends NextRequest {
    user?: any;
}

export async function authenticateUser(req: NextRequest) {
    try {
        await dbConnect();

        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.replace('Bearer', '').trim();

        if (!token) {
            return {
                authenticated: false,
                error: 'Access denied. No token provided',
                status: 401
            };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return {
                authenticated: false,
                error: 'Invalid token or user not found',
                status: 401
            };
        }

        if (!user.isActive) {
            return {
                authenticated: false,
                error: 'Invalid token or user not found',
                status: 401
            };
        }

        if (!user.isVerified) {
            return {
                authenticated: false,
                error: 'Please verify your mobile number first',
                status: 401
            };
        }

        return {
            authenticated: true,
            user
        };
    } catch (err) {
        return {
            authenticated: false,
            error: 'Invalid token',
            status: 401
        };
    }
}

export async function withAuth(
    req: NextRequest,
    handler: (req: NextRequest, user: any) => Promise<NextResponse>
) {
    const authResult = await authenticateUser(req);

    if (!authResult.authenticated) {
        return NextResponse.json(
            {
                success: false,
                message: authResult.error
            },
            { status: authResult.status }
        );
    }

    return await handler(req, authResult.user);
}
