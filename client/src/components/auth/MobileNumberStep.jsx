import { Phone } from 'lucide-react';

const MobileNumberStep = ({
  mobileNumber,
  onMobileNumberChange,
  onRequestOTP,
  loading,
  error
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestOTP();
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Enter Your Mobile Number
        </h3>
        <p className="text-gray-600 text-sm">
          We'll send a verification code to your mobile number
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <div onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onRequestOTP();
        }
      }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="mobileNumber"
              value={mobileNumber}
              onChange={(e) => onMobileNumberChange(e.target.value)}
              placeholder="Enter 10-digit mobile number"
              maxLength={10}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white text-lg"
              required
              disabled={loading}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter your 10-digit mobile number (e.g., 9876543210)
          </p>
        </div>

        <button
          type="button"
          onClick={onRequestOTP}
          disabled={loading}
          className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 
                     text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                     font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Send Verification Code
              <Phone className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MobileNumberStep;
