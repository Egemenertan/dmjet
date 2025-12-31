/**
 * Profile Service
 * Handles profile-related operations
 */

import { supabase } from '@core/services/supabase';
import { ProfileData as AuthProfileData } from '@store/slices/authStore';
import { auth } from '@core/utils';

export interface UpdateProfileData {
  full_name?: string;
  phone?: string;
  country_code?: string;
  address?: string;
  aile_karti?: string;
  location_lat?: number;
  location_lng?: number;
}

// Re-export ProfileData from authStore to ensure type consistency
export type ProfileData = AuthProfileData;

class ProfileService {
  /**
   * Get user profile by ID with enhanced error handling
   * Retry logic for OAuth session initialization
   */
  async getProfile(userId: string, retryCount: number = 0): Promise<ProfileData | null> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      // Ensure session is ready before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.getProfile(userId, retryCount + 1);
        }
        console.error('❌ No session available for profile fetch');
        return null;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, try to create default profile
          // But first check if profile exists (RLS might be blocking)
          if (retryCount < MAX_RETRIES) {
            // Wait a bit for RLS to be ready after OAuth
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return this.getProfile(userId, retryCount + 1);
          }
          // After retries, try to create profile
          return await this.createDefaultProfile(userId);
        }
        console.error('❌ Profile fetch error:', {
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      if (!data) {
        // Profile not found, try to create
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.getProfile(userId, retryCount + 1);
        }
        return await this.createDefaultProfile(userId);
      }

      return data;
    } catch (error: any) {
      console.error('❌ Profile service error:', {
        message: error.message,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Create a default profile for new users
   * Uses upsert to handle race conditions where profile might already exist
   */
  private async createDefaultProfile(userId: string): Promise<ProfileData | null> {
    try {
      // First, check if profile already exists (might be a race condition)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Profile already exists, return it
        return existingProfile;
      }

      // Get user email from auth
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ Cannot get user for profile creation:', userError);
        return null;
      }

      const defaultProfile = {
        id: userId,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        phone: null,
        country_code: '+90',
        address: null,
        address_details: null,
        aile_karti: null,
        location_lat: null,
        location_lng: null,
        avatar_url: user.user_metadata?.avatar_url || null,
        is_admin: false,
        is_active: true,
        role: 'user' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Use upsert to handle race conditions
      const { data, error } = await supabase
        .from('profiles')
        .upsert(defaultProfile, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        // If it's a duplicate key error, try to fetch the existing profile
        if (error.code === '23505' || error.message?.includes('duplicate')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          if (profile) {
            return profile;
          }
        }
        console.error('❌ Error creating default profile:', error);
        throw error;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Default profile creation failed:', error);
      // Try one more time to fetch existing profile
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        if (profile) {
          return profile;
        }
      } catch (fetchError) {
        // Ignore fetch error
      }
      // Return null instead of throwing to allow app to continue
      return null;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updates: UpdateProfileData
  ): Promise<ProfileData> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  /**
   * Update family card (aile kartı) information
   */
  async updateFamilyCard(
    userId: string,
    aileKarti: string
  ): Promise<ProfileData> {
    try {
      return await this.updateProfile(userId, { aile_karti: aileKarti });
    } catch (error: any) {
      // Eğer kolon yoksa, kullanıcıya bilgi ver
      if (error?.code === '42703') {
        throw new Error('Aile kartı özelliği henüz aktif değil. Lütfen veritabanı migration\'ını çalıştırın.');
      }
      throw error;
    }
  }

  /**
   * Update location information
   */
  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
    address?: string
  ): Promise<ProfileData> {
    return this.updateProfile(userId, {
      location_lat: latitude,
      location_lng: longitude,
      address,
    });
  }

  /**
   * Delete user account permanently
   * This will:
   * 1. Delete user profile from profiles table
   * 2. Delete user from auth.users table
   * 3. All related data will be cascade deleted (orders, notifications, etc.)
   */
  async deleteAccount(): Promise<void> {
    try {
      // Call the RPC function to delete the account
      const { error } = await supabase.rpc('delete_user_account');

      if (error) {
        console.error('❌ Error deleting account:', error);
        throw new Error('Hesap silinirken bir hata oluştu. Lütfen tekrar deneyin.');
      }

      // Sign out the user
      await supabase.auth.signOut();
    } catch (error: any) {
      console.error('❌ Account deletion failed:', error);
      throw error;
    }
  }
}

export const profileService = new ProfileService();

