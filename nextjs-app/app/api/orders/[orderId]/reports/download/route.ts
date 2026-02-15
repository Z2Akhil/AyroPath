import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

// Helper to get user from token
const getUserFromToken = async (token: string | null) => {
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.isActive && user.isVerified) {
            return user;
        }
    } catch {
        // Invalid token
    }
    return null;
};

// GET /api/orders/[orderId]/reports/download - Download report for order
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ orderId: string }> }
) {
    try {
        await connectToDatabase();

        const token = req.headers.get('authorization')?.replace('Bearer', '').trim() || null;
        const user = await getUserFromToken(token);

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { orderId } = await params;
        const { searchParams } = new URL(req.url);
        const beneficiaryIndex = parseInt(searchParams.get('beneficiaryIndex') || '0');

        const order = await Order.findOne({ orderId });

        if (!order) {
            return NextResponse.json(
                { success: false, message: 'Order not found' },
                { status: 404 }
            );
        }

        // Check permissions - only order owner can download reports
        if (order.userId.toString() !== user._id.toString()) {
            return NextResponse.json(
                { success: false, message: 'Access denied' },
                { status: 403 }
            );
        }

        // Check if order is DONE/COMPLETED
        if (order.thyrocare?.status !== 'DONE' && order.status !== 'COMPLETED') {
            return NextResponse.json({
                success: false,
                message: 'Reports are only available for completed orders'
            }, { status: 400 });
        }

        // Check if reports exist
        if (!order.reports || order.reports.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No reports available for this order'
            }, { status: 404 });
        }

        // Get the specific report (default to first one)
        if (beneficiaryIndex < 0 || beneficiaryIndex >= order.reports.length) {
            return NextResponse.json({
                success: false,
                message: `Invalid beneficiary index. Valid range: 0-${order.reports.length - 1}`
            }, { status: 400 });
        }

        const report = order.reports[beneficiaryIndex];

        // Check if report URL exists
        if (!report.reportUrl) {
            return NextResponse.json({
                success: false,
                message: 'Report URL not available'
            }, { status: 404 });
        }

        // Mark report as downloaded
        await order.markReportDownloaded(report.leadId);

        // Return report download information
        return NextResponse.json({
            success: true,
            message: 'Report download initiated',
            data: {
                orderId: order.orderId,
                beneficiaryName: report.beneficiaryName,
                reportUrl: report.reportUrl,
                downloadUrl: report.reportUrl, // Direct URL for frontend to use
                instructions: 'Click the download button to open the report in a new tab'
            }
        });

    } catch (error: any) {
        console.error('Error downloading report:', error);
        const message = error instanceof Error ? error.message : 'Failed to download report';
        return NextResponse.json({ success: false, message }, { status: 500 });
    }
}
