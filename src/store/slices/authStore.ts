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
    console.log('👤 Auth Store - User Set:', {
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
    console.log('🔐 Auth Store - Session Set:', {
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
    // Sadece role değerine göre kontrol yap - is_admin'i ignore et
    const isAdmin = profile?.role === 'admin';
    const isCourier = profile?.role === 'courier';
    const isPicker = profile?.role === 'picker';
    
    // canAccessAdminOrders: SADECE admin, courier veya picker ise true
    // role === 'user' ise kesinlikle false olmalı
    const canAccessAdminOrders = profile ? (isAdmin || isCourier || isPicker) : false;
    
    console.log('👤 Auth Store - Profile Set:', {
      hasProfile: !!profile,
      role: profile?.role,
      fullName: profile?.full_name,
      phone: profile?.phone,
      address: profile?.address,
      hasLocation: !!(profile?.location_lat && profile?.location_lng),
      isAdmin,
      isCourier,
      isPicker,
      canAccessAdminOrders,
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
    console.log('⏳ Auth Store - Loading Set:', loading);
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

