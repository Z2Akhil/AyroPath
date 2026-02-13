'use client';

import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { Toast, ToastContextType } from '@/types';

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idCounter = useRef(0);

    const addToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 5000) => {
        idCounter.current += 1;
        const id = idCounter.current;
        const toast = { id, message, type, duration };

        setToasts(prev => [...prev, toast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(id);
        }, duration);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const success = (message: string, duration?: number) => addToast(message, 'success', duration);
    const error = (message: string, duration?: number) => addToast(message, 'error', duration);
    const warning = (message: string, duration?: number) => addToast(message, 'warning', duration);
    const info = (message: string, duration?: number) => addToast(message, 'info', duration);

    const value: ToastContextType = {
        toasts,
        addToast,
        removeToast,
        success,
        error,
        warning,
        info,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
        </ToastContext.Provider>
    );
};