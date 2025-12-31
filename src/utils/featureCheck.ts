import axios from 'axios';
import logger from './logger.js';

const FEATURE_SERVICE_URL = process.env.FEATURE_SERVICE_URL || 'http://localhost:3002';

export interface FeatureCheckResponse {
    enabled: boolean;
    reason?: 'enabledForAll' | 'role' | 'user';
    message?: string;
}

/**
 * Check if a feature is enabled for a specific user
 * @param featureName - The name of the feature to check
 * @param userId - The user's ID (optional)
 * @param roleId - The user's role ID (optional)
 * @returns Promise<FeatureCheckResponse> - Object indicating if feature is enabled and why
 */
export const checkFeature = async (
    featureName: string,
    userId?: string,
    roleId?: string
): Promise<boolean> => {
    try {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (roleId) params.append('roleId', roleId);

        const queryString = params.toString();
        const url = `${FEATURE_SERVICE_URL}/check/${featureName}${queryString ? `?${queryString}` : ''}`;

        const response = await axios.get<FeatureCheckResponse>(url);
        return response.data.enabled;
    } catch (error: unknown) {
        // If feature service is unavailable or feature doesn't exist, default to disabled
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            logger.error('Feature not found:', error);
            return false;
        }

        // Log error and default to disabled for safety
        logger.error('Error checking feature:', error);
        return false;
    }
};

/**
 * Check if a feature is enabled for all users
 * @param featureName - The name of the feature to check
 * @returns Promise<boolean> - True if enabled for all, false otherwise
 */
export const isFeatureEnabledForAll = async (featureName: string): Promise<boolean> => {
    const result = await checkFeature(featureName);
    return result;
};
