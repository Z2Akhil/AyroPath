import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth';
import connectDB from '@/lib/db/mongoose';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Test from '@/lib/models/Test';
import Offer from '@/lib/models/Offer';
import AdminActivity from '@/lib/models/AdminActivity';

export async function GET(req: NextRequest) {
    const auth = await adminAuth(req);

    if (!auth.authenticated) {
        return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }

    try {
        await connectDB();

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        // Fetch data in parallel
        const [
            totalOrders,
            pendingOrders,
            todaysOrders,
            totalUsers,
            newUsers30Days,
            recentOrders,
            recentUsers,
            recentActivity,
            totalActivity,
            activeTests,
            totalTests,
            activeOffers,
            totalOffers,
            revenueData
        ] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ status: { $in: ['PENDING', 'CREATED'] } }),
            Order.countDocuments({ createdAt: { $gte: today } }),
            User.countDocuments(),
            User.countDocuments({ createdAt: { $gte: last30Days } }),
            Order.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'firstName lastName').lean(),
            User.find().sort({ createdAt: -1 }).limit(5).lean(),
            AdminActivity.find().sort({ createdAt: -1 }).limit(5).lean(),
            AdminActivity.countDocuments(),
            Test.countDocuments({ isActive: true }),
            Test.countDocuments(),
            Offer.countDocuments({ isActive: true }),
            Offer.countDocuments(),
            Order.aggregate([
                { $match: { 'payment.status': 'PAID' } },
                { $group: { _id: null, totalRevenue: { $sum: '$payment.amount' } } }
            ])
        ]);

        const totalRevenue = revenueData[0]?.totalRevenue || 0;
        const conversionRate = totalOrders > 0 ? ((totalOrders - pendingOrders) / totalOrders * 100).toFixed(1) + '%' : '0%';

        const dashboard = {
            orders: {
                title: 'Orders Overview',
                description: 'Manage and track customer diagnostic orders',
                data: recentOrders.map((o: any) => ({
                    id: o.orderId,
                    customer: `${o.userId?.firstName || ''} ${o.userId?.lastName || ''}`.trim() || 'Unknown',
                    amount: o.package?.price || 0,
                    status: o.status,
                    date: o.createdAt
                })),
                viewMoreUrl: 'orders',
                total: totalOrders,
                pending: pendingOrders,
                todays: todaysOrders
            },
            analytics: {
                title: 'Business Analytics',
                description: 'Performance metrics and revenue growth',
                viewMoreUrl: 'analytics',
                data: {
                    totalRevenue,
                    totalOrders,
                    totalUsers,
                    conversionRate
                }
            },
            notifications: {
                title: 'Recent Activity',
                description: 'Latest administrative actions and system events',
                data: recentActivity.map((a: any) => ({
                    title: a.action,
                    description: a.description,
                    date: a.createdAt,
                    status: a.statusCode === 200 ? 'SUCCESS' : 'FAILED'
                })),
                viewMoreUrl: 'notifications',
                total: totalActivity
            },
            users: {
                title: 'User Management',
                description: 'Monitor customer registration and engagement',
                data: recentUsers.map((u: any) => ({
                    name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Guest User',
                    status: u.isActive ? 'COMPLETED' : 'PENDING',
                    date: u.createdAt
                })),
                viewMoreUrl: 'users',
                total: totalUsers,
                newLast30Days: newUsers30Days
            },
            products: {
                title: 'Service Catalog',
                description: 'Diagnostic tests and special health offers',
                viewMoreUrl: 'tests', // Default to tests
                totalTests,
                tests: Array(activeTests).fill({}), // Placeholder array for count display in card
                totalOffers,
                offers: Array(activeOffers).fill({})
            },
            system: {
                title: 'System Health',
                description: 'Infrastructure status and background jobs',
                viewMoreUrl: 'settings', // System often maps to settings
                data: {
                    uptime: process.uptime(),
                    todaysOrders,
                    pendingOrders
                }
            }
        };

        return NextResponse.json({
            success: true,
            dashboard
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
