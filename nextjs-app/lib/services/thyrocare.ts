import axios from 'axios';
import Admin from '../models/Admin';
import AdminSession from '../models/AdminSession';
import { thyrocareCircuitBreaker } from '../utils/circuitBreaker';
import { thyrocareRequestQueue } from '../utils/requestQueue';

export class ThyrocareService {
    private static apiUrl = process.env.THYROCARE_API_URL || 'https://velso.thyrocare.cloud';

    static async refreshApiKeys() {
        const apiCall = async () => {
            const username = process.env.THYROCARE_USERNAME;
            const password = process.env.THYROCARE_PASSWORD;

            if (!username || !password) {
                throw new Error('ThyroCare credentials not configured');
            }

            const response = await axios.post(`${this.apiUrl}/api/Login/Login`, {
                username,
                password,
                portalType: 'DSAPortal',
                userType: 'DSA'
            });

            if (response.data.response === 'Success' && response.data.apiKey) {
                const admin = await Admin.findOrCreateFromThyroCare(response.data, username);
                const session = await AdminSession.createSingleActiveSession(admin._id as any, response.data, 'AUTO_REFRESH', 'AUTO_REFRESH_SERVICE');
                return session;
            } else {
                throw new Error(response.data.response || 'Refresh failed');
            }
        };

        return await thyrocareRequestQueue.enqueue(() => thyrocareCircuitBreaker.execute(apiCall), {
            priority: 'high',
            metadata: { type: 'api_key_refresh' }
        });
    }

    static async getOrRefreshApiKey() {
        const activeSession = await AdminSession.findOne({ isActive: true }).sort({ createdAt: -1 });

        if (!activeSession || activeSession.isApiKeyExpired()) {
            const newSession = await this.refreshApiKeys();
            return newSession.thyrocareApiKey;
        }

        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        if (activeSession.apiKeyExpiresAt < oneHourFromNow) {
            const newSession = await this.refreshApiKeys();
            return newSession.thyrocareApiKey;
        }

        return activeSession.thyrocareApiKey;
    }

    static isAuthError(dataOrError: any) {
        if (dataOrError?.response?.status === 401) return true;
        const response = dataOrError?.response?.data?.response || dataOrError?.response || dataOrError?.message || dataOrError;
        const responseStr = (response || '').toString().toLowerCase();
        return responseStr.includes('invalid api key') || responseStr === 'invalid';
    }

    static async makeRequest<T>(apiCallFn: (apiKey: string) => Promise<T>): Promise<T> {
        try {
            const apiKey = await this.getOrRefreshApiKey();
            const result = await apiCallFn(apiKey);

            if (this.isAuthError(result)) {
                throw new Error('Invalid Api Key');
            }

            return result;
        } catch (error) {
            if (this.isAuthError(error)) {
                console.log('🔄 Auth error, refreshing and retrying...');
                const session = await this.refreshApiKeys();
                return await apiCallFn(session.thyrocareApiKey);
            }
            throw error;
        }
    }
}
