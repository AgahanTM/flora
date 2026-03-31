import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types/api';

export function useAuth() {
  const { user, isAuthenticated, role, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    role,
    logout,
    
    // Role checkers
    isCustomer: role === UserRole.CUSTOMER,
    isSeller: role === UserRole.SELLER,
    isAdmin: role === UserRole.ADMIN,
    isCourier: role === UserRole.COURIER,
    
    // Helpers
    isLoading: false, // In a real app with SSR, you might have an initialization state
  };
}
