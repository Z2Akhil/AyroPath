import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    trend?: number;
    subtitle?: string;
    icon: LucideIcon;
    loading?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    trend,
    subtitle,
    icon: Icon,
    loading = false,
}) => {
    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 w-10 bg-gray-100 rounded-lg"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-100 rounded w-32"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900">{value}</h3>

                    {(trend !== undefined || subtitle) && (
                        <div className="mt-2 flex items-center gap-2">
                            {trend !== undefined && (
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {trend >= 0 ? '+' : ''}{trend}%
                                </span>
                            )}
                            {subtitle && (
                                <span className="text-xs text-gray-500">{subtitle}</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                    <Icon className="h-6 w-6 text-blue-600" />
                </div>
            </div>
        </div>
    );
};

export default MetricCard;
