import { adminAxios } from './adminAxios';

export const adminProductApi = {
    /**
     * Fetch products and sync with Thyrocare
     * @param productType 'OFFER' | 'TEST' | 'PROFILE' | 'ALL'
     */
    syncProducts: async (productType: string) => {
        try {
            const response = await adminAxios.post('/admin/products', { productType });
            return response.data;
        } catch (error: any) {
            console.error('Error syncing products:', error);
            throw error.response?.data || { success: false, error: 'Failed to sync products' };
        }
    },

    /**
     * Update product custom pricing
     * @param code Product code
     * @param discount Custom discount amount
     */
    updatePricing: async (code: string, discount: number) => {
        try {
            const response = await adminAxios.put('/admin/products/pricing', { code, discount });
            return response.data;
        } catch (error: any) {
            console.error('Error updating pricing:', error);
            throw error.response?.data || { success: false, error: 'Failed to update pricing' };
        }
    },

    /**
     * Activate a product
     * @param code Product code
     */
    activateProduct: async (code: string) => {
        try {
            const response = await adminAxios.put(`/admin/products/${code}/activate`);
            return response.data;
        } catch (error: any) {
            console.error('Error activating product:', error);
            throw error.response?.data || { success: false, error: 'Failed to activate product' };
        }
    },

    /**
     * Deactivate a product
     * @param code Product code
     */
    deactivateProduct: async (code: string) => {
        try {
            const response = await adminAxios.put(`/admin/products/${code}/deactivate`);
            return response.data;
        } catch (error: any) {
            console.error('Error deactivating product:', error);
            throw error.response?.data || { success: false, error: 'Failed to deactivate product' };
        }
    }
};
