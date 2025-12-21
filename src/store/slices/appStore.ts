/**
 * App Store
 * Global app state management
 */

import {create} from 'zustand';

export type Language = 'tr' | 'en' | 'ru';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

interface AppState {
  language: Language;
  location: Location | null;
  isOnline: boolean;
  setLanguage: (language: Language) => void;
  setLocation: (location: Location | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  language: 'tr',
  location: null,
  isOnline: true,
  setLanguage: (language) => set({language}),
  setLocation: (location) => set({location}),
  setOnlineStatus: (isOnline) => set({isOnline}),
}));

