import ThyrocareRefreshService from '../services/thyrocareRefreshService.js';

/**
 * Helper to check for auth errors in response data or error objects
 * @param {any} dataOrError - The response data or error object to check
 * @returns {boolean} True if this appears to be an auth/API key error
 */
export const isThyrocareAuthError = (dataOrError) => {
    // Check error response properties
    if (dataOrError?.response?.status === 401) return true;

    // Check data properties (for 200 OK responses with error messages)
    const response = dataOrError?.response?.data?.response || // Axios error structure
        dataOrError?.response ||                 // Direct response property
        dataOrError?.message ||                  // Common message property
        dataOrError;                             // The object itself if it's a string

    const responseStr = (response || '').toString().toLowerCase();
    return responseStr.includes('invalid') || responseStr.includes('invalid api key');
};

/**
 * Helper to execute ThyroCare API calls with automatic retry on auth failure
 * @param {Function} apiCallFn - Async function that takes apiKey and returns response data
 * @returns {Promise<any>} The response data from the API call
 */
export const makeThyrocareRequest = async (apiCallFn) => {
    try {
        const apiKey = await ThyrocareRefreshService.getOrRefreshApiKey();
        const result = await apiCallFn(apiKey);

        // Check if successful response actually contains an auth error
        if (isThyrocareAuthError(result)) {
            console.log('🔄 ThyroCare API returned success but content indicates auth error. Forcing refresh...');
            // Throw to trigger catch block
            throw new Error('Invalid Api Key response in 200 OK');
        }

        return result;
    } catch (error) {
        // Check if error is due to invalid API key/token
        if (isThyrocareAuthError(error) || error.message === 'Invalid Api Key response in 200 OK') {
            console.log('🔄 ThyroCare API key rejected, forcing refresh and retry...');
            try {
                // Force refresh
                const session = await ThyrocareRefreshService.refreshApiKeys();
                // Retry with new key
                const retryResult = await apiCallFn(session.thyrocareApiKey);

                // Check retry result as well
                if (isThyrocareAuthError(retryResult)) {
                    // If it still fails, we might as well return it or throw, but let's throw to be safe
                    throw new Error('API key refresh failed to resolve the issue: ' + JSON.stringify(retryResult));
                }
                return retryResult;

            } catch (refreshError) {
                console.error('❌ Failed to refresh API key during retry:', refreshError);
                throw refreshError;
            }
        }
        throw error;
    }
};

export default { makeThyrocareRequest, isThyrocareAuthError };
