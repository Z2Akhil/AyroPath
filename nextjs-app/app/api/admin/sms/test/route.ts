import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import AdminActivity from '@/lib/models/AdminActivity';
import SMSService from '@/lib/services/smsService';
import { generateOTP } from '@/lib/utils/otp';

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        const body = await req.json();
        const { mobileNumber, message, messageType = 'notification' } = body;

        if (!mobileNumber || !message) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Mobile number and message are required',
                },
                { status: 400 }
            );
        }

        console.log('📱 Admin sending test SMS:', { mobileNumber, messageType });

        let result;
        if (messageType === 'otp') {
            const otp = generateOTP();
            result = await SMSService.sendOTP(mobileNumber, otp, { purpose: 'test' });
        } else {
            result = await SMSService.sendOTP(mobileNumber, message, { purpose: 'test' });
        }

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'TEST_SMS_SEND',
            description: `Admin ${auth.admin?.name || 'Unknown'} sent test SMS to ${mobileNumber}`,
            resource: 'sms',
            endpoint: '/api/admin/sms/test',
            method: 'POST',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                mobileNumber,
                messageType,
                success: result.success,
                requestId: result.verificationId,
            },
        });

        return NextResponse.json({
            success: true,
            result,
            message: 'Test SMS sent successfully',
        });
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('❌ Test SMS send failed:', error.message);

        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ERROR',
            description: `Failed to send test SMS: ${error.message}`,
            resource: 'sms',
            endpoint: '/api/admin/sms/test',
            method: 'POST',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message,
        });

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to send test SMS',
                details: error.message,
            },
            { status: 500 }
        );
    }
}