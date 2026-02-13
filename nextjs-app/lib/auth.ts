import { NextRequest, NextResponse } from 'next/server';
import AdminSession from './models/AdminSession';
import Admin from './models/Admin';
import AdminActivity from './models/AdminActivity';
import connectToDatabase from './db/mongoose';

export async function adminAuth(req: NextRequest) {
    await connectToDatabase();
    const apiKey = req.headers.get('x-api-key');

    if (!apiKey) {
        return { error: 'API key is required', status: 401 };
    }

    const session = await AdminSession.findOne({ thyrocareApiKey: apiKey, isActive: true }).populate('adminId');

    if (!session || !session.isValid()) {
        return { error: 'Invalid or expired API key', status: 401 };
    }

    return { session, admin: session.adminId };
}

export async function withAdminAuth(req: NextRequest, handler: (req: NextRequest, session: any) => Promise<NextResponse>) {
    const { session, error, status } = await adminAuth(req);
    if (error) {
        return NextResponse.json({ success: false, error }, { status });
    }
    return await handler(req, session);
}
