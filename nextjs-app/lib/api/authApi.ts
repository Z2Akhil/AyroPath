import { axiosInstance as api } from "./axiosInstance";
import { Address, User } from "@/types";

export interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
    token?: string;
    isNewUser?: boolean;
    verificationId?: string;
    data?: unknown;
}

export interface AddressResponse {
    success: boolean;
    message?: string;
    address?: Address;
    addresses?: Address[];
}

export const authApi = {
    async requestOTP(mobileNumber: string, purpose: string = 'login'): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/otp/request', { mobileNumber, purpose });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to send OTP');
        }
    },

    // Verify OTP and login (or indicate new user)
    async otpLogin(mobileNumber: string, otp: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/otp-login', { mobileNumber, otp });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'OTP verification failed');
        }
    },

    // Complete registration for new users after OTP verified
    async otpRegister(mobileNumber: string, firstName: string, email?: string): Promise<AuthResponse> {
        try {
            const response = await api.post('/auth/otp-register', { mobileNumber, firstName, email });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Registration failed');
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

    // Address management
    async getAddresses(): Promise<AddressResponse> {
        const response = await api.get('/user/addresses');
        return response.data;
    },

    async addAddress(address: Omit<Address, '_id' | 'isDefault'> & { isDefault?: boolean }): Promise<AddressResponse> {
        try {
            const response = await api.post('/user/addresses', address);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add address');
        }
    },

    async updateAddress(id: string, address: Partial<Omit<Address, '_id'>>): Promise<AddressResponse> {
        try {
            const response = await api.put(`/user/addresses/${id}`, address);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update address');
        }
    },

    async deleteAddress(id: string): Promise<AddressResponse> {
        try {
            const response = await api.delete(`/user/addresses/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete address');
        }
    },
};

export default authApi;
