/**
 * Auth Service
 * Authentication operations
 */

import {supabase} from '@core/services/supabase';
import * as WebBrowser from 'expo-web-browser';
import {makeRedirectUri} from 'expo-auth-session';

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
    console.log('🚀 Starting Google OAuth...');

    // Cleanup any existing sessions
    try {
      await WebBrowser.dismissAuthSession();
    } catch {
      // Ignore cleanup errors
    }

    const redirectUrl = 'dmarjetmobile://google-auth';
    console.log('🔗 Redirect URL:', redirectUrl);

    const {data, error} = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error || !data?.url) {
      console.error('❌ OAuth URL hatası:', error?.message);
      throw new Error('Google OAuth bağlantısı kurulamadı');
    }

    console.log('🌐 Opening OAuth browser...');

    // Open browser with timeout
    const browserResult = await Promise.race([
      WebBrowser.openAuthSessionAsync(data.url, redirectUrl),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Browser timeout')), 60000);
      }),
    ]);

    console.log('📱 Browser result:', browserResult.type);

    // Handle cancel
    if (browserResult.type === 'cancel') {
      console.log('ℹ️ Kullanıcı iptal etti');
      throw new Error('Google giriş iptal edildi');
    }

    // Check success
    if (browserResult.type !== 'success' || !browserResult.url) {
      console.error('❌ Browser session başarısız:', browserResult.type);
      throw new Error('OAuth akışı tamamlanamadı');
    }

    console.log('✅ Browser OAuth başarılı, URL processing...');

    try {
      // Extract the URL fragment (after #)
      const url = new URL(browserResult.url);
      const fragment = url.hash.substring(1); // Remove the #

      if (!fragment) {
        console.error('❌ URL fragment bulunamadı');
        throw new Error('OAuth response formatı geçersiz');
      }

      // Parse the fragment as query parameters
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        console.error('❌ Tokenlar URLde bulunamadı');
        throw new Error('OAuth tokenlari alınamadı');
      }

      console.log('🔐 Tokenlar alındı, session kuruluyor...');

      // Set the session with extracted tokens
      const {data: sessionData, error: sessionError} =
        await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

      if (sessionError) {
        console.error('❌ Session kurulum hatası:', sessionError.message);
        throw new Error(`Session kurulumu başarısız: ${sessionError.message}`);
      }

      if (!sessionData.session?.user) {
        console.error('❌ Session kuruldu ama user bilgisi yok');
        throw new Error('Kullanıcı bilgileri alınamadı');
      }

      console.log('✅ OAuth başarılı! User:', sessionData.session.user.email);
      return sessionData;
    } catch (urlError: any) {
      console.error('❌ URL processing hatası:', urlError);
      throw new Error('OAuth response işlenemedi');
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
    const {error} = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'dmarjetmobile://reset-password',
    });

    if (error) throw error;
  },

  /**
   * Logout
   */
  async logout() {
    const {error} = await supabase.auth.signOut();
    if (error) throw error;
  },
};

