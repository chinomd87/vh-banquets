import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../config/environment';

// Create axios instance
const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token storage keys
const TOKEN_KEY = 'vh_banquets_token';
const REFRESH_TOKEN_KEY = 'vh_banquets_refresh_token';

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    
    if (ENV.DEBUG) {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    if (ENV.DEBUG) {
      console.error('❌ Request error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    if (ENV.DEBUG) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (ENV.DEBUG) {
      console.error(`❌ ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data);
    }
    
    // Handle 401 errors (token expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${ENV.API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          // Store new tokens
          await AsyncStorage.setItem(TOKEN_KEY, accessToken);
          await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        // Clear tokens and redirect to login
        await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
        // You can emit an event here to redirect to login screen
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for token management
export const tokenStorage = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken, refreshToken) => 
    AsyncStorage.multiSet([
      [TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
    ]),
  clearTokens: () => AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]),
  hasToken: async () => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  },
};

export default api;
