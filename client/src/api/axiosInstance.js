import axios from "axios";

const isProduction = import.meta.env.MODE === "production";

// Decide which base URL to use
const baseURL = isProduction
  ? `${import.meta.env.VITE_TARGET_URL}`
  : "http://localhost:3000/api";

export const axiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 (Unauthorized) errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear exact items used in UserProvider/authService
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");

      // Set flag so we can show a message/open login modal after reload
      localStorage.setItem("sessionExpired", "true");

      // Reloading ensures all contexts (User, Cart, etc.) are reset cleanly
      window.location.reload();

      // Return a pending promise to halt the error chain
      // This prevents the calling code (like Form.jsx) from catching the error calls alert()
      return new Promise(() => { });
    }
    return Promise.reject(error);
  }
);
