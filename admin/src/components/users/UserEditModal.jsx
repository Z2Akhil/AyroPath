import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const UserEditModal = ({ user, onClose, onSave, loading = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNumber: '',
    address: '',
    city: '',
    state: '',
    isActive: true,
    isVerified: false,
    emailVerified: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsVisible(true), 10);
    return () => setIsVisible(false);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
        isVerified: user.isVerified !== undefined ? user.isVerified : false,
        emailVerified: user.emailVerified !== undefined ? user.emailVerified : false
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.mobileNumber && !/^[0-9+\-\s()]{10,}$/.test(formData.mobileNumber.replace(/[\s\-()]/g, ''))) {
      newErrors.mobileNumber = 'Invalid mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation to complete
  };

  if (!user) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-center items-center p-4 transition-all duration-300 ${
      isVisible ? 'bg-black/50' : 'bg-black/0'
    }`}>
      <div className={`bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-600">Update user information</p>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.firstName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.mobileNumber ? 'border-red-300' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {errors.mobileNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.mobileNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Account Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isVerified"
                    name="isVerified"
                    checked={formData.isVerified}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="isVerified" className="ml-2 text-sm text-gray-700">
                    Account Verified
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailVerified"
                    name="emailVerified"
                    checked={formData.emailVerified}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    disabled={loading}
                  />
                  <label htmlFor="emailVerified" className="ml-2 text-sm text-gray-700">
                    Email Verified
                  </label>
                </div>
              </div>
            </div>

            {/* User ID Display */}
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                User ID: <span className="font-mono text-gray-900">{user._id}</span>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditModal;
