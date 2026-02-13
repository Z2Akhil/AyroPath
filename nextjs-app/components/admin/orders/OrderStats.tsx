import React from 'react';
import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import { OrderStats as IOrderStats } from '@/types/admin';

interface OrderStatsProps {
    stats: IOrderStats | null;
    loading: boolean;
}

const OrderStats: React.FC<OrderStatsProps> = ({ stats, loading }) => {
    if (loading || !stats) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                            <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const completedCount = stats.byCategorizedStatus?.COMPLETED || stats.byStatus?.COMPLETED || 0;
    const pendingCount = stats.byCategorizedStatus?.PENDING || stats.byStatus?.PENDING || 0;
    const failedCount = stats.byCategorizedStatus?.FAILED || stats.byStatus?.FAILED || 0;

    const cards = [
        {
            label: 'Total Orders',
            value: stats.totalOrders,
            icon: Package,
            color: 'text-blue-500',
            borderColor: 'border-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Completed',
            value: completedCount,
            icon: CheckCircle,
            color: 'text-green-500',
            borderColor: 'border-green-500',
            bgColor: 'bg-green-50'
        },
        {
            label: 'Pending',
            value: pendingCount,
            icon: Clock,
            color: 'text-yellow-500',
            borderColor: 'border-yellow-500',
            bgColor: 'bg-yellow-50',
        },
        {
            label: 'Failed',
            value: failedCount,
            icon: XCircle,
            color: 'text-red-500',
            borderColor: 'border-red-500',
            bgColor: 'bg-red-50'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${card.borderColor} transition-all hover:shadow-md`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        </div>
                        <div className={`${card.bgColor} p-3 rounded-lg`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                    </div>
                    {index === 0 && (
                        <div className="mt-2">
                            <span className="text-xs text-green-600 font-medium">+{stats.todaysOrders} today</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default OrderStats;
