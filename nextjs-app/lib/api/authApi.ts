import { axiosInstance as api } from "./axiosInstance";
import { User } from "@/types";

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    data?: unknown;
}

export const authApi = {
    async requestOTP(mobileNumber: string, purpose: string = 'verification'): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/request-otp', {
                mobileNumber,
                purpose,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to request OTP');
        }
    },

    async verifyOTP(mobileNumber: string, otp: string, purpose: string = 'verification'): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/verify-otp', {
                mobileNumber,
                otp,
                purpose,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to verify OTP');
        }
    },

    async register(firstName: string, lastName: string, mobileNumber: string, password?: string, email?: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/register', {
                firstName,
                lastName,
                mobileNumber,
                password,
                email,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    },

    async login(identifier: string, password?: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/login', {
                identifier,
                password,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    },

    async forgotPassword(mobileNumber: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/forgot-password', {
                mobileNumber,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to process forgot password');
        }
    },

    async resetPassword(mobileNumber: string, otp: string, newPassword?: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/reset-password', {
                mobileNumber,
                otp,
                newPassword,
            });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to reset password');
        }
    },

    async resendVerificationPublic(email: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/resend-verification-public', { email });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to resend verification');
        }
    },

    async getProfile(): Promise<AuthResponse> {
        const response = await api.get('/user/profile');
        return response.data;
    },

    async updateProfile(profileData: Partial<User>): Promise<AuthResponse> {
        try {
            const response = await api.put('/user/profile', profileData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },
};

export default authApi;
