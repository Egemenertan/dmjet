/**
 * Auth Store
 * Authentication state management
 */

import {create} from 'zustand';
import {User, Session} from '@supabase/supabase-js';

export interface ProfileData {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  country_code: string | null;
  address: string | null;
  address_details: string | null;
  aile_karti: string | null;
  location_lat: number | null;
  location_lng: number | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_active: boolean | null;
  role: 'user' | 'admin' | 'courier' | 'picker';
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: ProfileData | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCourier: boolean;
  isPicker: boolean;
  canAccessAdminOrders: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: ProfileData | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isAdmin: false,
  isCourier: false,
  isPicker: false,
  canAccessAdminOrders: false,
  isLoading: true,
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
    }),
  setSession: (session) =>
    set({
      session,
      user: session?.user || null,
      isAuthenticated: !!session,
    }),
  setProfile: (profile) =>
    set({
      profile,
      isAdmin: profile?.role === 'admin' || profile?.is_admin === true,
      isCourier: profile?.role === 'courier',
      isPicker: profile?.role === 'picker',
      canAccessAdminOrders: 
        profile?.role === 'admin' || 
        profile?.role === 'courier' || 
        profile?.role === 'picker' ||
        profile?.is_admin === true,
    }),
  setLoading: (loading) => set({isLoading: loading}),
  logout: () =>
    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      isCourier: false,
      isPicker: false,
      canAccessAdminOrders: false,
    }),
}));

