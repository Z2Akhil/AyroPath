import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Notification from '@/lib/models/Notification';
import AdminActivity from '@/lib/models/AdminActivity';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();
        const { id } = await params;
        const startTime = Date.now();

        const notification = await Notification.findById(id);

        if (!notification) {
            return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
        }

        const failedRecipients = notification.recipients.filter((r: any) => r.status === 'failed');

        if (failedRecipients.length === 0) {
            return NextResponse.json({ success: false, error: 'No failed recipients to retry' }, { status: 400 });
        }

        // Mark failed as pending for retry
        await Notification.findByIdAndUpdate(id, {
            $set: {
                'recipients.$[elem].status': 'pending',
                status: 'pending'
            }
        }, {
            arrayFilters: [{ 'elem.status': 'failed' }]
        });

        // Simulate retry process
        setTimeout(async () => {
            try {
                await connectDB();
                await Notification.findByIdAndUpdate(id, {
                    $set: {
                        'recipients.$[elem].status': 'delivered',
                        'recipients.$[elem].sentAt': new Date(),
                        status: 'completed'
                    },
                    $inc: {
                        deliveredCount: failedRecipients.length,
                        failedCount: -failedRecipients.length
                    }
                }, {
                    arrayFilters: [{ 'elem.status': 'pending' }]
                });
            } catch (err) {
                console.error('Async retry simulation error:', err);
            }
        }, 2000);

        const responseTime = Date.now() - startTime;

        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'NOTIFICATIONS_RETRY',
            description: `Retried failed deliveries for notification: "${notification.subject}" (${failedRecipients.length} users)`,
            resource: 'notifications',
            resourceId: id,
            endpoint: `/api/admin/notifications/${id}/retry-failed`,
            method: 'POST',
            statusCode: 200,
            responseTime,
            metadata: { notificationId: id, retryCount: failedRecipients.length }
        });

        return NextResponse.json({
            success: true,
            message: `Retry initiated for ${failedRecipients.length} failed recipients`
        });

    } catch (error: any) {
        console.error('Retry Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to initiate retry' }, { status: 500 });
    }
}
