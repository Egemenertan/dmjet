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
import {profileService} from '@features/profile/services/profileService';
import {NotificationProvider} from '@core/contexts/NotificationContext';
import {colors} from '@core/constants';
import {initSentry, ErrorBoundary, setUser, clearUser} from '@core/services/sentry';
import './src/localization/i18n';

// Initialize Sentry
initSentry();

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App(): React.JSX.Element {
  const {setSession, setProfile, setLoading} = useAuthStore();

  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    // Check active session and fetch profile
    const initializeAuth = async () => {
      try {
        // Add a small delay to ensure AsyncStorage is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const {data: {session}, error: sessionError} = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setLoading(false);
          return;
        }

        if (!mounted) return;
        
        setSession(session);
        
        // Fetch user profile if session exists
        if (session?.user) {
          try {
            const profile = await profileService.getProfile(session.user.id);
            if (mounted) {
              setProfile(profile);
              // Set user context in Sentry
              setUser({
                id: session.user.id,
                email: session.user.email,
              });
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
            // Profile fetch failed, but session is still valid
            if (mounted) {
              setProfile(null);
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    try {
      const {
        data: {subscription},
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        
        setSession(session);
        
        // Fetch profile when user signs in
        if (session?.user) {
          try {
            const profile = await profileService.getProfile(session.user.id);
            if (mounted) {
              setProfile(profile);
              // Set user context in Sentry
              setUser({
                id: session.user.id,
                email: session.user.email,
              });
            }
          } catch (error) {
            console.error('Error fetching profile on auth change:', error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          // User signed out, clear profile
          if (mounted) {
            setProfile(null);
            // Clear user context in Sentry
            clearUser();
          }
        }
      });
      
      authSubscription = subscription;
    } catch (error) {
      console.error('Error setting up auth listener:', error);
    }

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [setSession, setProfile, setLoading]);

  return (
    <ErrorBoundary
      fallback={({error, resetError}) => (
        <SafeAreaProvider>
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: colors.background}}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <Text style={{fontSize: 24, fontWeight: 'bold', color: colors.text.primary, marginBottom: 16}}>
              Bir hata oluştu
            </Text>
            <Text style={{fontSize: 16, color: colors.text.secondary, marginBottom: 24, textAlign: 'center'}}>
              {error.message}
            </Text>
            <TouchableOpacity
              onPress={resetError}
              style={{
                backgroundColor: colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 8,
              }}
            >
              <Text style={{color: colors.text.inverse, fontSize: 16, fontWeight: '600'}}>
                Tekrar Dene
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaProvider>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <NotificationProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={colors.background}
            />
            <RootNavigator />
          </NotificationProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
