import { axiosInstance as api } from "../api/axiosInstance";

export const authService = {
  async requestOTP(mobileNumber, purpose = 'verification') {
    const response = await api.post('/auth/request-otp', {
      mobileNumber,
      purpose,
    });
    return response.data;
  },

  // Verify OTP
  async verifyOTP(mobileNumber, otp, purpose = 'verification') {
    const response = await api.post('/auth/verify-otp', {
      mobileNumber,
      otp,
      purpose,
    });
    return response.data;
  },

  // Register user (phone-based profile completion)
  async register(firstName, lastName, mobileNumber, password, email) {
    const response = await api.post('/auth/register', {
      firstName,
      lastName,
      mobileNumber,
      password,
      email, 
    });
    return response.data;
  },

  // Email registration
  async emailRegister(firstName, lastName, email, password) {
    const response = await api.post('/auth/email-register', {
      firstName,
      lastName,
      email,
      password,
    });
    return response.data;
  },

  // Set password (phone-based)
  async setPassword(mobileNumber, password) {
    const response = await api.post('/auth/set-password', {
      mobileNumber,
      password,
    });
    return response.data;
  },

  // Unified login (accepts both mobile number or email)
  async login(identifier, password) {
    const response = await api.post('/auth/login', {
      identifier,
      password,
    });
    return response.data;
  },

  // Email login (deprecated - kept for backward compatibility)
  async emailLogin(email, password) {
    const response = await api.post('/auth/login', {
      identifier: email,
      password,
    });
    return response.data;
  },

  // Forgot password - request OTP
  async forgotPassword(mobileNumber) {
    const response = await api.post('/auth/forgot-password', {
      mobileNumber,
    });
    return response.data;
  },

  // Reset password with OTP
  async resetPassword(mobileNumber, otp, newPassword) {
    const response = await api.post('/auth/reset-password', {
      mobileNumber,
      otp,
      newPassword,
    });
    return response.data;
  },

  // Email-based forgot password
  async forgotPasswordEmail(email) {
    const response = await api.post('/auth/forgot-password-email', {
      email,
    });
    return response.data;
  },

  // Email-based reset password
  async resetPasswordEmail(token, newPassword) {
    const response = await api.post('/auth/reset-password-email', {
      token,
      newPassword,
    });
    return response.data;
  },

  // Email OTP methods
  async requestEmailOTP(email, purpose = 'email_verification') {
    const response = await api.post('/auth/request-email-otp', {
      email,
      purpose,
    });
    return response.data;
  },

  async verifyEmailOTP(email, otp, purpose = 'email_verification') {
    const response = await api.post('/auth/verify-email-otp', {
      email,
      otp,
      purpose,
    });
    return response.data;
  },

  async emailRegisterWithOTP(firstName, lastName, email, password, otp) {
    const response = await api.post('/auth/email-register-with-otp', {
      firstName,
      lastName,
      email,
      password,
      otp,
    });
    return response.data;
  },

  // Resend Verification Email (Logged in user)
  async resendVerification() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  },

  // Resend Verification Email Public (Unverified user)
  async resendVerificationPublic(email) {
    const response = await api.post('/auth/resend-verification-public', { email });
    return response.data;
  },

  // Get user profile
  async getProfile() {
    const response = await api.get('/user/profile');
    return response.data;
  },

  // Update user profile
  async updateProfile(profileData) {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  },

  // Logout (client-side only)
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export default authService;
