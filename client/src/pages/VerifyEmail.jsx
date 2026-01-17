import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import { useUser } from '../context/userContext';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

// Global cache to store verification promises
// This ensures that even if the component unmounts/remounts (Strict Mode),
// the exact same network request is reused and the result is shared.
const verificationCache = new Map();

const VerifyEmail = () => {
    const { token: pathToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { updateUserLocally } = useUser();

    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    // Get token from path or query params
    const token = pathToken || searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Invalid verification link.');
            return;
        }

        const verifyToken = async () => {
            // Check if we already have a promise for this token
            if (!verificationCache.has(token)) {
                // Create the request promise and cache it
                const promise = axiosInstance.get(`/auth/verify-email/${token}`)
                    .then(response => {
                        if (response.data.success) {
                            return {
                                status: 'success',
                                message: response.data.message || 'Email verified successfully!',
                                shouldUpdateUser: true
                            };
                        } else {
                            throw new Error(response.data.message || 'Verification failed');
                        }
                    })
                    .catch(error => {
                        console.error('Verification error:', error);
                        const errorMessage = error.response?.data?.message || 'Verification failed. The link may be invalid or expired.';

                        // Treat "already verified" as success
                        if (errorMessage.toLowerCase().includes("already verified")) {
                            return {
                                status: 'success',
                                message: 'Email is already verified!',
                                shouldUpdateUser: true
                            };
                        }

                        return { status: 'error', message: errorMessage };
                    });

                verificationCache.set(token, promise);
            }

            // Await the shared promise (whether created by us or a previous instance)
            try {
                const result = await verificationCache.get(token);

                setStatus(result.status);
                setMessage(result.message);

                if (result.shouldUpdateUser) {
                    updateUserLocally({ emailVerified: true });
                }
            } catch (err) {
                setStatus('error');
                setMessage('An unexpected error occurred.');
            }
        };

        verifyToken();

    }, [token, updateUserLocally]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <h2 className="text-xl font-semibold text-gray-800">Verifying Email...</h2>
                        <p className="text-gray-600 mt-2">Please wait while we verify your email address.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Verified!</h2>
                        <p className="text-gray-600 mt-2 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/account')}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            Go to Account <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
                        <p className="text-gray-600 mt-2 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="bg-gray-800 text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-900 transition"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;
