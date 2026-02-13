import React, { useState } from 'react';
import {
    ChevronDown, ChevronUp, Package, User, CheckCircle, Truck, Users,
    Copy, RefreshCw
} from 'lucide-react';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { AdminOrder } from '@/types/admin';

interface OrderAccordionProps {
    order: AdminOrder | null;
    loading: boolean;
    error: string;
    onRetry: () => void;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
}

const OrderAccordion: React.FC<OrderAccordionProps> = ({
    order,
    loading,
    error,
    onRetry,
    isExpanded,
    onToggle,
    onRefresh
}) => {
    const [refreshing, setRefreshing] = useState(false);
    const [refreshError, setRefreshError] = useState('');
    const [refreshSuccess, setRefreshSuccess] = useState(false);

    const handleRefreshStatus = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!order?._id) return;

        try {
            setRefreshing(true);
            setRefreshError('');
            setRefreshSuccess(false);

            await adminOrderApi.syncOrderStatus(order._id);
            setRefreshSuccess(true);

            if (onRefresh) {
                onRefresh();
            }

            setTimeout(() => {
                setRefreshSuccess(false);
            }, 3000);

        } catch (err: any) {
            console.error('Error refreshing order status:', err);
            setRefreshError(err.response?.data?.error || 'Failed to refresh status');
            setTimeout(() => {
                setRefreshError('');
            }, 5000);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'CREATED': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            case 'CANCELLED': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getThyrocareStatusColor = (status: string) => {
        switch (status) {
            case 'DONE': return 'bg-green-100 text-green-800';
            case 'SERVICED': return 'bg-blue-100 text-blue-800';
            case 'ACCEPTED': return 'bg-purple-100 text-purple-800';
            case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
            case 'YET TO ASSIGN': return 'bg-gray-100 text-gray-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <tr>
                <td colSpan={6} className="px-6 py-4">
                    <div className="flex items-center justify-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2 text-gray-600">Loading order details...</span>
                    </div>
                </td>
            </tr>
        );
    }

    if (error) {
        return (
            <tr>
                <td colSpan={6} className="px-6 py-4">
                    <div className="text-center">
                        <p className="text-red-600 mb-2">{error}</p>
                        <button
                            onClick={onRetry}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    if (!order) return null;

    return (
        <React.Fragment>
            <tr className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={onToggle}>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.orderId}</div>
                    <div className="text-sm text-gray-500">₹{order.package?.price || 0}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                        {typeof order.userId === 'object' ? `${order.userId.firstName} ${order.userId.lastName}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{order.contactInfo?.email || 'No email'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 line-clamp-1 max-w-[200px]">{order.package?.name || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{order.beneficiaries?.length || 0} beneficiaries</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)} w-fit`}>
                            {order.status}
                        </span>
                        {order.thyrocare?.status && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getThyrocareStatusColor(order.thyrocare.status)} w-fit`}>
                                {order.thyrocare.status}
                            </span>
                        )}
                    </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 transition-colors"
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            {isExpanded ? 'Hide' : 'View'}
                        </button>

                        {order.thyrocare?.orderNo && (
                            <button
                                type="button"
                                onClick={handleRefreshStatus}
                                disabled={refreshing}
                                className="text-green-600 hover:text-green-900 flex items-center gap-1 disabled:opacity-50 transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                {refreshing ? '...' : 'Sync'}
                            </button>
                        )}
                    </div>
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={6} className="px-6 py-8 bg-gray-50/50 border-y border-gray-200">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Package className="h-5 w-5 text-blue-500" />
                                        Package Details
                                    </h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Name:</span>
                                            <span className="font-semibold text-gray-900">{combinedName(order.package?.name)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Original Price:</span>
                                            <span className="text-gray-400 line-through">₹{order.package?.originalPrice}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-3 border-t">
                                            <span className="text-gray-900 font-bold">Paid Amount:</span>
                                            <span className="text-xl text-green-600 font-black">₹{order.package?.price}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <User className="h-5 w-5 text-blue-500" />
                                        Contact & Address
                                    </h4>
                                    <div className="space-y-4 text-sm text-gray-800">
                                        <div>
                                            <p className="text-gray-500 mb-1">Shipping Address:</p>
                                            <p className="font-medium leading-relaxed">
                                                {`${order.contactInfo?.address.street}, ${order.contactInfo?.address.city}, ${order.contactInfo?.address.state} - ${order.contactInfo?.address.pincode}`}
                                                {order.contactInfo?.address.landmark && (
                                                    <span className="block text-gray-500 italic">Near: {order.contactInfo.address.landmark}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex justify-between pt-2">
                                            <span className="text-gray-500">Mobile:</span>
                                            <span className="font-bold">{order.contactInfo?.mobile}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Appointment:</span>
                                            <span className="font-bold text-blue-600">{order.appointment?.date} ({order.appointment?.slot})</span>
                                        </div>
                                    </div>
                                </div>

                                {order.payment && (
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                            <CheckCircle className="h-5 w-5 text-blue-500" />
                                            Payment Details
                                        </h4>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Method:</span>
                                                <span className="font-bold uppercase">{order.payment.type || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Status:</span>
                                                <span className={`font-black uppercase ${order.payment.status === 'SUCCESS' ? 'text-green-600' : 'text-orange-500'}`}>
                                                    {order.payment.status || 'PENDING'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <span className="text-gray-900 font-bold">Total Amount:</span>
                                                <span className="text-lg font-black">₹{order.payment.amount || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Truck className="h-5 w-5 text-blue-500" />
                                        External Service (Thyrocare)
                                    </h4>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Thyrocare ID:</span>
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded flex items-center gap-2">
                                                {order.thyrocare?.orderNo || 'NOT_SYNCED'}
                                                {order.thyrocare?.orderNo && (
                                                    <button onClick={() => copyToClipboard(order.thyrocare?.orderNo || '')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Last Synched:</span>
                                            <span className="font-medium">{formatDate(order.thyrocare?.lastSyncedAt)}</span>
                                        </div>
                                        {order.thyrocare?.error && (
                                            <div className="p-3 bg-red-50 border border-red-100 rounded text-red-700 text-xs">
                                                <strong>Sync Error:</strong> {order.thyrocare.error}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2 border-b pb-3">
                                        <Users className="h-5 w-5 text-blue-500" />
                                        Beneficiaries List
                                    </h4>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full">
                                            <thead>
                                                <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-tight">
                                                    <th className="pb-3">Name</th>
                                                    <th className="pb-3">Details</th>
                                                    <th className="pb-3 text-right">Reports</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 text-sm">
                                                {order.beneficiaries.map((ben, idx) => {
                                                    const report = order.reports?.find(r => r.beneficiaryName === ben.name || r.leadId === ben.leadId);
                                                    return (
                                                        <tr key={idx} className="group hover:bg-gray-50/50">
                                                            <td className="py-3 font-semibold text-gray-800">{ben.name}</td>
                                                            <td className="py-3 text-gray-500">{ben.age}y / {ben.gender}</td>
                                                            <td className="py-3 text-right">
                                                                {report?.reportUrl ? (
                                                                    <a
                                                                        href={report.reportUrl}
                                                                        target="_blank"
                                                                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                                                                    >
                                                                        View PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-300">Pending</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </React.Fragment>
    );
};

// Helper for package names
const combinedName = (name?: string) => {
    if (!name) return 'N/A';
    return name;
};

export default OrderAccordion;
