import { useState } from 'react';
import CartApi from '@/lib/api/cartApi';
import { useToast } from '@/providers/ToastProvider';

export interface ValidationDialogConfig {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'info' | 'success' | 'error';
    confirmText: string;
    cancelText: string;
    onConfirm: (() => Promise<any>) | null;
    onCancel: (() => void) | null;
    data: any;
}

export const useCartValidation = () => {
    const [validationDialog, setValidationDialog] = useState<ValidationDialogConfig>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        onConfirm: null,
        onCancel: null,
        data: null
    });

    const { success, error: showError } = useToast();

    const showValidationDialog = (config: Partial<ValidationDialogConfig>) => {
        setValidationDialog(prev => ({
            ...prev,
            ...config,
            isOpen: true
        }));
    };

    const closeValidationDialog = () => {
        setValidationDialog(prev => ({ ...prev, isOpen: false }));
    };

    const checkForDuplicateTests = (cartItems: any[], newProduct: any) => {
        if (newProduct.type === 'TEST') {
            for (const cartItem of cartItems) {
                if (cartItem.productType === 'PROFILE' || cartItem.productType === 'OFFER') {
                    const isIncluded = cartItem.childs?.some((child: any) =>
                        child.code === newProduct.code || child.id === newProduct.code
                    );

                    if (isIncluded) {
                        return {
                            hasDuplicates: true,
                            action: 'prevent',
                            message: `Test "${newProduct.name}" is already included in ${cartItem.productType} "${cartItem.name}". Cannot add duplicate test.`,
                            details: {
                                testCode: newProduct.code,
                                testName: newProduct.name,
                                includedIn: cartItem.productCode,
                                includedInName: cartItem.name,
                                includedInType: cartItem.productType
                            }
                        };
                    }
                }
            }
        }

        if (newProduct.type === 'PROFILE' || newProduct.type === 'OFFER') {
            const duplicateTests: any[] = [];

            for (const cartItem of cartItems) {
                if (cartItem.productType === 'TEST') {
                    const isIncluded = newProduct.childs?.some((child: any) =>
                        child.code === cartItem.productCode || child.id === cartItem.productCode
                    );

                    if (isIncluded) {
                        duplicateTests.push({
                            testCode: cartItem.productCode,
                            testName: cartItem.name,
                            profileOfferCode: newProduct.code,
                            profileOfferName: newProduct.name,
                            profileOfferType: newProduct.type
                        });
                    }
                }
            }

            if (duplicateTests.length > 0) {
                const testNames = duplicateTests.map(t => `"${t.testName}"`).join(', ');
                return {
                    hasDuplicates: true,
                    action: 'remove',
                    message: `${newProduct.type} "${newProduct.name}" includes ${duplicateTests.length} test(s) already in your cart: ${testNames}.`,
                    details: {
                        duplicateTests: duplicateTests,
                        profileOfferCode: newProduct.code,
                        profileOfferName: newProduct.name,
                        profileOfferType: newProduct.type
                    }
                };
            }
        }

        return {
            hasDuplicates: false,
            action: 'allow',
            message: 'No duplicate tests found'
        };
    };

    const addToCartWithValidation = async (productCode: string, productType: string, productName: string, quantity = 1, guestSessionId: string | null = null) => {
        try {
            const cartResponse = await CartApi.getCartWithDetails(guestSessionId);

            if (!cartResponse.success) {
                showError('Failed to load cart');
                return { success: false, error: 'Failed to load cart' };
            }

            const productResponse = await CartApi.getProductWithChilds(productCode, productType);

            const newProduct = {
                code: productCode,
                type: productType,
                name: productName,
                childs: productResponse.childs || []
            };

            const cartItems = cartResponse.cart?.items || [];
            const validationResult = checkForDuplicateTests(cartItems, newProduct);

            if (validationResult.hasDuplicates) {
                if (validationResult.action === 'prevent') {
                    showValidationDialog({
                        title: 'Test Already Included',
                        message: validationResult.message,
                        type: 'warning',
                        confirmText: 'OK',
                        cancelText: 'Cancel',
                        onConfirm: async () => {
                            closeValidationDialog();
                            return { success: false, prevented: true };
                        },
                        onCancel: () => {
                            closeValidationDialog();
                        },
                        data: validationResult.details || {}
                    });
                    return { success: false, requiresConfirmation: true, validation: validationResult };
                }
                else if (validationResult.action === 'remove') {
                    const duplicateTests = validationResult.details?.duplicateTests || [];
                    const testCodes = duplicateTests.map((t: any) => t.testCode);

                    showValidationDialog({
                        title: 'Remove Duplicate Tests',
                        message: validationResult.message + ` Remove duplicate test(s) and add ${validationResult.details?.profileOfferType || 'item'}?`,
                        type: 'info',
                        confirmText: `Remove tests & add ${validationResult.details?.profileOfferType || 'item'}`,
                        cancelText: 'Cancel',
                        onConfirm: async () => {
                            try {
                                const confirmResponse = await CartApi.addToCartWithConfirmation(
                                    productCode,
                                    productType,
                                    quantity,
                                    testCodes,
                                    guestSessionId
                                );

                                if (confirmResponse.success) {
                                    success(`${validationResult.details?.profileOfferType || 'Item'} added to cart${testCodes.length > 0 ? ` (${testCodes.length} duplicate test(s) removed)` : ''}`);
                                    closeValidationDialog();
                                    return { success: true, cart: confirmResponse.cart, removedTests: testCodes };
                                } else {
                                    showError('Failed to add item to cart');
                                    closeValidationDialog();
                                    return { success: false, error: 'Failed to add item to cart' };
                                }
                            } catch (err: any) {
                                console.error('Error adding to cart with confirmation:', err);
                                showError('Failed to add item to cart');
                                closeValidationDialog();
                                return { success: false, error: err.message };
                            }
                        },
                        onCancel: () => {
                            closeValidationDialog();
                        },
                        data: validationResult.details || {}
                    });
                    return { success: false, requiresConfirmation: true, validation: validationResult };
                }
            }

            const addResponse = await CartApi.addToCart(productCode, productType, quantity, guestSessionId);

            if (addResponse.success) {
                if (addResponse.alreadyInCart) {
                    success('Item is already in your cart');
                    return { success: true, cart: addResponse.cart, alreadyInCart: true };
                } else {
                    success('Item added to cart successfully');
                    return { success: true, cart: addResponse.cart };
                }
            } else {
                showError(addResponse.message || 'Failed to add item to cart');
                return { success: false, error: addResponse.message };
            }

        } catch (error: any) {
            console.error('Error in addToCartWithValidation:', error);
            showError(error.message || 'Failed to add item to cart');
            return { success: false, error: error.message };
        }
    };

    return {
        validationDialog,
        closeValidationDialog,
        addToCartWithValidation,
        showValidationDialog
    };
};
