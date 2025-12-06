import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, FileText, Calendar, User, Package, IndianRupee, AlertCircle, CheckCircle, Clock, XCircle, HelpCircle } from 'lucide-react';

const OrderCard = ({ order, showContactSupport = true }) => {
  const [expanded, setExpanded] = useState(false);

  // Status badge configuration
  const getStatusConfig = (status) => {
    const statusUpper = (status || '').toUpperCase();
    
    switch (statusUpper) {
      case 'COMPLETED':
      case 'DONE':
      case 'REPORTED':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Completed'
        };
      case 'PENDING':
      case 'CREATED':
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />,
          label: 'Pending'
        };
      case 'CANCELLED':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Cancelled'
        };
      case 'FAILED':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-4 w-4" />,
          label: 'Failed'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: <HelpCircle className="h-4 w-4" />,
          label: status || 'Unknown'
        };
    }
  };

  const statusConfig = getStatusConfig(order.status);
  const formattedDate = order.appointment?.date 
    ? new Date(order.appointment.date).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : 'Not scheduled';

  const contactInfo = order.contactInfo || {};
  const packageInfo = order.package || {};
  const thyrocareInfo = order.thyrocare || {};

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Order Header */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Order #{order.orderId}</h3>
            </div>
            <p className="text-sm text-gray-600">{packageInfo.name || 'Package'}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
              {statusConfig.icon}
              <span>{statusConfig.label}</span>
            </div>

            {/* Expand/Collapse Button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              aria-label={expanded ? 'Collapse details' : 'Expand details'}
            >
              {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Quick Info Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Amount</p>
              <p className="font-medium">₹{packageInfo.price?.toLocaleString() || '0'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <div>
              <p className="text-xs text-gray-500">Appointment</p>
              <p className="font-medium text-sm">{formattedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Customer</p>
              <p className="font-medium text-sm truncate">{contactInfo.name || contactInfo.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-xs text-gray-500">Tests</p>
              <p className="font-medium text-sm">{packageInfo.testsCount || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Order Details */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Order Details
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-medium">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Package:</span>
                  <span className="font-medium">{packageInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">₹{packageInfo.price?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Date:</span>
                  <span className="font-medium">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Appointment & Contact */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Appointment & Contact
              </h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{formattedDate}</span>
                </div>
                {order.appointment?.time && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">{order.appointment.time}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium truncate">{contactInfo.email || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{contactInfo.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Thyrocare Status (if available) */}
          {thyrocareInfo.status && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Thyrocare Status</h4>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                <span className="text-sm font-medium">{thyrocareInfo.status}</span>
                {thyrocareInfo.referenceId && (
                  <span className="text-xs">(Ref: {thyrocareInfo.referenceId})</span>
                )}
              </div>
            </div>
          )}

          {/* Contact Support */}
          {showContactSupport && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-3">Need Help with this Order?</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href="tel:+911234567890"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Phone className="h-4 w-4" />
                  Call Support
                </a>
                <a
                  href="mailto:support@aryopath.com"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Mail className="h-4 w-4" />
                  Email Support
                </a>
                <button
                  onClick={() => alert(`Please mention Order #${order.orderId} when contacting support`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                >
                  <HelpCircle className="h-4 w-4" />
                  Get Help
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Please mention Order #{order.orderId} when contacting support
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
