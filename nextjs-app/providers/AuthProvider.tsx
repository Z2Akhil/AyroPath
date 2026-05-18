'use client';

// Legacy AuthProvider — superseded by UserProvider.
// Kept as a stub so any existing imports do not break.
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
    user: null;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: false, isAuthenticated: false });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={{ user: null, loading: false, isAuthenticated: false }}>
        {children}
    </AuthContext.Provider>
);
