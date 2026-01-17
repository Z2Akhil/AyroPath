import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { axiosInstance } from '../api/axiosInstance';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

const VerifyEmail = () => {
    const { token: pathToken } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    const token = pathToken || searchParams.get('token');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link.');
                return;
            }

            try {
                // Find the right URL. backend auth.js has router.get("/verify-email/:token", ...)
                const response = await axiosInstance.get(`/auth/verify-email/${token}`);

                if (response.data.success) {
                    setStatus('success');
                    setMessage(response.data.message || 'Email verified successfully!');
                } else {
                    throw new Error(response.data.message || 'Verification failed');
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        verifyToken();
    }, [token]);

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
