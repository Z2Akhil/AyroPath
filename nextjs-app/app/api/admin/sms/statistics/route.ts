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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        console.log('📊 Fetching SMS statistics', { startDate, endDate });

        const stats = await SMSHistory.getStatistics(startDate, endDate);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'SMS_STATISTICS_FETCH',
            description: `Admin ${auth.admin?.name || 'Unknown'} fetched SMS statistics`,
            resource: 'sms',
            endpoint: '/api/admin/sms/statistics',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                totalSMS: stats.totalSMS,
                totalCost: stats.totalCost,
                startDate,
                endDate,
            },
        });

        return NextResponse.json({
            success: true,
            statistics: stats,
            message: 'SMS statistics fetched successfully',
        });
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('❌ SMS statistics fetch failed:', error.message);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ERROR',
            description: `Failed to fetch SMS statistics: ${error.message}`,
            resource: 'sms',
            endpoint: '/api/admin/sms/statistics',
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
                error: 'Failed to fetch SMS statistics',
                details: error.message,
            },
            { status: 500 }
        );
    }
}