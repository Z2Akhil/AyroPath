'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
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

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An error occurred';
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window !== 'undefined') {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    return JSON.parse(savedUser);
                } catch {
                    return null;
                }
            }
        }
        return null;
    });
    const [loading] = useState(false);

    const login = async (identifier: string, password?: string) => {
        try {
            const result = await authApi.login(identifier, password);
            if (result.success && result.user && result.token) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
                localStorage.setItem('authToken', result.token);
                return { success: true };
            }
            return { success: false, message: result.message || 'Login failed' };
        } catch (error) {
            console.error('Login error', error);
            return { success: false, message: getErrorMessage(error) || 'Login failed' };
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
        } catch (error) {
            console.error('Registration error', error);
            return { success: false, message: getErrorMessage(error) || 'Registration failed' };
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
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to request OTP' };
        }
    };

    const verifyOTP = async (mobileNumber: string, otp: string, purpose: string = 'verification') => {
        try {
            const result = await authApi.verifyOTP(mobileNumber, otp, purpose);
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to verify OTP' };
        }
    };

    const forgotPassword = async (mobileNumber: string) => {
        try {
            const result = await authApi.forgotPassword(mobileNumber);
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to request password reset' };
        }
    };

    const resetPassword = async (mobileNumber: string, otp: string, newPassword?: string) => {
        try {
            const result = await authApi.resetPassword(mobileNumber, otp, newPassword);
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to reset password' };
        }
    };

    const updateProfile = async (data: Partial<import('@/types').User>) => {
        try {
            const result = await authApi.updateProfile(data);
            if (result.success && result.user) {
                setUser(result.user);
                localStorage.setItem('user', JSON.stringify(result.user));
            }
            return { success: result.success, message: result.message };
        } catch (error) {
            return { success: false, message: getErrorMessage(error) || 'Failed to update profile' };
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
        updateProfile,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};