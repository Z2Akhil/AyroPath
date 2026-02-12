import axios from 'axios';

const baseURL = typeof window !== 'undefined'
  ? '/api'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/auth/login') ||
      error.config?.url?.includes('/auth/email-login');

    if (error.response?.status === 401 && !isLoginRequest && typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.setItem('sessionExpired', 'true');
      window.location.reload();
      return new Promise(() => {});
    }
    return Promise.reject(error);
  }
);