"use client";

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '../api/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  context_id?: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  lastPolled: string | null;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  startPolling: () => () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      lastPolled: null,

      fetchNotifications: async () => {
        set({ isLoading: true });
        try {
          const { data } = await apiClient.get('/notifications');
          const unread = data.filter((n: Notification) => !n.is_read).length;
          set({ 
            notifications: data, 
            unreadCount: unread, 
            lastPolled: new Date().toISOString() 
          });
        } catch (error) {
          console.error('Failed to fetch notifications:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      markAsRead: async (id: string) => {
        try {
          await apiClient.put(`/notifications/${id}/read`);
          const updated = get().notifications.map(n => 
            n.id === id ? { ...n, is_read: true } : n
          );
          set({ 
            notifications: updated, 
            unreadCount: Math.max(0, get().unreadCount - 1) 
          });
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        try {
          // Special literal "all" as ID
          await apiClient.put('/notifications/all/read');
          const updated = get().notifications.map(n => ({ ...n, is_read: true }));
          set({ notifications: updated, unreadCount: 0 });
        } catch (error) {
          console.error('Failed to mark all notifications as read:', error);
        }
      },

      startPolling: () => {
        // Fetch immediately
        get().fetchNotifications();

        // Business Rule #12: Poll every 30s
        const interval = setInterval(() => {
          get().fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
      },
    }),
    {
      name: 'flora-notifications',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ unreadCount: state.unreadCount }), 
    }
  )
);
