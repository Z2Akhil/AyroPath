import { useState } from 'react';
import OrderAccordion from './OrderAccordion';
import orderAdminApi from '../../api/orderAdminApi';

const OrdersTable = ({ 
  orders, 
  searchTerm, 
  statusFilter, 
  thyrocareStatusFilter, 
  dateRange 
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [expandedOrderData, setExpandedOrderData] = useState(null);
  const [expandedOrderLoading, setExpandedOrderLoading] = useState(false);
  const [expandedOrderError, setExpandedOrderError] = useState('');

  const handleToggleOrder = async (orderId) => {
    if (expandedOrderId === orderId) {
      // Collapse if already expanded
      setExpandedOrderId(null);
      setExpandedOrderData(null);
    } else {
      // Expand and fetch data
      setExpandedOrderId(orderId);
      
      // Check if we already have the data
      if (expandedOrderData && expandedOrderData.orderId === orderId) {
        return;
      }
      
      // Fetch order details
      try {
        setExpandedOrderLoading(true);
        setExpandedOrderError('');
        const response = await orderAdminApi.getOrder(orderId);
        setExpandedOrderData(response.data.order);
      } catch (err) {
        console.error('Error fetching order details:', err);
        setExpandedOrderError('Failed to load order details. Please try again.');
        setExpandedOrderData(null);
      } finally {
        setExpandedOrderLoading(false);
      }
    }
  };

  const handleRetry = async (orderId) => {
    try {
      setExpandedOrderLoading(true);
      setExpandedOrderError('');
      const response = await orderAdminApi.getOrder(orderId);
      setExpandedOrderData(response.data.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setExpandedOrderError('Failed to load order details. Please try again.');
    } finally {
      setExpandedOrderLoading(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-8 text-center text-gray-500">
          {searchTerm || statusFilter || thyrocareStatusFilter || dateRange.startDate || dateRange.endDate 
            ? 'No orders found matching your filters' 
            : 'No orders found'}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Package
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <OrderAccordion
                key={order._id}
                order={expandedOrderId === order.orderId ? expandedOrderData : order}
                loading={expandedOrderId === order.orderId && expandedOrderLoading}
                error={expandedOrderId === order.orderId ? expandedOrderError : ''}
                onRetry={() => handleRetry(order.orderId)}
                isExpanded={expandedOrderId === order.orderId}
                onToggle={() => handleToggleOrder(order.orderId)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersTable;
