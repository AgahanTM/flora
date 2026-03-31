"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { useNotificationStore } from '@/lib/store/notificationStore';
import { useUiStore } from '@/lib/store/uiStore';
import { apiClient } from '@/lib/api/client';

export function Providers({ children }: { children: React.ReactNode }) {
  // Create a client directly in the component to avoid sharing state between requests in SSR
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Default 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  const { isAuthenticated, initialize } = useAuthStore();
  const { startPolling } = useNotificationStore();

  // Initialize auth store on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Global Notification Polling Feature (Business Rule #12)
  useEffect(() => {
    if (isAuthenticated) {
      const stopPolling = startPolling();
      return () => stopPolling();
    }
  }, [isAuthenticated, startPolling]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-cream)',
            color: 'var(--color-bark)',
            border: '1px solid var(--color-rose)',
            borderRadius: '1rem',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: 'var(--shadow-premium)',
          },
          success: {
            iconTheme: {
              primary: 'var(--color-success)',
              secondary: 'white',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--color-rose)',
              secondary: 'white',
            },
            style: {
              border: '1px solid var(--color-rose)',
            }
          },
        }}
        containerStyle={{
          top: 80,
        }}
      />
    </QueryClientProvider>
  );
}
