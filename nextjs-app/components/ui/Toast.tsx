'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { Toast as ToastType } from '@/types';

const Toast = ({ toast }: { toast: ToastType }) => {
    const { removeToast } = useToast();
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation 100ms before removal
        const timer = setTimeout(() => {
            setIsExiting(true);
        }, toast.duration - 200);

        return () => clearTimeout(timer);
    }, [toast.duration]);

    useEffect(() => {
        if (isExiting) {
            const timer = setTimeout(() => {
                removeToast(toast.id);
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [isExiting, removeToast, toast.id]);

    const getToastStyles = () => {
        const baseStyles = "flex items-center p-4 mb-3 rounded-lg shadow-lg border transform transition-all duration-300 ease-out";

        let typeStyles = "";
        switch (toast.type) {
            case 'success':
                typeStyles = "bg-green-50 border-green-200 text-green-800";
                break;
            case 'error':
                typeStyles = "bg-red-50 border-red-200 text-red-800";
                break;
            case 'warning':
                typeStyles = "bg-yellow-50 border-yellow-200 text-yellow-800";
                break;
            case 'info':
                typeStyles = "bg-blue-50 border-blue-200 text-blue-800";
                break;
            default:
                typeStyles = "bg-gray-50 border-gray-200 text-gray-800";
        }

        const animationStyles = isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100";
        return `${baseStyles} ${typeStyles} ${animationStyles}`;
    };

    const getIcon = () => {
        const iconClass = "w-5 h-5 flex-shrink-0";
        switch (toast.type) {
            case 'success':
                return <CheckCircle className={`${iconClass} text-green-500`} />;
            case 'error':
                return <XCircle className={`${iconClass} text-red-500`} />;
            case 'warning':
                return <AlertCircle className={`${iconClass} text-yellow-500`} />;
            case 'info':
                return <Info className={`${iconClass} text-blue-500`} />;
            default:
                return <Info className={`${iconClass} text-gray-500`} />;
        }
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                    {getIcon()}
                    <div className="text-sm font-medium">{toast.message}</div>
                </div>
                <button
                    onClick={() => setIsExiting(true)}
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export const ToastContainer = () => {
    const { toasts } = useToast();

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] w-80 max-w-full pointer-events-none">
            <div className="pointer-events-auto">
                {toasts.map((toast) => (
                    <Toast key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
