import { 
  ChevronDown, ChevronUp, Package, User, CheckCircle, Truck, Users, CreditCard, 
  FileText, Copy, Download
} from 'lucide-react';

const OrderAccordion = ({ order, loading, error, onRetry, isExpanded, onToggle }) => {

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
      console.log('Copied to clipboard:', text);
    });
  };

  if (loading) {
    return (
      <tr>
        <td colSpan="6" className="px-6 py-4">
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
        <td colSpan="6" className="px-6 py-4">
          <div className="text-center">
            <p className="text-red-600 mb-2">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  }

  if (!order) {
    return (
      <tr>
        <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
          No order data available
        </td>
      </tr>
    );
  }

  return (
    <>
      {/* Main row with toggle button */}
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {order.orderId}
          </div>
          <div className="text-sm text-gray-500">
            ₹{order.package?.price || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {order.userId?.firstName || 'N/A'} {order.userId?.lastName || ''}
          </div>
          <div className="text-sm text-gray-500">
            {order.contactInfo?.email || 'No email'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {order.package?.name || 'N/A'}
          </div>
          <div className="text-sm text-gray-500">
            {order.beneficiaries?.length || 0} beneficiaries
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
            {order.status}
          </span>
          {order.thyrocare?.status && (
            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getThyrocareStatusColor(order.thyrocare.status)}`}>
              {order.thyrocare.status}
            </span>
          )}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <button
            type="button"
            onClick={onToggle}
            className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View Details
              </>
            )}
          </button>
        </td>
      </tr>

      {/* Accordion content row */}
      {isExpanded && (
        <tr>
          <td colSpan="6" className="px-6 py-6 bg-gray-50">
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
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

                <div className="bg-white rounded-lg p-4 border border-gray-200">
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
                          className="p-1 hover:bg-gray-100 rounded"
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
                          className="p-1 hover:bg-gray-100 rounded"
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
                <div className="bg-white rounded-lg p-4 border border-gray-200">
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

                <div className="bg-white rounded-lg p-4 border border-gray-200">
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
                <div className="bg-white rounded-lg p-4 border border-gray-200">
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
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Relationship
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
                            <td className="px-3 py-2 whitespace-nowrap text-sm">
                              {beneficiary.relationship}
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
                <div className="bg-white rounded-lg p-4 border border-gray-200">
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
                        <span className={`font-medium ${
                          order.payment.status === 'SUCCESS' ? 'text-green-600' : 
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

              {/* Notes and Actions */}
              <div className="flex flex-col md:flex-row gap-6">
                {order.notes && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 flex-1">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                  </div>
                )}
                
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-3">Actions</h4>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        console.log('Download invoice for order:', order.orderId);
                      }}
                      className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2 justify-center"
                    >
                      <Download className="h-4 w-4" />
                      Download Invoice
                    </button>
                    <button
                      onClick={onToggle}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                      Close Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default OrderAccordion;
