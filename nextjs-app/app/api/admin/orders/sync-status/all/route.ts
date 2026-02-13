import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import { OrderStatusSyncService } from '@/lib/services/orderStatusSync';
import AdminActivity from '@/lib/models/AdminActivity';

export async function POST(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const result = await OrderStatusSyncService.syncAllOrdersStatus();

        // Log activity
        await AdminActivity.logActivity({
            adminId: auth.admin?._id,
            sessionId: auth.session?._id,
            action: 'ORDER_STATUS_SYNC',
            description: `Admin synced status for all orders`,
            resource: 'orders',
            endpoint: '/api/admin/orders/sync-status/all',
            method: 'POST',
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
            userAgent: req.headers.get('user-agent') || 'unknown',
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                total: result.total,
                successful: result.successful,
                failed: result.failed,
                statusChanged: result.statusChanged
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Order status sync completed',
            ...result
        });

    } catch (error: any) {
        console.error('Batch order status sync error:', error);
        return NextResponse.json({ success: false, error: 'Failed to sync all orders status' }, { status: 500 });
    }
}
