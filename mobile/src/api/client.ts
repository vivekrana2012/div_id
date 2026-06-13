import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:8080/api';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  isRefreshing = false;
  failedQueue = [];
};

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('divid_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isRefreshAttempt = originalRequest?.url?.includes('/auth/refresh');

    // Handle 401 (except for refresh endpoint itself)
    if (error.response?.status === 401 && !isRefreshAttempt) {
      if (isRefreshing) {
        // Queue the request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return client(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        // Try to refresh token
        const refreshToken = await SecureStore.getItemAsync('divid_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const userId = (error.response?.data?.userId || await SecureStore.getItemAsync('divid_user_id')) || '';
        const deviceId = 'mobile'; // hardcoded for mobile

        const res = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
          deviceId,
          userId,
        });

        const { accessToken, refreshToken: newRefreshToken } = res.data;

        // Update stored tokens
        await SecureStore.setItemAsync('divid_token', accessToken);
        await SecureStore.setItemAsync('divid_refresh_token', newRefreshToken);

        processQueue(null, accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshErr) {
        // Refresh failed - clear tokens and redirect to login
        processQueue(refreshErr, null);
        await SecureStore.deleteItemAsync('divid_token');
        await SecureStore.deleteItemAsync('divid_refresh_token');
        // Navigation to login is handled at the component level via AuthContext
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default client;

