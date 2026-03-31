import { apiClient } from './client';
import { User, Session } from '../types/auth';

interface LoginParams {
  phone: string;
}

interface VerifyParams {
  phone: string;
  code: string; // "123456" in dummy backend
}

interface RegisterParams {
  phone: string;
  full_name: string;
  email?: string;
  code: string;
}

/**
 * Initiates the login process by sending an OTP to the provided phone number.
 */
export async function sendOtp(data: LoginParams): Promise<{ message: string }> {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
}

/**
 * Verifies the OTP code. If successful, returns the session and user data.
 */
export async function verifyOtp(data: VerifyParams): Promise<{ session: Session; user: User }> {
  const response = await apiClient.post('/auth/verify', data);
  return response.data; // { session: { access_token, refresh_token }, user: {...} }
}

/**
 * Registers a new customer after OTP verification.
 */
export async function registerCustomer(data: RegisterParams): Promise<{ session: Session; user: User }> {
  // Wait for the backend implementation, sending standard payload
  const response = await apiClient.post('/auth/register', data);
  return response.data;
}

/**
 * Fetches the currently authenticated user's profile.
 */
export async function getProfile(): Promise<{ user: User; profile: any }> {
  const response = await apiClient.get('/auth/profile');
  return response.data;
}

/**
 * Logs the user out by invalidating their refresh token on the server.
 */
export async function logoutAccount(): Promise<void> {
  const refresh_token = localStorage.getItem('flora-auth-storage')
    ? JSON.parse(localStorage.getItem('flora-auth-storage') || '{}')?.state?.refreshToken
    : null;
    
  if (refresh_token) {
    try {
      await apiClient.post('/auth/logout', { refresh_token });
    } catch (e) {
      console.warn('Backend logout failed, proceeding with local logout', e);
    }
  }
}
