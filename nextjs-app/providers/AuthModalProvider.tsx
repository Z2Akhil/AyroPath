'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';

const Modal = dynamic(() => import('@/components/ui/Modal'), { ssr: false });
const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), { ssr: false });
const RegisterForm = dynamic(() => import('@/components/auth/RegisterForm'), { ssr: false });
const ForgotPasswordForm = dynamic(() => import('@/components/auth/ForgotPasswordForm'), { ssr: false });

type AuthView = 'login' | 'register' | 'forgot-password';

interface AuthModalContextType {
  isOpen: boolean;
  openAuth: (view?: AuthView) => void;
  closeAuth: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const openAuth = (view: AuthView = 'login') => {
    setCurrentView(view);
    setIsOpen(true);
  };

  const closeAuth = () => {
    setIsOpen(false);
  };

  const switchToLogin = () => setCurrentView('login');
  const switchToRegister = () => setCurrentView('register');
  const switchToForgotPassword = () => setCurrentView('forgot-password');

  return (
    <AuthModalContext.Provider value={{ isOpen, openAuth, closeAuth }}>
      {children}
      {isOpen && (
        <Modal onClose={closeAuth}>
          {currentView === 'login' && (
            <LoginForm onClose={closeAuth} onSwitchToRegister={switchToRegister} onForgotPassword={switchToForgotPassword} />
          )}
          {currentView === 'register' && (
            <RegisterForm onClose={closeAuth} onSwitchToLogin={switchToLogin} />
          )}
          {currentView === 'forgot-password' && (
            <ForgotPasswordForm onClose={closeAuth} onSwitchToLogin={switchToLogin} />
          )}
        </Modal>
      )}
    </AuthModalContext.Provider>
  );
};