import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { isTokenExpired } from '../utils/jwt';

// Ensure NEXT_PUBLIC_API_URL is set in .env.local
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// To prevent multiple refresh requests when many calls hit 401 simultaneously
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// ---------------------------------------------------------------------------
// Request Interceptor
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const { accessToken, refreshToken, setTokens, logout } = useAuthStore.getState();

    // Skip auth for explicitly unauthenticated routes (like login/register)
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/register') || config.url?.includes('/auth/refresh')) {
      return config;
    }

    if (accessToken) {
      // Proactive token refresh if it's about to expire
      if (isTokenExpired(accessToken) && refreshToken && !isRefreshing) {
        isRefreshing = true;
        try {
          // Manually send refresh without interceptors to avoid loops
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
          setTokens(data.access_token, data.refresh_token);
          config.headers.Authorization = `Bearer ${data.access_token}`;
          processQueue(null, data.access_token);
        } catch (err) {
          processQueue(err, null);
          logout();
          if (typeof window !== 'undefined') window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      } else if (isRefreshing) {
        // Wait for the in-flight refresh to complete
        try {
          const newToken = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          config.headers.Authorization = `Bearer ${newToken}`;
        } catch (err) {
          return Promise.reject(err);
        }
      } else {
        // Token is valid
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response Interceptor
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized globally
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh attempt if the failed request was already a refresh attempt or a login
      if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
        return Promise.reject(transformError(error));
      }

      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (isRefreshing) {
        try {
          const newToken = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
        setTokens(data.access_token, data.refresh_token);
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        processQueue(null, data.access_token);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        // Skip hard redirect for better public browsing experience
        // if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(transformError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(transformError(error));
  }
);

// ---------------------------------------------------------------------------
// Error Transformer
// ---------------------------------------------------------------------------
function transformError(error: AxiosError): Error {
  if (error.response && error.response.data) {
    const data = error.response.data as any;
    if (data.error) {
      return new Error(data.error);
    }
  }
  return new Error(error.message || 'An unexpected error occurred');
}
