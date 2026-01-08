import { useState } from 'react';
import { useUser } from '../context/userContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Phone } from 'lucide-react';

const LoginForm = ({ onClose, onSwitchToRegister, onForgotPassword }) => {
  const { login } = useUser();
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  // Import authService locally if not available globally/via context
  // Assuming it is imported at top of file, if not I need to add import. 
  // Wait, I need to check imports. I'll add the import in a separate edit if needed.
  // For now let's assume I can use it or pass it. 
  // Actually, better to import it at the top. 
  // But inside here:

  const handleResendVerification = async () => {
    try {
      setResendLoading(true);
      // We need to import authService. 
      // I will assume authService is imported. If not I will add it. 
      // See import below.
      const { authService } = await import('../services/authService');

      await authService.resendVerificationPublic(verificationNeeded.email);
      // Show success message (maybe replace error with success or toast)
      setError(''); // Clear error
      alert("Verification email sent! Please check your inbox."); // Simple alert or toast
      setShowVerificationModal(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.identifier, formData.password);
      onClose();
    } catch (err) {
      // Check for specific verification error
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        setVerificationNeeded({ email: err.response.data.email });
        setShowVerificationModal(true);
      } else {
        setError(err.message || "Login failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
        <p className="text-gray-600">Sign in to your account to continue</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Identifier Field (Mobile Number or Email) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mobile Number or Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter your mobile number or email"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter your 10-digit mobile number (e.g., 9876543210) or email address
          </p>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg 
                         placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                         focus:border-blue-500 transition-all duration-200 bg-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-blue-600 to-blue-700 
                     text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none 
                     focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 
                     font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Verification Modal */}
        {showVerificationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 mb-4">
                  <Mail className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Email Verification Required</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Your email address <strong>{verificationNeeded?.email}</strong> is not verified. Please verify it to login with email.
                </p>
                <div className="bg-blue-50 rounded-lg p-3 mt-4 text-xs text-blue-700">
                  <span className="font-semibold">Tip:</span> You can also login with your registered mobile number instead!
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {resendLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2" />
                  )}
                  Send Verification Link
                </button>
                <button
                  type="button"
                  onClick={() => setShowVerificationModal(false)}
                  className="w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">New to Ayropath?</span>
          </div>
        </div>

        {/* Register Link */}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="w-full px-4 py-3 border-2 border-blue-600 text-blue-600 rounded-lg 
                     hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-offset-2 transition-all duration-200 font-medium"
        >
          Create New Account
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          By continuing, you agree to our{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
