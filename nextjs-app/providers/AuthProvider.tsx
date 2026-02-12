'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as authApi from '@/lib/api/authApi';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  mobileNumber?: string;
  email?: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  requestOTP: (mobileNumber?: string, email?: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOTP: (otp: string, mobileNumber?: string, email?: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('authToken');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const payload = JSON.parse(atob(token.split('.')[1]));
          
          if (payload.exp && payload.exp > Date.now() / 1000) {
            setUser(parsed);
          } else {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
          }
        } catch {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await authApi.login(identifier, password);
    if (response.success && response.token) {
      const userData = {
        ...response.user,
        name: `${response.user.firstName} ${response.user.lastName}`.trim(),
      };
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const register = async (data: {
    firstName: string;
    lastName: string;
    mobileNumber: string;
    email?: string;
    password: string;
  }) => {
    const response = await authApi.register(data);
    if (response.success && response.token) {
      const userData = {
        ...response.user,
        name: `${response.user.firstName} ${response.user.lastName}`.trim(),
      };
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  const requestOTP = async (mobileNumber?: string, email?: string) => {
    return await authApi.requestOTP(mobileNumber, email);
  };

  const verifyOTP = async (otp: string, mobileNumber?: string, email?: string) => {
    return await authApi.verifyOTP(otp, mobileNumber, email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        requestOTP,
        verifyOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};