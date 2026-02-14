import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import SMSHistory from '@/lib/models/SMSHistory';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';
    const { id } = await params;


    try {
        await connectDB();

        console.log('🔍 Fetching SMS details for ID:', id);

        const smsRecord = await SMSHistory.findById(id);

        if (!smsRecord) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'SMS record not found',
                },
                { status: 404 }
            );
        }

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'SMS_DETAILS_FETCH',
            description: `Admin ${auth.admin?.name || 'Unknown'} fetched SMS details for ID: ${id}`,
            resource: 'sms',
            endpoint: `/api/admin/sms/history/${id}`,
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                smsId: id,
                mobileNumber: smsRecord.mobileNumber,
                status: smsRecord.status,
            },
        });

        return NextResponse.json({
            success: true,
            data: smsRecord,
            message: 'SMS details fetched successfully',
        });
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('❌ SMS details fetch failed:', error.message);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ERROR',
            description: `Failed to fetch SMS details: ${error.message}`,
            resource: 'sms',
            endpoint: `/api/admin/sms/history/${id}`,
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message,
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch SMS details',
                details: error.message,
            },
            { status: 500 }
        );
    }
}