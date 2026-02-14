import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Test from '@/lib/models/Test';

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
        let startDate = new Date();

        switch (range) {
            case '7d': startDate.setDate(now.getDate() - 7); break;
            case '30d': startDate.setDate(now.getDate() - 30); break;
            case '90d': startDate.setDate(now.getDate() - 90); break;
            case '12m': startDate.setFullYear(now.getFullYear() - 1); break;
            default: startDate.setDate(now.getDate() - 30);
        }

        // Comparison period (previous same-length period)
        const periodMs = now.getTime() - startDate.getTime();
        const compareStartDate = new Date(startDate.getTime() - periodMs);

        // Fetch metrics for current and comparison periods
        const [
            currentRevenue,
            prevRevenue,
            currentOrders,
            prevOrders,
            currentUsers,
            prevUsers,
            activeTests
        ] = await Promise.all([
            // Current Revenue
            Order.aggregate([
                { $match: { 'payment.status': 'PAID', createdAt: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: '$payment.amount' } } }
            ]),
            // Previous Revenue
            Order.aggregate([
                { $match: { 'payment.status': 'PAID', createdAt: { $gte: compareStartDate, $lt: startDate } } },
                { $group: { _id: null, total: { $sum: '$payment.amount' } } }
            ]),
            // Current Orders
            Order.countDocuments({ createdAt: { $gte: startDate } }),
            // Previous Orders
            Order.countDocuments({ createdAt: { $gte: compareStartDate, $lt: startDate } }),
            // Current Users
            User.countDocuments({ createdAt: { $gte: startDate } }),
            // Previous Users
            User.countDocuments({ createdAt: { $gte: compareStartDate, $lt: startDate } }),
            // Active Tests
            Test.countDocuments({ isActive: true })
        ]);

        const curRev = currentRevenue[0]?.total || 0;
        const preRev = prevRevenue[0]?.total || 0;

        const calculateChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(((current - previous) / previous * 100).toFixed(1));
        };

        return NextResponse.json({
            success: true,
            overview: {
                totalRevenue: {
                    value: curRev,
                    change: calculateChange(curRev, preRev),
                    trend: curRev >= preRev ? 'up' : 'down'
                },
                totalOrders: {
                    value: currentOrders,
                    change: calculateChange(currentOrders, prevOrders),
                    trend: currentOrders >= prevOrders ? 'up' : 'down'
                },
                newUsers: {
                    value: currentUsers,
                    change: calculateChange(currentUsers, prevUsers),
                    trend: currentUsers >= prevUsers ? 'up' : 'down'
                },
                activeServices: {
                    value: activeTests,
                    change: 0, // Not really a time-series growth metric in the same sense
                    trend: 'up'
                }
            }
        });

    } catch (error: any) {
        console.error('Analytics Overview Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch analytics overview' }, { status: 500 });
    }
}
