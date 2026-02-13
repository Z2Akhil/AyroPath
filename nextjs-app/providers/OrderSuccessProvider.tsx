'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface OrderSuccessContextType {
    isOrderSuccess: boolean;
    orderData: any;
    showSuccessCard: (data: any) => void;
    hideSuccessCard: () => void;
}

const OrderSuccessContext = createContext<OrderSuccessContextType | undefined>(undefined);

export const useOrderSuccess = () => {
    const context = useContext(OrderSuccessContext);
    if (!context) {
        throw new Error('useOrderSuccess must be used within an OrderSuccessProvider');
    }
    return context;
};

export const OrderSuccessProvider = ({ children }: { children: ReactNode }) => {
    const [isOrderSuccess, setIsOrderSuccess] = useState(false);
    const [orderData, setOrderData] = useState<any>(null);

    const showSuccessCard = (data: any) => {
        setOrderData(data);
        setIsOrderSuccess(true);
    };

    const hideSuccessCard = () => {
        setIsOrderSuccess(false);
        setOrderData(null);
    };

    return (
        <OrderSuccessContext.Provider value={{ isOrderSuccess, orderData, showSuccessCard, hideSuccessCard }}>
            {children}
        </OrderSuccessContext.Provider>
    );
};
