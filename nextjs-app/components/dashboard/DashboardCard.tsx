'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowRight,
    Package,
    BarChart3,
    Bell,
    Users,
    Package2,
    Server
} from 'lucide-react';

interface DashboardCardProps {
    title: string;
    description: string;
    data?: any[];
    viewMoreUrl?: string;
    icon?: string;
    stats?: Record<string, any> | null;
    children?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
    title,
    description,
    data,
    viewMoreUrl,
    icon = 'package',
    stats = null,
    children
}) => {
    const router = useRouter();

    const getIcon = () => {
        switch (icon) {
            case 'orders':
            case 'package':
                return <Package className="h-6 w-6 text-blue-600" />;
            case 'analytics':
            case 'chart':
                return <BarChart3 className="h-6 w-6 text-green-600" />;
            case 'notifications':
            case 'bell':
                return <Bell className="h-6 w-6 text-yellow-600" />;
            case 'users':
                return <Users className="h-6 w-6 text-purple-600" />;
            case 'products':
            case 'package2':
                return <Package2 className="h-6 w-6 text-indigo-600" />;
            case 'system':
            case 'server':
                return <Server className="h-6 w-6 text-gray-600" />;
            default:
                return <Package className="h-6 w-6 text-blue-600" />;
        }
    };

    const handleViewMore = () => {
        if (viewMoreUrl) {
            // Convert relative MERN paths to Next.js paths if needed
            let targetUrl = viewMoreUrl;
            if (!targetUrl.startsWith('/admin')) {
                targetUrl = `/admin/${targetUrl}`;
            }
            router.push(targetUrl);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
            {/* Card Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                        {getIcon()}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{description}</p>
                    </div>
                </div>
            </div>

            {/* Stats Display (if provided) */}
            {stats && (
                <div className="mb-4 grid grid-cols-2 gap-3">
                    {Object.entries(stats).map(([key, value]) => (
                        <div key={key} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-2xl font-bold text-gray-800">{String(value)}</div>
                            <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Data List (if provided) */}
            {data && Array.isArray(data) && data.length > 0 && (
                <div className="mb-4 space-y-3">
                    {data.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div className="flex-1">
                                <div className="font-medium text-gray-700 truncate max-w-[180px]">
                                    {item.name || item.title || item.customer || item.id || `Item ${index + 1}`}
                                </div>
                                <div className="text-sm text-gray-500 flex items-center space-x-2">
                                    {item.status && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === 'COMPLETED' || item.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                            item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                item.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.status}
                                        </span>
                                    )}
                                    {item.date && (
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                    )}
                                </div>
                            </div>
                            {item.amount && (
                                <div className="font-semibold text-gray-800">
                                    ₹{item.amount.toLocaleString()}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Custom Children Content */}
            {children}

            {/* View More Button */}
            {viewMoreUrl && (
                <button
                    onClick={handleViewMore}
                    className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 font-medium"
                >
                    <span>View More</span>
                    <ArrowRight className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

export default DashboardCard;
