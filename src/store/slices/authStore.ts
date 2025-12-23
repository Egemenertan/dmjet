/**
 * Auth Store
 * Authentication state management
 */

import {create} from 'zustand';
import {User, Session} from '@supabase/supabase-js';
import {auth} from '@core/utils';

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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  isAuthenticated: false,
  isAdmin: false,
  isCourier: false,
  isPicker: false,
  canAccessAdminOrders: false,
  isLoading: true,
  setUser: (user) => {
    auth.debug('User Set', {
      hasUser: !!user,
      userId: user?.id,
      email: user?.email
    });
    
    set({
      user,
      isAuthenticated: !!user,
    });
  },
  setSession: (session) => {
    auth.debug('Session Set', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      email: session?.user?.email
    });
    
    set({
      session,
      user: session?.user || null,
      isAuthenticated: !!session,
    });
  },
  setProfile: (profile) => {
    // Güvenli role kontrolü
    const isAdmin = profile?.role === 'admin';
    const isCourier = profile?.role === 'courier';
    const isPicker = profile?.role === 'picker';
    
    // GÜVENLIK: Sadece picker ve courier admin orders'a erişebilir
    // Admin bile normal user orders sayfasını görsün (güvenlik için)
    const canAccessAdminOrders = profile ? (isCourier || isPicker) : false;
    
    auth.debug('Profile Set', {
      hasProfile: !!profile,
      role: profile?.role,
      fullName: profile?.full_name,
      hasLocation: !!(profile?.location_lat && profile?.location_lng),
      canAccessAdminOrders
    });
    
    set({
      profile,
      isAdmin,
      isCourier,
      isPicker,
      canAccessAdminOrders,
    });
  },
  setLoading: (loading) => {
    auth.debug('Loading Set', loading);
    set({isLoading: loading});
  },
  logout: () => {
    console.log('👋 Auth Store - Logout');
    set({
      user: null,
      session: null,
      profile: null,
      isAuthenticated: false,
      isAdmin: false,
      isCourier: false,
      isPicker: false,
      canAccessAdminOrders: false,
    });
  },
}));

