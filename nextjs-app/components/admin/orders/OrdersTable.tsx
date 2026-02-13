import React, { useState } from 'react';
import OrderAccordion from './OrderAccordion';
import adminOrderApi from '@/lib/api/adminOrderApi';
import { AdminOrder } from '@/types/admin';

interface OrdersTableProps {
    orders: AdminOrder[];
    searchTerm: string;
    statusFilter: string;
    thyrocareStatusFilter: string;
    dateRange: { startDate: string; endDate: string };
    onRefreshOrder: () => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
    orders,
    searchTerm,
    statusFilter,
    thyrocareStatusFilter,
    dateRange,
    onRefreshOrder
}) => {
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
    const [expandedOrderData, setExpandedOrderData] = useState<AdminOrder | null>(null);
    const [expandedOrderLoading, setExpandedOrderLoading] = useState(false);
    const [expandedOrderError, setExpandedOrderError] = useState('');

    const handleToggleOrder = async (orderId: string) => {
        if (expandedOrderId === orderId) {
            setExpandedOrderId(null);
            setExpandedOrderData(null);
        } else {
            setExpandedOrderId(orderId);

            if (expandedOrderData && expandedOrderData.orderId === orderId) {
                return;
            }

            try {
                setExpandedOrderLoading(true);
                setExpandedOrderError('');
                const response = await adminOrderApi.getOrder(orderId);
                setExpandedOrderData(response.order);
            } catch (err: any) {
                console.error('Error fetching order details:', err);
                setExpandedOrderError('Failed to load order details. Please try again.');
                setExpandedOrderData(null);
            } finally {
                setExpandedOrderLoading(false);
            }
        }
    };

    const handleRetry = async (orderId: string) => {
        try {
            setExpandedOrderLoading(true);
            setExpandedOrderError('');
            const response = await adminOrderApi.getOrder(orderId);
            setExpandedOrderData(response.order);
        } catch (err: any) {
            console.error('Error fetching order details:', err);
            setExpandedOrderError('Failed to load order details. Please try again.');
        } finally {
            setExpandedOrderLoading(false);
        }
    };

    if (orders.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-12 text-center text-gray-500">
                    <div className="mb-4 inline-flex items-center justify-center p-4 bg-gray-50 rounded-full">
                        <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No orders found</p>
                    <p className="mt-1">
                        {searchTerm || statusFilter || thyrocareStatusFilter || dateRange.startDate || dateRange.endDate
                            ? 'Try adjusting your filters to find what you’re looking for.'
                            : 'Orders will appear here once customers start booking tests.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Order ID
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Customer
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Package
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Created At
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {orders.map((order) => (
                            <OrderAccordion
                                key={order._id}
                                order={expandedOrderId === order.orderId ? expandedOrderData : order}
                                loading={expandedOrderId === order.orderId && expandedOrderLoading}
                                error={expandedOrderId === order.orderId ? expandedOrderError : ''}
                                onRetry={() => handleRetry(order.orderId)}
                                isExpanded={expandedOrderId === order.orderId}
                                onToggle={() => handleToggleOrder(order.orderId)}
                                onRefresh={() => {
                                    handleRetry(order.orderId);
                                    if (onRefreshOrder) {
                                        onRefreshOrder();
                                    }
                                }}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Placeholder icons if needed, since I'm using lucide-react in the component
import { Package } from 'lucide-react';

export default OrdersTable;
