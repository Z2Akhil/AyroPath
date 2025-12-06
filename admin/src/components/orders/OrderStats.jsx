import { Package, CheckCircle, Clock, XCircle } from 'lucide-react';

const OrderStats = ({ stats, loading }) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Use categorized stats if available, otherwise fall back to old stats
  const completedCount = stats.byCategorizedStatus?.COMPLETED || stats.byStatus.COMPLETED;
  const pendingCount = stats.byCategorizedStatus?.PENDING || stats.byStatus.PENDING;
  const failedCount = stats.byCategorizedStatus?.FAILED || stats.byStatus.FAILED;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>
          <Package className="h-8 w-8 text-blue-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
          </div>
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-yellow-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
          </div>
          <Clock className="h-8 w-8 text-yellow-500" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-6 shadow-sm border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-gray-900">{failedCount}</p>
          </div>
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
      </div>
    </div>
  );
};

export default OrderStats;
