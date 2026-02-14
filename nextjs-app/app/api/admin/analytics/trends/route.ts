import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const startTime = Date.now();
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    // Extract IP address and User-Agent for logging
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const period = searchParams.get('period') || 'daily';
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        console.log('Fetching analytics trends for admin:', auth.admin.name, { period, startDate: startDateParam, endDate: endDateParam });

        // Default date range: last 30 days
        const defaultEndDate = new Date();
        const defaultStartDate = new Date();
        defaultStartDate.setDate(defaultStartDate.getDate() - 30);

        const dateFilter = {
            $gte: startDateParam ? new Date(startDateParam) : defaultStartDate,
            $lte: endDateParam ? new Date(endDateParam) : defaultEndDate
        };

        // Determine date format for grouping
        let dateFormat;
        switch (period) {
            case 'daily':
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
                break;
            case 'weekly':
                dateFormat = { $dateToString: { format: '%Y-%W', date: '$createdAt' } };
                break;
            case 'monthly':
                dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
                break;
            default:
                dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        }

        // Get order trends
        const orderTrends = await Order.aggregate([
            {
                $match: {
                    createdAt: dateFilter
                }
            },
            {
                $group: {
                    _id: dateFormat,
                    date: { $first: '$createdAt' },
                    orderCount: { $sum: 1 },
                    revenue: { $sum: '$package.price' }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    orderCount: 1,
                    revenue: 1
                }
            }
        ]);

        // Get user signup trends
        const userTrends = await User.aggregate([
            {
                $match: {
                    createdAt: dateFilter
                }
            },
            {
                $group: {
                    _id: dateFormat,
                    date: { $first: '$createdAt' },
                    userCount: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    userCount: 1
                }
            }
        ]);

        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'ANALYTICS_TRENDS_FETCH',
            description: `Admin ${auth.admin.name} fetched analytics trends`,
            resource: 'analytics',
            endpoint: '/api/admin/analytics/trends',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 200,
            responseTime: Date.now() - startTime,
            metadata: {
                period,
                startDate: dateFilter.$gte,
                endDate: dateFilter.$lte
            }
        });

        return NextResponse.json({
            success: true,
            trends: {
                orderTrends,
                userTrends
            }
        });

    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        console.error('Analytics trends fetch error:', error);

        await AdminActivity.logActivity({
            adminId: auth.admin._id,
            sessionId: auth.session._id,
            action: 'ERROR',
            description: `Failed to fetch analytics trends: ${error.message}`,
            resource: 'analytics',
            endpoint: '/api/admin/analytics/trends',
            method: 'GET',
            ipAddress: ipAddress,
            userAgent: userAgent,
            statusCode: 500,
            responseTime: responseTime,
            errorMessage: error.message
        });

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch analytics trends'
        }, { status: 500 });
    }
}
