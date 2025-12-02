import { useState, useEffect } from 'react';
import { Calendar, Mail, Users, AlertCircle, CheckCircle, RefreshCw, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import { notificationApi } from '../../api/notificationApi';

const NotificationHistory = () => {
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    pages: 0
  });

  const itemsPerPage = 5;

  useEffect(() => {
    fetchNotifications();
  }, [currentPage]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await notificationApi.getNotifications(currentPage, itemsPerPage);
      
      if (response.success) {
        setNotifications(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.message || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications. Please try again.');
      // Fallback to empty array if API fails
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setCurrentPage(newPage);
      setExpandedNotification(null); // Close any expanded notifications when changing page
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRetryFailed = async (notificationId) => {
    try {
      if (window.confirm('Are you sure you want to retry failed deliveries for this notification?')) {
        const response = await notificationApi.retryFailed(notificationId);
        
        if (response.success) {
          alert('Retry started successfully. The system will attempt to resend failed emails.');
          // Refresh the notifications list
          fetchNotifications();
        } else {
          alert(`Failed to start retry: ${response.message}`);
        }
      }
    } catch (err) {
      console.error('Error retrying failed emails:', err);
      alert('Failed to start retry. Please try again.');
    }
  };

  const toggleExpand = (notificationId) => {
    setExpandedNotification(expandedNotification === notificationId ? null : notificationId);
  };

  const getEmailTypeIcon = (type) => {
    return type === 'promotional' ? '📢' : 'ℹ️';
  };

  const getEmailTypeLabel = (type) => {
    return type === 'promotional' ? 'Promotional' : 'Informational';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'sending': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'draft': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3" />;
      case 'sending': return <Loader className="h-3 w-3 animate-spin" />;
      case 'failed': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  if (error && notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading notifications</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-4">{error}</p>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, pagination.total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification History</h2>
          <p className="text-sm text-gray-600 mt-1">
            View past notifications and retry failed deliveries
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Showing {notifications.length} of {pagination.total} notifications
        </div>
      </div>

      {/* Delivery Summary - MOVED TO TOP */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Delivery Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-blue-600">
              {notifications.reduce((sum, n) => sum + n.totalRecipients, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Recipients</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-green-600">
              {notifications.reduce((sum, n) => sum + n.sentCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Successfully Sent</div>
          </div>
          <div className="text-center p-3 bg-white rounded border">
            <div className="text-2xl font-bold text-red-600">
              {notifications.reduce((sum, n) => sum + n.failedCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Failed Deliveries</div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => {
          const failedRecipients = notification.recipients?.filter(r => r.status === 'failed') || [];
          const isExpanded = expandedNotification === notification._id;
          
          return (
            <div
              key={notification._id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Notification Header */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getEmailTypeIcon(notification.emailType)}</span>
                      <h3 className="font-medium text-gray-900">{notification.subject}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(notification.status)}`}>
                        {getStatusIcon(notification.status)}
                        <span className="ml-1 capitalize">{notification.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(notification.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {notification.totalRecipients} recipients
                      </span>
                      <span className={`flex items-center gap-1 ${
                        notification.failedCount > 0 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {notification.failedCount > 0 ? (
                          <AlertCircle className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {notification.sentCount} sent • {notification.failedCount} failed
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {notification.failedCount > 0 && notification.status === 'completed' && (
                      <button
                        onClick={() => handleRetryFailed(notification._id)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry Failed ({notification.failedCount})
                      </button>
                    )}
                    
                    <button
                      onClick={() => toggleExpand(notification._id)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Notification Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Notification Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium">{getEmailTypeLabel(notification.emailType)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sent Date:</span>
                          <span>{formatDate(notification.createdAt)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Recipients:</span>
                          <span>{notification.totalRecipients}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Success Rate:</span>
                          <span className={`font-medium ${
                            (notification.sentCount / notification.totalRecipients) > 0.9 
                              ? 'text-green-600' 
                              : 'text-orange-600'
                          }`}>
                            {notification.totalRecipients > 0 
                              ? Math.round((notification.sentCount / notification.totalRecipients) * 100)
                              : 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${getStatusColor(notification.status)}`}>
                            {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Failed Recipients */}
                    {failedRecipients.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Failed Recipients</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {failedRecipients.map((recipient, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center p-2 bg-red-50 rounded border border-red-100"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-red-500" />
                                <span className="text-sm">{recipient.email}</span>
                              </div>
                              <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                {recipient.error || 'Unknown error'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons - Only show retry button if there are failed recipients */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
                    {failedRecipients.length > 0 && notification.status === 'completed' && (
                      <button
                        onClick={() => handleRetryFailed(notification._id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Retry All Failed
                      </button>
                    )}
                    <button
                      onClick={() => alert('View full details would show complete recipient list')}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State (if no notifications) */}
      {notifications.length === 0 && !loading && (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            When you send notifications, they will appear here with delivery status and retry options.
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.total > itemsPerPage && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{endIndex} of {pagination.total} notifications
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {pagination.pages > 5 && currentPage < pagination.pages - 2 && (
                  <>
                    <span className="text-gray-500">...</span>
                    <button
                      onClick={() => handlePageChange(pagination.pages)}
                      className="w-8 h-8 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                    >
                      {pagination.pages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === pagination.pages}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Page {currentPage} of {pagination.pages}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationHistory;
