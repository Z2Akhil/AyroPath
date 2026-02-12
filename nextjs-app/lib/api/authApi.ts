import { axiosInstance } from './axiosInstance';

export const requestOTP = async (mobileNumber?: string, email?: string, purpose = 'verification') => {
  const response = await axiosInstance.post('/auth/otp/request', { mobileNumber, email, purpose });
  return response.data;
};

export const verifyOTP = async (otp: string, mobileNumber?: string, email?: string, purpose = 'verification') => {
  const response = await axiosInstance.post('/auth/otp/verify', { otp, mobileNumber, email, purpose });
  return response.data;
};

export const register = async (data: {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email?: string;
  password: string;
}) => {
  const response = await axiosInstance.post('/auth/register', data);
  return response.data;
};

export const login = async (identifier: string, password: string) => {
  const response = await axiosInstance.post('/auth/login', { identifier, password });
  return response.data;
};