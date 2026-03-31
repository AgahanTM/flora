import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types/auth'; // UserRole imported from api.ts
import { UserRole } from '../types/api';
import { decodeJwtPayload } from '../utils/jwt';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  
  // Actions
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  initialize: () => void; // Syncs cookies with localStorage state on load
}

// Cookie helpers for SSR middleware compatibility
function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function removeCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      role: null,

      setTokens: (accessToken, refreshToken) => {
        const payload = decodeJwtPayload(accessToken);
        const role = (payload?.role as UserRole) || null;
        
        setCookie('flora_access_token', accessToken);
        setCookie('flora_refresh_token', refreshToken);
        
        set({
          accessToken,
          refreshToken,
          isAuthenticated: true,
          role,
        });
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        removeCookie('flora_access_token');
        removeCookie('flora_refresh_token');
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          role: null,
        });
      },
      
      initialize: () => {
        // Just a trigger for hydration or manual syncs, Zustand persist handles localStorage automatically
        // but we ensure cookies are synced here if needed
      }
    }),
    {
      name: 'flora-auth-storage',
      // Only keep tokens and role in persistent storage — user data fetched via /profile
      partialize: (state) => ({ 
        accessToken: state.accessToken, 
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        role: state.role
      }),
    }
  )
);
