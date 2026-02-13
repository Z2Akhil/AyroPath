import { NextRequest, NextResponse } from 'next/server';
import AdminSession, { AdminSessionDocument } from './models/AdminSession';
import Admin, { AdminDocument } from './models/Admin';
import AdminActivity from './models/AdminActivity';
import connectToDatabase from './db/mongoose';

export type AdminAuthResult =
    | { authenticated: false; error: string; status: number; session?: undefined; admin?: undefined }
    | { authenticated: true; session: AdminSessionDocument; admin: AdminDocument; error?: undefined; status?: undefined };

export async function adminAuth(req: NextRequest): Promise<AdminAuthResult> {
    await connectToDatabase();
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return { authenticated: false, error: 'API key is required', status: 401 };
    }

    const session = await AdminSession.findOne({ thyrocareApiKey: apiKey, isActive: true }).populate('adminId');

    if (!session || !session.isValid()) {
        return { authenticated: false, error: 'Invalid or expired API key', status: 401 };
    }

    return {
        authenticated: true,
        session,
        admin: session.adminId as unknown as AdminDocument
    };
}

export async function withAdminAuth(req: NextRequest, handler: (req: NextRequest, session: any) => Promise<NextResponse>) {
    const { session, error, status } = await adminAuth(req);
    if (error) {
        return NextResponse.json({ success: false, error }, { status });
    }
    return await handler(req, session);
}
