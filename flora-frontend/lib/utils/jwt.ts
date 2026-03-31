import { UserRole } from '../types/api';

/**
 * Minimal JWT payload decoder (base64url → JSON).
 * Used purely for UI/routing logic. The backend handles actual cryptographic verification.
 */
export function decodeJwtPayload(token: string): { user_id?: string; role?: UserRole; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // In Browser
    if (typeof window !== 'undefined') {
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } 
    
    // In Node.js (SSR)
    const json = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(json);
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
}

/**
 * Checks if a JWT token has expired.
 * Adds a 1-minute buffer to proactively refresh.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  // exp is in seconds, Date.now() is in ms. Buffer = 60s
  return Date.now() >= (payload.exp - 60) * 1000;
}
