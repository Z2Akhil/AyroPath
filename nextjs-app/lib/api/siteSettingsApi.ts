import { axiosInstance } from './axiosInstance';
import { SiteSettings } from '@/types';

export const fetchSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const response = await axiosInstance.get('/settings');

    if (response.data?.success) {
      return response.data.data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};