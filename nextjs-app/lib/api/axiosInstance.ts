import axios from 'axios';

const baseURL = typeof window !== 'undefined'
    ? '/api'
    : (process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:3000/api');

export const axiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

axiosInstance.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/otp-login') ||
            error.config?.url?.includes('/auth/otp-register') ||
            error.config?.url?.includes('/auth/otp/');

        if (error.response?.status === 401 && !isAuthRequest && typeof window !== 'undefined') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            // Signal the AuthModalProvider to open the login modal
            window.dispatchEvent(new CustomEvent('auth:session-expired'));
            return new Promise(() => { });
        }
        return Promise.reject(error);
    }
);
