import { useEffect, useState } from "react";
import fetchUserOrders from "../api/fetchUserOrders";
import { Loader, FileText, Search, Filter, Calendar, X, Download } from "lucide-react";
import Pagination from "../components/Pagination";
import OrderCard from "../components/orders/OrderCard";

const COMPLETED_STATUSES = ["DONE", "REPORTED", "CANCELLED", "FAILED", "COMPLETED"];

const OrderHistory = () => {
  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const allOrders = await fetchUserOrders();
        const completedOrders = allOrders.filter((o) =>
          COMPLETED_STATUSES.includes(o.status?.toUpperCase())
        );
        
        setAllOrders(completedOrders);
        setFilteredOrders(completedOrders);
        setLoading(false);
      } catch (error) {
        console.error("Error loading order history:", error);
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = allOrders;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.orderId?.toLowerCase().includes(term) ||
        order.package?.name?.toLowerCase().includes(term) ||
        order.status?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      result = result.filter(order => 
        order.status?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      result = result.filter(order => {
        const orderDate = order.createdAt ? new Date(order.createdAt) : null;
        if (!orderDate) return true;

        const startDate = dateRange.start ? new Date(dateRange.start) : null;
        const endDate = dateRange.end ? new Date(dateRange.end) : null;

        let valid = true;
        if (startDate) valid = valid && orderDate >= startDate;
        if (endDate) valid = valid && orderDate <= new Date(endDate.getTime() + 86400000); // Add 1 day to include end date

        return valid;
      });
    }

    setFilteredOrders(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allOrders, searchTerm, statusFilter, dateRange]);

  // Get unique statuses for filter dropdown
  const uniqueStatuses = ["ALL", ...new Set(allOrders.map(order => order.status?.toUpperCase()).filter(Boolean))];

  // ---- Pagination Calculation ----
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateRange({ start: "", end: "" });
  };

  // Export to CSV (basic implementation)
  const exportToCSV = () => {
    const headers = ["Order ID", "Package", "Amount", "Status", "Appointment Date", "Order Date"];
    const csvData = filteredOrders.map(order => [
      order.orderId || "",
      order.package?.name || "",
      `₹${order.package?.price || 0}`,
      order.status || "",
      order.appointment?.date || "",
      order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : ""
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Order History</h1>
          <p className="text-gray-600 mt-1">View and manage your completed orders</p>
        </div>
        
        <button
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 text-gray-700">
            <Filter className="h-5 w-5 text-blue-600" />
            Filters
          </h2>
          
          {(searchTerm || statusFilter !== "ALL" || dateRange.start || dateRange.end) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Orders</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID, Package, Status..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All Statuses" : status}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {allOrders.length} orders
              {(searchTerm || statusFilter !== "ALL" || dateRange.start || dateRange.end) && " (filtered)"}
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Sorted by: Most Recent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader className="animate-spin text-blue-600 h-12 w-12" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500 mb-6">
              {allOrders.length === 0 
                ? "You don't have any completed orders yet."
                : "No orders match your current filters."}
            </p>
            {allOrders.length > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Display paginated orders */}
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <OrderCard key={order.orderId} order={order} showContactSupport={false} />
              ))}
            </div>

            {/* Pagination UI */}
            {totalPages > 1 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => setCurrentPage(page)}
                  onItemsPerPageChange={(value) => {
                    setItemsPerPage(value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
