import { useState, useEffect } from 'react';
import { UserContext } from './userContext';
import authService from '../services/authService';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      // Clear any existing session expired flag
      localStorage.removeItem("sessionExpired");

      if (token && savedUser) {
        // Check if token is expired
        try {
          // Simple JWT decode (payload is the 2nd part)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const now = Date.now() / 1000;

          if (payload.exp && payload.exp < now) {
            console.log('Token expired, clearing session');
            authService.logout();
            setUser(null);
            // No page reload - just clear the session
            return;
          }

          setUser(JSON.parse(savedUser));
        } catch (e) {
          // If token is invalid/cant be decoded, log out
          console.log('Invalid token, clearing session');
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Phone-based registration
  const register = async (firstName, lastName, mobileNumber, password, otp) => {
    try {
      const response = await authService.register(firstName, lastName, mobileNumber, password, otp);

      if (response.success && response.user) {

        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          emailVerified: response.user.emailVerified,
          name: `${response.user.firstName} ${response.user.lastName}`.trim(),
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        console.log('Registration successful, user data:', userData); // Debug log

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // EMAIL REGISTER (without OTP - for backward compatibility)
  const emailRegister = async (firstName, lastName, email, password) => {
    try {
      const response = await authService.emailRegister(firstName, lastName, email, password);

      if (response.success && response.user) {
        // Ensure we have valid firstName and lastName
        const userFirstName = response.user.firstName || firstName || '';
        const userLastName = response.user.lastName || lastName || '';

        const userData = {
          id: response.user.id,
          firstName: userFirstName,
          lastName: userLastName,
          email: response.user.email,
          isVerified: response.user.isVerified,
          emailVerified: response.user.emailVerified,
          authProvider: response.user.authProvider,
          name: `${userFirstName} ${userLastName}`.trim() || email, // Fallback to email if name is empty
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        console.log('Email registration successful, user data:', userData); // Debug log

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      console.error('Email registration error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // EMAIL REGISTER WITH OTP
  const emailRegisterWithOTP = async (firstName, lastName, email, password, otp) => {
    try {
      const response = await authService.emailRegisterWithOTP(firstName, lastName, email, password, otp);

      if (response.success && response.user) {
        // Ensure we have valid firstName and lastName
        const userFirstName = response.user.firstName || firstName || '';
        const userLastName = response.user.lastName || lastName || '';

        const userData = {
          id: response.user.id,
          firstName: userFirstName,
          lastName: userLastName,
          email: response.user.email,
          isVerified: response.user.isVerified,
          emailVerified: response.user.emailVerified,
          authProvider: response.user.authProvider,
          name: `${userFirstName} ${userLastName}`.trim() || email, // Fallback to email if name is empty
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        console.log('Email registration with OTP successful, user data:', userData); // Debug log

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      console.error('Email registration with OTP error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // EMAIL OTP METHODS
  const requestEmailOTP = async (email, purpose = "email_verification") => {
    try {
      return await authService.requestEmailOTP(email, purpose);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const verifyEmailOTP = async (email, otp, purpose = "email_verification") => {
    try {
      return await authService.verifyEmailOTP(email, otp, purpose);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // LOGIN (Unified - accepts mobile number or email)
  const login = async (identifier, password) => {
    try {
      const response = await authService.login(identifier, password);

      if (response.success && response.user) {
        // Ensure we have valid firstName and lastName
        const firstName = response.user.firstName || '';
        const lastName = response.user.lastName || '';

        const userData = {
          id: response.user.id,
          firstName: firstName,
          lastName: lastName,
          mobileNumber: response.user.mobileNumber,
          email: response.user.email,
          isVerified: response.user.isVerified,
          emailVerified: response.user.emailVerified,
          name: `${firstName} ${lastName}`.trim() || identifier, // Fallback to identifier if name is empty
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        console.log('Login successful, user data:', userData); // Debug log

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      console.error('Login error:', error);
      authService.logout();
      setUser(null);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // EMAIL LOGIN
  const emailLogin = async (email, password) => {
    try {
      const response = await authService.emailLogin(email, password);

      if (response.success && response.user) {
        // Ensure we have valid firstName and lastName
        const firstName = response.user.firstName || '';
        const lastName = response.user.lastName || '';

        const userData = {
          id: response.user.id,
          firstName: firstName,
          lastName: lastName,
          email: response.user.email,
          isVerified: response.user.isVerified,
          emailVerified: response.user.emailVerified,
          authProvider: response.user.authProvider,
          name: `${firstName} ${lastName}`.trim() || email, // Fallback to email if name is empty
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        console.log('Email login successful, user data:', userData); // Debug log

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
      console.error('Email login error:', error);
      authService.logout();
      setUser(null);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // LOGOUT
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  // OTP
  const requestOTP = async (mobileNumber, purpose = "verification") => {
    try {
      return await authService.requestOTP(mobileNumber, purpose);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const verifyOTP = async (mobileNumber, otp, purpose = "verification") => {
    try {
      return await authService.verifyOTP(mobileNumber, otp, purpose);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const forgotPassword = async (mobileNumber) => {
    try {
      return await authService.forgotPassword(mobileNumber);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const resetPassword = async (mobileNumber, otp, newPassword) => {
    try {
      return await authService.resetPassword(mobileNumber, otp, newPassword);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // EMAIL-BASED PASSWORD RESET
  const forgotPasswordEmail = async (email) => {
    try {
      return await authService.forgotPasswordEmail(email);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  const resetPasswordEmail = async (email, otp, newPassword) => {
    try {
      return await authService.resetPasswordEmail(email, otp, newPassword);
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // UPDATE PROFILE
  const updateProfile = async (profileData) => {
    if (!user) throw new Error("Not logged in");
    try {
      const response = await authService.updateProfile(profileData);

      if (response.success && response.user) {
        // Ensure we have valid firstName and lastName
        const firstName = response.user.firstName || user.firstName || '';
        const lastName = response.user.lastName || user.lastName || '';

        const updatedUser = {
          ...user,
          ...response.user,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim() || user.email || user.mobileNumber,
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        console.log('Profile updated, user data:', updatedUser); // Debug log

        return { success: true, message: "Profile updated", user: updatedUser };
      }

      throw new Error(response.message || "Profile update failed");
    } catch (error) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // Check required user info
  const hasCompleteContactInfo = () => {
    if (!user) return false;

    return [
      user.firstName,
      user.lastName,
      user.mobileNumber,
      user.address,
      user.city,
      user.state,
    ].every((val) => val && val.trim() !== "");
  };

  const value = {
    user,
    loading,
    register,
    emailRegister,
    emailRegisterWithOTP,
    login,
    emailLogin,
    logout,
    requestOTP,
    verifyOTP,
    requestEmailOTP,
    verifyEmailOTP,
    forgotPassword,
    resetPassword,
    forgotPasswordEmail,
    resetPasswordEmail,
    updateProfile,
    hasCompleteContactInfo,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="relative flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute w-16 h-16 border-4 border-blue-100 rounded-full"></div>
          {/* Spinning Ring */}
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {/* Icon/Logo in center (optional, or just keep spinner) */}
        </div>
        <p className="mt-4 text-gray-500 font-medium animate-pulse">Initializing Ayropath...</p>
      </div>
    );
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
