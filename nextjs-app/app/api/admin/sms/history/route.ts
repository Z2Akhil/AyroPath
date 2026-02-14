import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import SMSHistory from '@/lib/models/SMSHistory';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const mobileNumber = searchParams.get('mobileNumber');
        const status = searchParams.get('status');
        const messageType = searchParams.get('messageType');
        const purpose = searchParams.get('purpose');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('📋 Fetching SMS history with filters:', {
            page,
            limit,
            mobileNumber,
            status,
            messageType,
            purpose,
            startDate,
            endDate,
        });

        const filters = {
            mobileNumber: mobileNumber || undefined,
            status: status || undefined,
            messageType: messageType || undefined,
            purpose: purpose || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };

        const result = await SMSHistory.getPaginatedHistory(page, limit, filters);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'SMS_HISTORY_FETCH',
            description: `Admin ${auth.admin?.name || 'Unknown'} fetched SMS history`,
            resource: 'sms',
            endpoint: '/api/admin/sms/history',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                page,
                limit,
                totalRecords: result.pagination.totalCount,
                filters,
            },
        });

        return NextResponse.json({
            success: true,
            data: result.records,
            pagination: result.pagination,
            message: 'SMS history fetched successfully',
        });
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('❌ SMS history fetch failed:', error.message);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ERROR',
            description: `Failed to fetch SMS history: ${error.message}`,
            resource: 'sms',
            endpoint: '/api/admin/sms/history',
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
                error: 'Failed to fetch SMS history',
                details: error.message,
            },
            { status: 500 }
        );
    }
}