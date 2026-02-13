'use client';

import { ReactNode } from 'react';
import { UserProvider } from './UserProvider';
import { ProductProvider } from './ProductProvider';
import { CartProvider } from './CartProvider';
import { OrderSuccessProvider } from './OrderSuccessProvider';
import { SiteSettingsProvider } from './SiteSettingsProvider';
import { ToastProvider } from './ToastProvider';
import { ToastContainer } from '@/components/Toast';

export function ClientProviders({ children }: { children: ReactNode }) {
    return (
        <ToastProvider>
            <SiteSettingsProvider>
                <UserProvider>
                    <ProductProvider>
                        <CartProvider>
                            <OrderSuccessProvider>
                                {children}
                                <ToastContainer />
                            </OrderSuccessProvider>
                        </CartProvider>
                    </ProductProvider>
                </UserProvider>
            </SiteSettingsProvider>
        </ToastProvider>
    );
}
