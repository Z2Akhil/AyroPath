'use client';

import { ReactNode } from 'react';
import { UserProvider } from './UserProvider';
import { ProductProvider } from './ProductProvider';
import { CartProvider } from './CartProvider';
import { OrderSuccessProvider } from './OrderSuccessProvider';
import { SiteSettingsProvider } from './SiteSettingsProvider';
import { ToastProvider } from './ToastProvider';
import { AuthModalProvider } from './AuthModalProvider';
import { ToastContainer } from '@/components/ui/Toast';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <SiteSettingsProvider>
                <UserProvider>
                    <AuthModalProvider>
                        <ProductProvider>
                            <CartProvider>
                                <OrderSuccessProvider>
                                    {children}
                                    <ToastContainer />
                                </OrderSuccessProvider>
                            </CartProvider>
                        </ProductProvider>
                    </AuthModalProvider>
                </UserProvider>
            </SiteSettingsProvider>
        </ToastProvider>
    );
}
