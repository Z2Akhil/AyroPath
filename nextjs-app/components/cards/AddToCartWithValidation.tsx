"use client";

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartValidation, ValidationDialogConfig } from '@/hooks/useCartValidation';
import ConfirmationDialog from '../ui/ConfirmationDialog';
import AuthModal from '../ui/AuthModal';
import { useUser } from '@/providers/UserProvider';
import { useCart } from '@/providers/CartProvider';
import Link from 'next/link';

interface AddToCartWithValidationProps {
    productCode: string;
    productType: string;
    productName: string;
    quantity?: number;
    className?: string;
    buttonText?: string;
    showIcon?: boolean;
    onSuccess?: (result: any) => void;
    onError?: (error: string) => void;
}

const AddToCartWithValidation: React.FC<AddToCartWithValidationProps> = ({
    productCode,
    productType,
    productName,
    quantity = 1,
    className = '',
    buttonText = 'Add to Cart',
    showIcon = true,
    onSuccess = () => { },
    onError = () => { }
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [authOpen, setAuthOpen] = useState(false);
    const { user } = useUser();
    const { cart, refreshCart } = useCart();
    const {
        validationDialog,
        closeValidationDialog,
        addToCartWithValidation
    } = useCartValidation();

    // Check if item is already in cart
    const isInCart = cart?.items?.some(
        item => item.productCode === productCode && item.productType === productType
    );

    if (isInCart) {
        return (
            <Link
                href="/cart"
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm active:scale-95 bg-green-600 text-white hover:bg-green-700 hover:shadow-md ${className}`}
            >
                <span className="font-bold text-sm">✓ Go to Cart</span>
            </Link>
        );
    }

    const handleAddToCart = async () => {
        if (!user) {
            setAuthOpen(true);
            return;
        }

        setIsLoading(true);
        try {
            const result = await addToCartWithValidation(
                productCode,
                productType,
                productName,
                quantity
            );

            if (result.success) {
                onSuccess(result);
                await refreshCart();
            } else if (!result.requiresConfirmation) {
                onError(result.error || 'Failed to add to cart');
            }
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            onError(error.message || 'Failed to add to cart');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDialogSuccess = async (result: any) => {
        if (result?.success) {
            onSuccess(result);
            await refreshCart();
        }
    };

    return (
        <>
            <button
                onClick={handleAddToCart}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm active:scale-95 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            >
                {isLoading ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span className="font-bold text-sm">Adding...</span>
                    </>
                ) : (
                    <>
                        {showIcon && <ShoppingCart className="w-5 h-5" />}
                        <span className="font-bold text-sm">{buttonText}</span>
                    </>
                )}
            </button>

            <ConfirmationDialog
                isOpen={validationDialog.isOpen}
                onClose={closeValidationDialog}
                onConfirm={async () => {
                    if (validationDialog.onConfirm) {
                        const result = await validationDialog.onConfirm();
                        await handleDialogSuccess(result);
                    }
                    closeValidationDialog();
                }}
                title={validationDialog.title}
                message={validationDialog.message}
                type={validationDialog.type === 'error' ? 'danger' : validationDialog.type === 'success' ? 'info' : validationDialog.type}
                confirmText={validationDialog.confirmText}
                cancelText={validationDialog.cancelText}
                isLoading={isLoading}
            />
            {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
        </>
    );
};

export default AddToCartWithValidation;
