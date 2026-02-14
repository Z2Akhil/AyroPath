import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/models/Notification';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'name')
                .lean(),
            Notification.countDocuments()
        ]);

        return NextResponse.json({
            success: true,
            data: notifications,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error: any) {
        console.error('Fetch Notifications Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch notification history' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const startTime = Date.now();

        const body = await req.json();
        const { subject, content, emailType, userIds } = body;

        if (!subject || !content || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ success: false, error: 'Subject, content, and at least one recipient are required' }, { status: 400 });
        }

        // Create the notification record
        const notification = new Notification({
            subject,
            content,
            emailType: emailType || 'promotional',
            recipients: userIds.map(id => ({
                userId: id,
                status: 'pending'
            })),
            recipientCount: userIds.length,
            createdBy: auth.admin._id,
            status: 'pending'
        });

        await notification.save();

        // Simulate sending process (in a real app, this would be a background job)
        // Here we'll just mark them as delivered for demonstration in the new UI
        setTimeout(async () => {
            try {
                await connectDB();
                await Notification.findByIdAndUpdate(notification._id, {
                    $set: {
                        'recipients.$[].status': 'delivered',
                        'recipients.$[].sentAt': new Date(),
                        deliveredCount: userIds.length,
                        status: 'completed'
                    }
                });
            } catch (err) {
                console.error('Async send simulation error:', err);
            }
        }, 2000);

        const responseTime = Date.now() - startTime;

        // Log the administrative action
        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'NOTIFICATIONS_SEND',
            description: `Sent ${emailType || 'promotional'} notification: "${subject}" to ${userIds.length} users`,
            resource: 'notifications',
            resourceId: notification._id,
            endpoint: '/api/admin/notifications',
            method: 'POST',
            statusCode: 201,
            responseTime,
            metadata: { subject, recipientCount: userIds.length }
        });

        return NextResponse.json({
            success: true,
            message: 'Notification queued for delivery',
            notificationId: notification._id
        }, { status: 201 });

    } catch (error: any) {
        console.error('Send Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }
}
