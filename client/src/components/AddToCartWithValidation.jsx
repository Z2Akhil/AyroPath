import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCartValidation } from '../hooks/useCartValidation';
import ConfirmationDialog from './ConfirmationDialog';
import AuthModal from './AuthModal';
import { useUser } from '../context/userContext';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';

const AddToCartWithValidation = ({
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
  const { refreshCart } = useCart();
  // const navigate = useNavigate(); // Not needed for popup
  // const location = useLocation(); // Not needed for popup
  const {
    validationDialog,
    closeValidationDialog,
    addToCartWithValidation
  } = useCartValidation();

  const handleAddToCart = async () => {
    // FORCE LOGIN: Open Modal if not logged in
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
        // Refresh cart context to update UI immediately
        await refreshCart();
        // If item was already in cart, we might want to show a different message
        if (result.alreadyInCart) {
          // The hook should handle this with a toast message
        }
      } else if (!result.requiresConfirmation) {
        onError(result.error || 'Failed to add to cart');
      }
      // If requiresConfirmation is true, the dialog will be shown by the hook
    } catch (error) {
      console.error('Error adding to cart:', error);
      onError(error.message || 'Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dialog confirmation success
  const handleDialogSuccess = async (result) => {
    if (result?.success) {
      onSuccess(result);
      // Refresh cart context to update UI immediately
      await refreshCart();
    }
  };

  return (
    <>
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-xs active:scale-95 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="font-semibold text-sm">Adding...</span>
          </>
        ) : (
          <>
            {showIcon && <ShoppingCart className="w-5 h-5" />}
            <span className="font-semibold text-sm">{buttonText}</span>
          </>
        )}
      </button>

      {/* Confirmation Dialog for duplicate tests */}
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
        type={validationDialog.type}
        confirmText={validationDialog.confirmText}
        cancelText={validationDialog.cancelText}
        isLoading={isLoading}
      />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
};

export default AddToCartWithValidation;
