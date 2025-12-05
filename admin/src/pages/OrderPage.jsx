import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import orderAdminApi from '../api/orderAdminApi';
import Pagination from '../components/Pagination';
import { OrderStats, OrderFilters, OrdersTable } from '../components/orders';
import { AlertCircle } from 'lucide-react';

const OrderPage = () => {
  const { user: _user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [thyrocareStatusFilter, setThyrocareStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: itemsPerPage
      };
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (thyrocareStatusFilter) {
        params.thyrocareStatus = thyrocareStatusFilter;
      }
      
      if (dateRange.startDate) {
        params.startDate = dateRange.startDate;
      }
      
      if (dateRange.endDate) {
        params.endDate = dateRange.endDate;
      }
      
      const response = await orderAdminApi.getOrders(params);
      
      setOrders(response.data.orders || []);
      setTotalOrders(response.data.pagination?.totalOrders || 0);
      setTotalPages(response.data.pagination?.totalPages || 1);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders. Please try again.');
      setOrders([]);
      setTotalOrders(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, statusFilter, thyrocareStatusFilter, dateRange, searchTerm]);
  
  const fetchOrderStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await orderAdminApi.getOrderStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [fetchOrders, fetchOrderStats]);

  
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };
  
  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleThyrocareStatusFilterChange = (e) => {
    setThyrocareStatusFilter(e.target.value);
    setCurrentPage(1);
  };
  
  const handleDateChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
    setCurrentPage(1);
  };
  
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setThyrocareStatusFilter('');
    setDateRange({ startDate: '', endDate: '' });
    setCurrentPage(1);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="h-12 bg-gray-200 rounded mb-4"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stats Cards */}
        <OrderStats stats={stats} loading={statsLoading} />
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}
        
        {/* Search and Filters */}
        <OrderFilters
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          thyrocareStatusFilter={thyrocareStatusFilter}
          onThyrocareStatusFilterChange={handleThyrocareStatusFilterChange}
          dateRange={dateRange}
          onDateChange={handleDateChange}
          onClearFilters={clearFilters}
          onRefresh={fetchOrders}
          loading={loading}
        />

        {/* Orders Table */}
        <OrdersTable
          orders={orders}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          thyrocareStatusFilter={thyrocareStatusFilter}
          dateRange={dateRange}
        />
        
        {/* Pagination */}
        {orders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={totalOrders}
          />
        )}

      </div>
    </div>
  );
};

export default OrderPage;
