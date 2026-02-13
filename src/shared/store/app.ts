import { create } from 'zustand';

interface AppState {
  isDarkMode: boolean;
  isLocationEnabled: boolean;
  setDarkMode: (isDarkMode: boolean) => void;
  setLocationEnabled: (isLocationEnabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isDarkMode: true, // Default to dark mode
  isLocationEnabled: false,
  setDarkMode: (isDarkMode) => set({ isDarkMode }),
  setLocationEnabled: (isLocationEnabled) => set({ isLocationEnabled }),
}));