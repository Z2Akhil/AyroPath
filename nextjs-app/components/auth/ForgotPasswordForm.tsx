'use client';

// Password reset is no longer needed — authentication is OTP-only.
// This component is kept as a stub for backward compatibility with any remaining imports.
import LoginForm from './LoginForm';

interface ForgotPasswordFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onClose }) => {
    return <LoginForm onClose={onClose} />;
};

import React from 'react';
export default ForgotPasswordForm;
