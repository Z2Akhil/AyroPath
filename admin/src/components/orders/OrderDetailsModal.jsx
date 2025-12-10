import {
  X, Package, User, Mail, Phone, MapPin, Calendar,
  DollarSign, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, Users, CreditCard, Truck, Download, Copy
} from 'lucide-react';

const OrderDetailsModal = ({ order, isOpen, onClose, loading, error }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CREATED':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getThyrocareStatusColor = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-green-100 text-green-800';
      case 'SERVICED':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-purple-100 text-purple-800';
      case 'ASSIGNED':
        return 'bg-yellow-100 text-yellow-800';
      case 'YET TO ASSIGN':
        return 'bg-gray-100 text-gray-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard:', text);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order Details
                  </h3>
                  {order && (
                    <p className="text-sm text-gray-500">
                      Order ID: {order.orderId}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading order details...</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                <p className="mt-2 text-red-600">{error}</p>
              </div>
            ) : order ? (
              <div className="space-y-6">
                {/* Order Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Package Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package Name:</span>
                        <span className="font-medium">{order.package?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Package Code:</span>
                        <span className="font-medium">{order.package?.code || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">₹{order.package?.price || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Discount:</span>
                        <span className="font-medium">₹{order.package?.discount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Final Price:</span>
                        <span className="font-medium text-green-600">₹{order.package?.sellingPrice || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Customer Information
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {order.userId?.firstName || 'N/A'} {order.userId?.lastName || ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium flex items-center gap-1">
                          {order.contactInfo?.email || 'N/A'}
                          <button
                            onClick={() => copyToClipboard(order.contactInfo?.email)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium flex items-center gap-1">
                          {order.contactInfo?.mobile || 'N/A'}
                          <button
                            onClick={() => copyToClipboard(order.contactInfo?.mobile)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right">
                          {(() => {
                            const address = order.contactInfo?.address;
                            if (!address) return 'N/A';
                            if (typeof address === 'string') return address;
                            if (typeof address === 'object') {
                              const parts = [];
                              if (address.street) parts.push(address.street);
                              if (address.city) parts.push(address.city);
                              if (address.state) parts.push(address.state);
                              if (address.pincode) parts.push(address.pincode);
                              if (address.landmark) parts.push(`Landmark: ${address.landmark}`);
                              return parts.join(', ');
                            }
                            return 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Order Status
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        {order.updatedAt && (
                          <div className="flex justify-between mt-1">
                            <span>Last Updated:</span>
                            <span>{formatDate(order.updatedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Thyrocare Status
                    </h4>
                    <div className="space-y-3">
                      {order.thyrocare?.status ? (
                        <>
                          <div>
                            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getThyrocareStatusColor(order.thyrocare.status)}`}>
                              {order.thyrocare.status}
                            </span>
                          </div>
                          {order.thyrocare.orderId && (
                            <div className="text-sm text-gray-600">
                              <div className="flex justify-between">
                                <span>Thyrocare Order ID:</span>
                                <span className="font-medium">{order.thyrocare.orderId}</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">No Thyrocare information available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Beneficiaries */}
                {order.beneficiaries && order.beneficiaries.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Beneficiaries ({order.beneficiaries.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Age
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Gender
                            </th>

                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {order.beneficiaries.map((beneficiary, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {beneficiary.name}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {beneficiary.age}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm">
                                {beneficiary.gender}
                              </td>

                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {order.payment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payment Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Payment ID:</span>
                          <span className="font-medium">{order.payment.paymentId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Method:</span>
                          <span className="font-medium">{order.payment.method || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${order.payment.status === 'SUCCESS' ? 'text-green-600' :
                              order.payment.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {order.payment.status || 'N/A'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-medium">₹{order.payment.amount || 0}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Currency:</span>
                          <span className="font-medium">{order.payment.currency || 'INR'}</span>
                        </div>
                        {order.payment.createdAt && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Paid At:</span>
                            <span className="font-medium">{formatDate(order.payment.createdAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {order.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="mt-2 text-gray-600">No order data available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
              {order && (
                <button
                  onClick={() => {
                    // Add download functionality here
                    console.log('Download order:', order.orderId);
                  }}
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
