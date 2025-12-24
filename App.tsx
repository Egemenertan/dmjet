/**
 * DmarJet Mobile App
 * Supermarket Delivery Application
 */

import 'react-native-gesture-handler';
import React, {useEffect, useState} from 'react';
import {StatusBar, View, Text, Alert} from 'react-native';
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
import {AgeVerificationModal} from '@shared/components';
import {colors} from '@core/constants';
import {setUser, clearUser} from '@core/services/sentry';
import {auth} from '@core/utils';
import i18n from './src/localization/i18n';
import * as Sentry from '@sentry/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Get Sentry DSN from environment
const sentryDsn = Constants.expoConfig?.extra?.sentryDsn || '';

if (!sentryDsn) {
  console.warn('⚠️ Sentry DSN not found in environment variables - Sentry disabled');
}

// Initialize Sentry with full configuration (only if DSN is available)
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,

    // Adds more context data to events (IP address, cookies, user, etc.)
    sendDefaultPii: true,

    // Enable Logs
    enableLogs: true,

    // Configure Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1,
    integrations: [
      Sentry.mobileReplayIntegration(),
      Sentry.feedbackIntegration(),
    ],

    // Environment
    environment: __DEV__ ? 'development' : 'production',

    // Enable automatic session tracking
    enableAutoSessionTracking: true,

    // Trace sampling rate
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,

    // Enable native crash reporting
    enableNative: true,
    enableNativeCrashHandling: true,

    // Attach stack trace to messages
    attachStacktrace: true,

    // Maximum number of breadcrumbs
    maxBreadcrumbs: 100,

    // Before send hook - filter sensitive data
    beforeSend(event) {
      // Remove sensitive data from event
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }
      return event;
    },

    // uncomment the line below to enable Spotlight (https://spotlightjs.com)
    // spotlight: __DEV__,
  });
} else {
  console.log('ℹ️ Sentry is disabled - no DSN provided');
}

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
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

const AGE_VERIFICATION_KEY = '@age_verified';

function App(): React.JSX.Element {
  const {setSession, setProfile, setLoading} = useAuthStore();
  const {setLanguage} = useAppStore();
  const [showAgeVerification, setShowAgeVerification] = useState(false);
  const [isAgeVerified, setIsAgeVerified] = useState(false);

  // Yaş doğrulamasını kontrol et
  useEffect(() => {
    const checkAgeVerification = async () => {
      try {
        const verified = await AsyncStorage.getItem(AGE_VERIFICATION_KEY);
        if (verified === 'true') {
          setIsAgeVerified(true);
        } else {
          setShowAgeVerification(true);
        }
      } catch (error) {
        console.error('Age verification check error:', error);
        setShowAgeVerification(true);
      }
    };

    checkAgeVerification();
  }, []);

  // Uygulama başlangıcında i18n ve AppStore dilini senkronize et
  useEffect(() => {
    const syncLanguage = () => {
      const currentLanguage = i18n.language as 'tr' | 'en' | 'ru';
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
        console.error(
          `❌ Profile fetch error (attempt ${profileRetryCount + 1}):`,
          {
            message: error.message,
            code: error.code,
          },
        );

        if (profileRetryCount < MAX_PROFILE_RETRIES) {
          profileRetryCount++;
          const retryDelay = Math.min(
            1000 * Math.pow(2, profileRetryCount - 1),
            5000,
          );

          setTimeout(() => {
            if (mounted) {
              fetchProfileWithRetry(userId);
            }
          }, retryDelay);
        } else {
          console.error(
            '❌ Max profile fetch retries exceeded, continuing without profile',
          );
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

        const {
          data: {session},
          error: sessionError,
        } = await supabase.auth.getSession();

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
          // Increased delay to allow RLS policies to recognize auth.uid()
          setTimeout(async () => {
            if (mounted) {
              await fetchProfileWithRetry(session.user.id);
            }
          }, 2000); // Increased from 1000ms to 2000ms for OAuth session initialization
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

  const handleAgeConfirm = async () => {
    try {
      await AsyncStorage.setItem(AGE_VERIFICATION_KEY, 'true');
      setIsAgeVerified(true);
      setShowAgeVerification(false);
    } catch (error) {
      console.error('Age verification save error:', error);
    }
  };

  const handleAgeDecline = () => {
    Alert.alert(
      i18n.t('ageVerification.restrictedTitle', 'Erişim Kısıtlı'),
      i18n.t(
        'ageVerification.restrictedMessage',
        'Üzgünüz, bu uygulama 18 yaşından küçük kullanıcılar için uygun değildir.'
      ),
      [
        {
          text: i18n.t('common.ok', 'Tamam'),
          onPress: () => {
            // Kullanıcı tekrar deneyebilir
            setShowAgeVerification(true);
          },
        },
      ]
    );
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NotificationProvider>
          <WorkingHoursProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background}
            />
            {isAgeVerified ? (
              <RootNavigator />
            ) : (
              <View style={{flex: 1, backgroundColor: colors.background}} />
            )}
            <AgeVerificationModal
              visible={showAgeVerification}
              onConfirm={handleAgeConfirm}
              onDecline={handleAgeDecline}
            />
          </WorkingHoursProvider>
        </NotificationProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

// Wrap App with Sentry for automatic error tracking (only if Sentry is initialized)
export default sentryDsn ? Sentry.wrap(App) : App;
