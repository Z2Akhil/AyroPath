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
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const query: any = {};
        if (status && status !== 'all') {
            query.status = status;
        }
        if (search) {
            query.subject = { $regex: search, $options: 'i' };
        }

        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'name')
                .lean(),
            Notification.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            notifications,
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

        // Debug logging to identify the issue
        console.log('📧 Notification POST Request:', {
            subject: subject ? `"${subject.substring(0, 30)}..."` : 'MISSING',
            content: content ? `"${content.substring(0, 30)}..."` : 'MISSING',
            emailType: emailType || 'MISSING',
            userIdsCount: userIds?.length || 0,
            userIdsIsArray: Array.isArray(userIds)
        });

        // Validate required fields with detailed error messages
        if (!subject || subject.trim() === '') {
            console.error('❌ Validation failed: Subject is missing or empty');
            return NextResponse.json({ success: false, error: 'Subject is required' }, { status: 400 });
        }

        if (!content || content.trim() === '') {
            console.error('❌ Validation failed: Content is missing or empty');
            return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 });
        }

        if (!userIds || !Array.isArray(userIds)) {
            console.error('❌ Validation failed: userIds is not an array:', userIds);
            return NextResponse.json({ success: false, error: 'Recipients must be an array' }, { status: 400 });
        }

        if (userIds.length === 0) {
            console.error('❌ Validation failed: userIds array is empty');
            return NextResponse.json({ success: false, error: 'At least one recipient is required' }, { status: 400 });
        }

        // Get users with their emails
        const users = await User.find({
            _id: { $in: userIds },
            email: { $exists: true, $ne: null }
        }).select('_id email firstName lastName');

        if (users.length === 0) {
            return NextResponse.json({ success: false, error: 'No valid users found with email addresses' }, { status: 400 });
        }

        // Create the notification record
        const notification = new Notification({
            subject,
            content,
            emailType: emailType || 'promotional',
            recipients: users.map(user => ({
                userId: user._id,
                email: user.email,
                status: 'pending'
            })),
            totalRecipients: users.length,
            recipientCount: users.length,
            createdBy: auth.admin._id,
            status: 'sending',
            startedAt: new Date()
        });

        await notification.save();

        // Actually send emails using the email service
        const emailService = (await import('@/lib/services/emailService')).default;

        const sendResults = await Promise.allSettled(
            users.map(async (user) => {
                const userFullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User';
                const result = await emailService.sendNotificationEmail(
                    user.email as string,
                    subject,
                    content,
                    emailType || 'promotional',
                    { firstName: user.firstName || 'User', name: userFullName }
                );
                return {
                    userId: user._id,
                    email: user.email,
                    success: result.success,
                    messageId: result.messageId,
                    error: result.error
                };
            })
        );

        // Process results and update recipients
        let sentCount = 0;
        let failedCount = 0;
        const updatedRecipients = notification.recipients.map((recipient: any) => {
            const resultIndex = users.findIndex(u => u._id.toString() === recipient.userId.toString());
            if (resultIndex === -1) return recipient;

            const sendResult = sendResults[resultIndex];
            if (sendResult.status === 'fulfilled' && sendResult.value.success) {
                sentCount++;
                return {
                    ...recipient.toObject(),
                    status: 'sent',
                    sentAt: new Date(),
                    messageId: sendResult.value.messageId
                };
            } else {
                failedCount++;
                const errorMsg = sendResult.status === 'rejected'
                    ? sendResult.reason?.message
                    : sendResult.value?.error;
                return {
                    ...recipient.toObject(),
                    status: 'failed',
                    error: errorMsg || 'Unknown error'
                };
            }
        });

        // Determine final notification status
        let finalStatus: 'completed' | 'partial' | 'failed';
        if (sentCount === users.length) {
            finalStatus = 'completed';
        } else if (sentCount > 0) {
            finalStatus = 'partial';
        } else {
            finalStatus = 'failed';
        }

        // Update the notification with results
        notification.recipients = updatedRecipients as any;
        notification.sentCount = sentCount;
        notification.deliveredCount = sentCount; // Assuming sent = delivered for now
        notification.failedCount = failedCount;
        notification.status = finalStatus;
        notification.completedAt = new Date();
        await notification.save();

        const responseTime = Date.now() - startTime;

        // Log the administrative action
        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'NOTIFICATIONS_SEND',
            description: `Sent ${emailType || 'promotional'} notification: "${subject}" to ${users.length} users (${sentCount} successful, ${failedCount} failed)`,
            resource: 'notifications',
            resourceId: notification._id,
            endpoint: '/api/admin/notifications',
            method: 'POST',
            statusCode: 201,
            responseTime,
            metadata: {
                subject,
                recipientCount: users.length,
                sentCount,
                failedCount,
                status: finalStatus
            }
        });

        return NextResponse.json({
            success: true,
            message: sentCount === users.length
                ? `Notification sent successfully to all ${sentCount} recipients`
                : sentCount > 0
                    ? `Notification partially sent: ${sentCount} succeeded, ${failedCount} failed`
                    : `Failed to send notification to all ${failedCount} recipients`,
            notificationId: notification._id,
            stats: {
                total: users.length,
                sent: sentCount,
                failed: failedCount,
                status: finalStatus
            }
        }, { status: 201 });

    } catch (error: any) {
        console.error('Send Notification Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }
}

