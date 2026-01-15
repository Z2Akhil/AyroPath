import React, { useState, useEffect } from "react";
import { useUser } from "../context/userContext";
import { useToast } from "../context/ToastContext";
import { authService } from "../services/authService";
import { AlertTriangle, X, CheckCircle, Mail } from "lucide-react";
import { Link } from "react-router-dom";
const VerificationAlert = () => {
    const { user } = useUser();
    const { success, error: toastError } = useToast();
    const [isVisible, setIsVisible] = useState(true);
    const [loading, setLoading] = useState(false);

    // Check if we should show the banner
    useEffect(() => {
        // If user is not logged in or is already verified, don't show
        if (!user || user.emailVerified) {
            setIsVisible(false);
            return;
        }

        // Check if user has an email
        if (!user.email) {
            setIsVisible(true);
            return;
        }

        // Default to visible for unverified users
        setIsVisible(true);
    }, [user]);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    const handleResend = async () => {
        try {
            setLoading(true);
            await authService.resendVerification();
            success("Verification email sent!");
            setIsVisible(false); // Hide after sending
        } catch (err) {
            console.error(err);
            toastError(err.response?.data?.message || "Failed to send email");
        } finally {
            setLoading(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3 relative transition-all duration-300">
            <div className="container mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-yellow-800">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                        {!user?.email ? (
                            <span>
                                Your profile is missing an email address. <Link to="/account" className="underline font-bold hover:text-yellow-900">Add Email</Link> for better security.
                            </span>
                        ) : (
                            <span>
                                Your email address <strong>{user.email}</strong> is not verified. Please verify it to secure your account.
                            </span>
                        )}
                    </p>
                </div>

                {user?.email && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleResend}
                            disabled={loading}
                            className="text-sm bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold py-1.5 px-3 rounded transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? "Sending..." : (
                                <>
                                    <Mail className="w-4 h-4" /> Resend Link
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="text-yellow-500 hover:text-yellow-700 focus:outline-none"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                )}

                {!user?.email && (
                    <button
                        onClick={handleDismiss}
                        className="text-yellow-500 hover:text-yellow-700 focus:outline-none sm:ml-auto"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}

            </div>
        </div>
    );
};

export default VerificationAlert;
