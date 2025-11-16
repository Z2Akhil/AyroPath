import { useState, useEffect } from 'react';
import { UserContext } from './userContext';
import authService from '../services/authService';

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore user from localStorage
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("authToken");
      const savedUser = localStorage.getItem("user");

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // REGISTER
  const register = async (name, phone, password, otp) => {
    try {
      const nameParts = name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || "";

      const response = await authService.register(firstName, lastName, phone, password, otp);

      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName || ""}`.trim(),
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Registration failed");
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  };

  // LOGIN
  const login = async (phone, password) => {
    try {
      const response = await authService.login(phone, password);

      if (response.success && response.user) {
        const userData = {
          id: response.user.id,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          mobileNumber: response.user.mobileNumber,
          isVerified: response.user.isVerified,
          name: `${response.user.firstName} ${response.user.lastName || ""}`.trim(),
        };

        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return { success: true, user: userData };
      }

      throw new Error(response.message || "Login failed");
    } catch (error) {
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

  // UPDATE PROFILE
  const updateProfile = async (profileData) => {
    if (!user) throw new Error("Not logged in");
    try {
      const response = await authService.updateProfile(profileData);

      if (response.success && response.user) {
        const updatedUser = {
          ...user,
          ...response.user,
          name: `${response.user.firstName} ${response.user.lastName || ""}`.trim(),
        };

        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        return { success: true, message: "Profile updated", user: updatedUser };
      }

      throw new Error(response.message || "Profile update failed");
    } catch (error) {
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
    login,
    logout,
    requestOTP,
    verifyOTP,
    forgotPassword,
    resetPassword,
    updateProfile,
    hasCompleteContactInfo,
  };

  if (loading) return <div>Loading Application...</div>;

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
