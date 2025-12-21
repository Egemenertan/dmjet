/**
 * Supabase Client
 * Initializes and exports Supabase client instance
 */

import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import {env} from '@core/config/env';
import {Platform} from 'react-native';

// Create a custom storage adapter with error handling
const customStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
    }
  },
};

// Initialize Supabase client with error handling
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // iOS'ta session persistence sorunlarını önlemek için
    storageKey: Platform.OS === 'ios' ? 'supabase-auth-token-ios' : 'supabase-auth-token',
  },
});

/**
 * Get current user session
 */
export const getCurrentSession = async () => {
  const {data, error} = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return data.session;
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const {data, error} = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  return data.user;
};

/**
 * Sign out
 */
export const signOut = async () => {
  const {error} = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

