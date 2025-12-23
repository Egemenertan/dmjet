/**
 * Supabase Client
 * Initializes and exports Supabase client instance with enhanced error handling
 */

import {createClient} from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import {env} from '@core/config/env';
import {Platform} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

// Network connectivity state
let isConnected = true;
let connectionType = 'unknown';

// Monitor network connectivity
NetInfo.addEventListener(state => {
  isConnected = state.isConnected ?? false;
  connectionType = state.type;
  // Log silindi - production'da gereksiz, sadece hata durumunda log
});

// Create a custom storage adapter with enhanced error handling
const customStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      // Log silindi - production'da gereksiz
      return value;
    } catch (error) {
      console.error('❌ AsyncStorage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
      // Log silindi - production'da gereksiz
    } catch (error) {
      console.error('❌ AsyncStorage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
      // Log silindi - production'da gereksiz
    } catch (error) {
      console.error('❌ AsyncStorage removeItem error:', error);
    }
  },
};

// Enhanced error handling for Supabase operations
const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  retryCount = 0
): Promise<T> => {
  try {
    // Check network connectivity before operation
    if (!isConnected) {
      throw new Error(`Network offline - ${operationName} failed`);
    }

    // Loglar silindi - sadece hata durumunda log
    const result = await operation();
    return result;
  } catch (error: any) {
    // Sadece kritik hatalarda log
    console.error(`❌ Supabase ${operationName} error:`, {
      message: error.message,
      code: error.code,
    });

    // Retry logic for network errors
    if (retryCount < 2 && (
      error.message?.includes('network') ||
      error.message?.includes('timeout') ||
      error.message?.includes('fetch')
    )) {
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
      return withErrorHandling(operation, operationName, retryCount + 1);
    }

    throw error;
  }
};

// Validate environment variables
if (!env.supabase.url || !env.supabase.anonKey) {
  console.error('❌ Supabase configuration missing:', {
    url: !!env.supabase.url,
    anonKey: !!env.supabase.anonKey
  });
  throw new Error('Supabase configuration is incomplete');
}

// Supabase initialization log silindi - production'da gereksiz

// Initialize Supabase client with enhanced configuration
export const supabase = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Platform-specific storage key for better session persistence
    storageKey: Platform.OS === 'ios' ? 'supabase-auth-token-ios' : 'supabase-auth-token',
    // Enhanced session handling
    flowType: 'pkce',
  },
  realtime: {
    // Disable realtime for better performance if not needed
    params: {
      eventsPerSecond: 2,
    },
  },
  global: {
    headers: {
      'x-client-info': `dmarjet-mobile-${Platform.OS}`,
    },
  },
});

/**
 * Get current user session with enhanced error handling
 */
export const getCurrentSession = async () => {
  return withErrorHandling(async () => {
    const {data, error} = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }, 'getCurrentSession');
};

/**
 * Get current user with enhanced error handling
 */
export const getCurrentUser = async () => {
  return withErrorHandling(async () => {
    const {data, error} = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
  }, 'getCurrentUser');
};

/**
 * Sign out with enhanced error handling
 */
export const signOut = async () => {
  return withErrorHandling(async () => {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
  }, 'signOut');
};

/**
 * Check network connectivity
 */
export const getNetworkStatus = () => ({
  isConnected,
  connectionType,
});

/**
 * Test Supabase connection
 */
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase connection test successful');
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Supabase connection test error:', error);
    return { success: false, error: error.message };
  }
};

