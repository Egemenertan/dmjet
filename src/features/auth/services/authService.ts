/**
 * Auth Service
 * Authentication operations
 */

import {supabase} from '@core/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import {makeRedirectUri} from 'expo-auth-session';
import {auth} from '@core/utils';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  fullName?: string;
}

export const authService = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials) {
    const {data, error} = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Login with Google OAuth
   */
  async loginWithGoogle() {
    auth.debug('🚀 Starting Google OAuth...');
    auth.debug('📱 Package: com.dmarjet');

    // Cleanup any existing sessions
    try {
      await WebBrowser.dismissAuthSession();
    } catch {
      // Ignore cleanup errors
    }

    const redirectUrl = 'dmarjet://google-auth';
    auth.debug('🔗 Redirect URL:', redirectUrl);
    auth.debug('⚠️  IMPORTANT: Supabase Dashboard\'da bu URL\'nin kayıtlı olduğundan emin olun!');

    const {data, error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
        skipBrowserRedirect: false,
      },
    });

    if (error || !data?.url) {
      auth.error('OAuth URL hatası:', error?.message);
      throw new Error('Google OAuth bağlantısı kurulamadı');
    }

    auth.debug('Opening OAuth browser...');

    // Open browser with timeout
    const browserResult = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectUrl),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Browser timeout')), 60000);
      }),
    ]);

    auth.debug('🌐 Browser result type:', browserResult.type);

    // Handle cancel
    if (browserResult.type === 'cancel') {
      auth.info('❌ Kullanıcı iptal etti');
      throw new Error('Google giriş iptal edildi');
    }

    // Check success
    if (browserResult.type !== 'success' || !browserResult.url) {
      auth.error('❌ Browser session başarısız:', browserResult.type);
      auth.error('Browser result:', JSON.stringify(browserResult, null, 2));
      throw new Error('OAuth akışı tamamlanamadı');
    }

    auth.debug('✅ Browser OAuth başarılı, URL processing...');

    try {
      // Log the full URL for debugging
      auth.debug('🔍 Processing OAuth URL:', browserResult.url.substring(0, 100) + '...');
      
      const url = new URL(browserResult.url);
      auth.debug('📋 URL Details:', {
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname,
        hasHash: !!url.hash,
        hasSearch: !!url.search
      });
      
      let params: URLSearchParams | null = null;
      let access_token: string | null = null;
      let refresh_token: string | null = null;

      // Try fragment first (after #)
      const fragment = url.hash.substring(1);
      if (fragment) {
        auth.debug('🔑 Found URL fragment, parsing...');
        params = new URLSearchParams(fragment);
        access_token = params.get('access_token');
        refresh_token = params.get('refresh_token');
        auth.debug('Fragment tokens:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });
      }

      // If no tokens in fragment, try query parameters (after ?)
      if (!access_token || !refresh_token) {
        auth.debug('🔍 No tokens in fragment, trying query parameters...');
        params = new URLSearchParams(url.search);
        access_token = params.get('access_token');
        refresh_token = params.get('refresh_token');
        auth.debug('Query tokens:', {
          hasAccessToken: !!access_token,
          hasRefreshToken: !!refresh_token
        });
      }

      // Check for authorization code (PKCE flow)
      if (!access_token && !refresh_token && params) {
        const code = params.get('code');
        if (code) {
          auth.debug('🔐 Found authorization code, exchanging for tokens...');
          // Let Supabase handle the code exchange
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            auth.error('❌ Code exchange error:', error);
            throw new Error(`Code exchange failed: ${error.message}`);
          }
          if (data.session) {
            auth.info('✅ OAuth successful via code exchange!');
            return data;
          }
        }
      }

      if (!access_token || !refresh_token) {
        auth.error('❌ No tokens found in URL!');
        auth.error('URL Analysis:', {
          fullUrl: browserResult.url,
          hasFragment: !!fragment,
          hasQuery: !!url.search,
          fragmentContent: fragment ? fragment.substring(0, 50) + '...' : 'none',
          queryContent: url.search ? url.search.substring(0, 50) + '...' : 'none'
        });
        throw new Error('OAuth tokens not found in response URL');
      }

      auth.debug('🎫 Tokenlar alındı, session kuruluyor...');

      // Set the session with extracted tokens
      const {data: sessionData, error: sessionError} =
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

      if (sessionError) {
        auth.error('❌ Session kurulum hatası:', sessionError.message);
        auth.error('Session error details:', JSON.stringify(sessionError, null, 2));
        throw new Error(`Session kurulumu başarısız: ${sessionError.message}`);
      }

      if (!sessionData.session?.user) {
        auth.error('❌ Session kuruldu ama user bilgisi yok');
        auth.error('Session data:', JSON.stringify(sessionData, null, 2));
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      auth.info('✅ OAuth başarılı! User:', sessionData.session.user.email);
      
      // Wait a bit for the auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return sessionData;
    } catch (urlError: any) {
      auth.error('❌ URL processing hatası:', urlError.message);
      auth.error('Error stack:', urlError.stack);
      throw new Error(`OAuth response işlenemedi: ${urlError.message}`);
    }
  },

  /**
   * Register new user
   */
  async register(credentials: RegisterCredentials) {
    const {data, error} = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          full_name: credentials.fullName,
        },
      },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const {error} = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
  },

  /**
   * Verify OTP and update password
   */
  async verifyOtpAndUpdatePassword(email: string, token: string, newPassword: string) {
    // First verify the OTP
    const {error: verifyError} = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    });

    if (verifyError) throw verifyError;

    // Then update the password
    const {error: updateError} = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) throw updateError;
  },

  /**
   * Logout
   */
  async logout() {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
  },
};

