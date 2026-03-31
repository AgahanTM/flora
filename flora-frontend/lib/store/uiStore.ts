import { create } from 'zustand';

interface UiState {
  unreadNotificationCount: number;
  setUnreadNotificationCount: (count: number) => void;
  incrementUnreadNotificationCount: () => void;
  clearUnreadNotifications: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  unreadNotificationCount: 0,
  setUnreadNotificationCount: (count) => set({ unreadNotificationCount: count }),
  incrementUnreadNotificationCount: () => set((state) => ({ unreadNotificationCount: state.unreadNotificationCount + 1 })),
  clearUnreadNotifications: () => set({ unreadNotificationCount: 0 }),
}));
