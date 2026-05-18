'use client';

// Login and registration are now unified via OTP in LoginForm.
// This component simply delegates to LoginForm.
import LoginForm from './LoginForm';

interface RegisterFormProps {
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onClose }) => {
    return <LoginForm onClose={onClose} />;
};

import React from 'react';
export default RegisterForm;
