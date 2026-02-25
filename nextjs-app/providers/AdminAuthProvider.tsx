'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import adminAuthService from '@/lib/api/adminAuthService';
import { AdminUser, AdminProfile } from '@/types/admin';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AdminUser | null;
    error: string | null;
    login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AdminUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        try {
            const authenticated = adminAuthService.isAuthenticated();
            setIsAuthenticated(authenticated);

            if (authenticated) {
                const authData = adminAuthService.getStoredAuthData();
                setUser({
                    username: authData?.username || 'Admin',
                    loginTime: authData?.timestamp || '',
                    adminProfile: authData?.adminProfile as AdminProfile
                });
            }
        } catch (err) {
            console.error('Auth status check failed:', err);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (username: string, password: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await adminAuthService.login(username, password);
            if (result.success) {
                setIsAuthenticated(true);
                setUser({
                    username: username,
                    loginTime: result.timestamp || new Date().toISOString(),
                    adminProfile: result.adminProfile as AdminProfile
                });
                return { success: true };
            }
            return { success: false, error: 'Login failed' };
        } catch (err: any) {
            const msg = err.message || 'Login failed';
            setError(msg);
            return { success: false, error: msg };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        adminAuthService.clearAuthData();
        setIsAuthenticated(false);
        setUser(null);
        setError(null);
        router.push('/admin/login');
    };

    const clearError = () => setError(null);

    // Protection logic
    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated && !pathname.includes('/admin/login')) {
                router.push('/admin/login');
            } else if (isAuthenticated && pathname.includes('/admin/login')) {
                router.push('/admin');
            }
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const value = {
        isAuthenticated,
        isLoading,
        user,
        error,
        login,
        logout,
        clearError
    };

    const isRedirectingToLogin = !isLoading && !isAuthenticated && !pathname.includes('/admin/login');
    const isRedirectingToDashboard = !isLoading && isAuthenticated && pathname.includes('/admin/login');
    const shouldShowLoader = isLoading || isRedirectingToLogin || isRedirectingToDashboard;

    return (
        <AuthContext.Provider value={value}>
            {shouldShowLoader ? (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
