import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';

export async function GET(req: NextRequest) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const searchParams = req.nextUrl.searchParams;
        const range = searchParams.get('range') || '30d';

        const now = new Date();
        now.setHours(23, 59, 59, 999);
        let startDate = new Date();

        switch (range) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            case '12m': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 30);
        }
        startDate.setHours(0, 0, 0, 0);

        // Fetch data for trends
        const [revenueTrends, orderTrends, userTrends] = await Promise.all([
            // Revenue Trends
            Order.aggregate([
                { $match: { 'payment.status': 'PAID', createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        value: { $sum: '$payment.amount' }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // Order Trends
            Order.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // User Trends
            User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        // Helper to fill missing dates with 0
        const fillDates = (data: any[], start: Date, end: Date) => {
            const result = [];
            const current = new Date(start);
            const dataMap = new Map(data.map(item => [item._id, item.value]));

            while (current <= end) {
                const dateStr = current.toISOString().split('T')[0];
                result.push({
                    date: dateStr,
                    value: dataMap.get(dateStr) || 0
                });
                current.setDate(current.getDate() + 1);
            }
            return result;
        };

        return NextResponse.json({
            success: true,
            trends: {
                revenue: fillDates(revenueTrends, startDate, now),
                orders: fillDates(orderTrends, startDate, now),
                users: fillDates(userTrends, startDate, now)
            }
        });

    } catch (error: any) {
        console.error('Analytics Trends Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics trends' }, { status: 500 });
    }
}
