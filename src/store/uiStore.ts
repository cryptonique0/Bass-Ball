// UI state store
import { create } from 'zustand';

export interface UIState {
  sidebarOpen: boolean;
  modalOpen: string | null;
  notificationsOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  toggleNotifications: () => void;
  toggleDarkMode: () => void;
}

export const useUIStore = create<UIState>(set => ({
  sidebarOpen: false,
  modalOpen: null,
  notificationsOpen: false,
  darkMode: true,
  
  toggleSidebar: () =>
    set(state => ({ sidebarOpen: !state.sidebarOpen })),
  
  openModal: (id: string) =>
    set({ modalOpen: id }),
  
  closeModal: () =>
    set({ modalOpen: null }),
  
  toggleNotifications: () =>
    set(state => ({ notificationsOpen: !state.notificationsOpen })),
  
  toggleDarkMode: () =>
    set(state => ({ darkMode: !state.darkMode })),
}));
