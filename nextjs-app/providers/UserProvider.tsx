'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserContextType } from '@/types';
import { authApi } from '@/lib/api/authApi';

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                console.error('Error parsing user from localStorage', e);
            }
        }
        setLoading(false);
    }, []);

    const login = async (identifier: string, password?: string) => {
        try {
            const result = await authApi.login(identifier, password);
            if (result.success && result.user && result.token) {
                const userWithToken = { ...result.user, authToken: result.token };
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('authToken', result.token);
                return { success: true };
            }
            return { success: false, message: result.message || 'Login failed' };
        } catch (error: any) {
            console.error('Login error', error);
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (firstName: string, lastName: string, mobileNumber: string, password?: string, email?: string) => {
        try {
            const result = await authApi.register(firstName, lastName, mobileNumber, password, email);
            if (result.success && result.user && result.token) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('authToken', result.token);
                return { success: true };
            }
            return { success: false, message: result.message || 'Registration failed' };
        } catch (error: any) {
            console.error('Registration error', error);
            return { success: false, message: error.response?.data?.message || 'Registration failed' };
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        setUser(null);
    };

    const requestOTP = async (mobileNumber: string, purpose: string = 'verification') => {
        try {
            const result = await authApi.requestOTP(mobileNumber, purpose);
            return { success: result.success, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to request OTP' };
        }
    };

    const verifyOTP = async (mobileNumber: string, otp: string, purpose: string = 'verification') => {
        try {
            const result = await authApi.verifyOTP(mobileNumber, otp, purpose);
            return { success: result.success, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to verify OTP' };
        }
    };

    const forgotPassword = async (mobileNumber: string) => {
        try {
            const result = await authApi.forgotPassword(mobileNumber);
            return { success: result.success, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to request password reset' };
        }
    };

    const resetPassword = async (mobileNumber: string, otp: string, newPassword?: string) => {
        try {
            const result = await authApi.resetPassword(mobileNumber, otp, newPassword);
            return { success: result.success, message: result.message };
        } catch (error: any) {
            return { success: false, message: error.response?.data?.message || 'Failed to reset password' };
        }
    };

    const value: UserContextType = {
        user,
        loading,
        login,
        register,
        logout,
        requestOTP,
        verifyOTP,
        forgotPassword,
        resetPassword,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};
