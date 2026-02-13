import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : 'http://localhost:3000/api';

export const adminAxios = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to attach x-api-key
adminAxios.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('admin_auth');
        if (stored) {
            try {
                const authData = JSON.parse(stored);
                if (authData?.apiKey) {
                    config.headers['x-api-key'] = authData.apiKey;
                }
            } catch (e) {
                console.error('Failed to parse admin_auth from localStorage', e);
            }
        }
    }
    return config;
});

// Response interceptor to handle auth errors
adminAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin_auth');
                if (!window.location.pathname.includes('/admin/login')) {
                    window.location.href = '/admin/login';
                }
            }
        }
        return Promise.reject(error);
    }
);
