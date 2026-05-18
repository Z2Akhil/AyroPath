'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { X } from 'lucide-react';
import dynamic from 'next/dynamic';

const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), { ssr: false });

interface AuthModalContextType {
    isOpen: boolean;
    openAuth: () => void;
    closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) throw new Error('useAuthModal must be used within AuthModalProvider');
    return context;
};

function AuthSheet({ onClose }: { onClose: () => void }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handler);
        };
    }, [onClose]);

    const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

    return (
        <div className="fixed inset-0 z-[999] flex">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                style={{ transition: 'opacity 0.3s ease', opacity: visible ? 1 : 0 }}
                onClick={onClose}
            />

            {/* ── Mobile bottom sheet ── */}
            <div
                className="sm:hidden absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl px-6 pt-5 pb-10 shadow-2xl z-10 max-h-[92dvh] overflow-y-auto"
                style={{
                    transform: visible ? 'translateY(0)' : 'translateY(100%)',
                    transition: `transform 0.35s ${EASE}`,
                }}
            >
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    aria-label="Close"
                >
                    <X className="w-4 h-4" />
                </button>
                <LoginForm onClose={onClose} />
            </div>

            {/* ── Desktop right-side panel ── */}
            <div
                className="hidden sm:flex flex-col absolute top-0 right-0 bottom-0 w-[400px] bg-white shadow-2xl z-10 overflow-y-auto"
                style={{
                    transform: visible ? 'translateX(0)' : 'translateX(100%)',
                    transition: `transform 0.35s ${EASE}`,
                }}
            >
                <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 shrink-0">
                    <span className="text-sm font-semibold text-gray-400 tracking-wide uppercase">Account</span>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 px-8 py-8">
                    <LoginForm onClose={onClose} />
                </div>
                <div className="px-8 py-4 border-t border-gray-100 shrink-0">
                    <p className="text-xs text-gray-400 text-center">
                        Ayropath © {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    const openAuth = useCallback(() => setIsOpen(true), []);
    const closeAuth = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        const handler = () => setIsOpen(true);
        window.addEventListener('auth:session-expired', handler);
        return () => window.removeEventListener('auth:session-expired', handler);
    }, []);

    return (
        <AuthModalContext.Provider value={{ isOpen, openAuth, closeAuth }}>
            {children}
            {isOpen && <AuthSheet onClose={closeAuth} />}
        </AuthModalContext.Provider>
    );
};
