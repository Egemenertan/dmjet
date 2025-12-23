/**
 * DmarJet Mobile App
 * Supermarket Delivery Application
 */

import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {StatusBar, View, Text, TouchableOpacity} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {RootNavigator} from '@core/navigation';
import {supabase} from '@core/services/supabase';
import {useAuthStore} from '@store/slices/authStore';
import {useAppStore} from '@store/slices/appStore';
import {profileService} from '@features/profile/services/profileService';
import {NotificationProvider} from '@core/contexts/NotificationContext';
import {WorkingHoursProvider} from '@core/contexts/WorkingHoursContext';
import {ErrorBoundary} from '@shared/components/ErrorBoundary';
import {colors} from '@core/constants';
import {initSentry, setUser, clearUser} from '@core/services/sentry';
import {auth} from '@core/utils';
import i18n from './src/localization/i18n';

// Initialize Sentry
initSentry();

// Create a client with enhanced error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Debug log silindi - production'da gereksiz
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

function App(): React.JSX.Element {
  const {setSession, setProfile, setLoading} = useAuthStore();
  const {setLanguage} = useAppStore();

  // Uygulama başlangıcında i18n ve AppStore dilini senkronize et
  useEffect(() => {
    const syncLanguage = () => {
      const currentLanguage = i18n.language as 'tr' | 'en' | 'ru';
      console.log('🌍 Syncing language on app start:', currentLanguage);
      setLanguage(currentLanguage);
    };
    
    syncLanguage();
  }, []);

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;
    let profileRetryCount = 0;
    const MAX_PROFILE_RETRIES = 3;

    // Enhanced profile fetching with retry logic
    const fetchProfileWithRetry = async (userId: string): Promise<void> => {
      try {
        // Debug log silindi - production'da gereksiz
        
        const profile = await profileService.getProfile(userId);
        
        if (!mounted) return;
        
        if (profile) {
          // Debug log silindi - production'da gereksiz
          
          setProfile(profile);
          
          // Set user context in Sentry
          setUser({
            id: userId,
            email: profile.email || undefined,
            fullName: profile.full_name || undefined,
          });
        } else {
          setProfile(null);
        }
        
        profileRetryCount = 0; // Reset retry count on success
      } catch (error: any) {
        console.error(`❌ Profile fetch error (attempt ${profileRetryCount + 1}):`, {
          message: error.message,
          code: error.code,
        });

        if (profileRetryCount < MAX_PROFILE_RETRIES) {
          profileRetryCount++;
          const retryDelay = Math.min(1000 * Math.pow(2, profileRetryCount - 1), 5000);
          
          setTimeout(() => {
            if (mounted) {
              fetchProfileWithRetry(userId);
            }
          }, retryDelay);
        } else {
          console.error('❌ Max profile fetch retries exceeded, continuing without profile');
          if (mounted) {
            setProfile(null);
          }
        }
      }
    };

    // Check active session and fetch profile
    const initializeAuth = async () => {
      try {
        // Debug log silindi - production'da gereksiz
        
        // Add a small delay to ensure AsyncStorage is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const {data: {session}, error: sessionError} = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setLoading(false);
          return;
        }

        if (!mounted) return;
        
        // Debug log silindi - production'da gereksiz
        
        setSession(session);
        
        // Fetch user profile if session exists
        if (session?.user) {
          await fetchProfileWithRetry(session.user.id);
        }
      } catch (error: any) {
        console.error('❌ Auth initialization error:', {
          message: error.message,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes with enhanced handling
    try {
      const {
        data: {subscription},
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Debug log silindi - production'da gereksiz

        if (!mounted) return;

        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          profileRetryCount = 0; // Reset retry count for new sign in
          
          // Add delay for Google OAuth to ensure session is fully established
          setTimeout(async () => {
            if (mounted) {
              await fetchProfileWithRetry(session.user.id);
            }
          }, 1000);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setProfile(null);
            clearUser();
          }
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Don't refetch profile on token refresh unless it's missing
          const currentProfile = useAuthStore.getState().profile;
          if (!currentProfile && session.user) {
            setTimeout(async () => {
              if (mounted) {
                await fetchProfileWithRetry(session.user.id);
              }
            }, 500);
          }
        } else if (session?.user) {
          // Handle other events where session exists
          const currentProfile = useAuthStore.getState().profile;
          if (!currentProfile) {
            setTimeout(async () => {
              if (mounted) {
                await fetchProfileWithRetry(session.user.id);
              }
            }, 500);
          }
        } else {
          // No session, clear profile
          if (mounted) {
            setProfile(null);
            clearUser();
          }
        }
      });

      authSubscription = subscription;
      // Debug log silindi - production'da gereksiz
    } catch (error: any) {
      console.error('❌ Error setting up auth listener:', {
        message: error.message,
      });
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [setSession, setProfile, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NotificationProvider>
          <WorkingHoursProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background}
            />
            <RootNavigator />
          </WorkingHoursProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

export default App;
