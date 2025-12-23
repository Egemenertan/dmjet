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
   */
  async getProfile(userId: string): Promise<ProfileData | null> {
    try {
      // Debug log silindi - production'da gereksiz
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, this is expected for new users
          return await this.createDefaultProfile(userId);
        }
        console.error('❌ Profile fetch error:', {
          code: error.code,
          message: error.message,
        });
        throw error;
      }

      if (!data) {
        return await this.createDefaultProfile(userId);
      }

      // Debug log silindi - production'da gereksiz

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
   */
  private async createDefaultProfile(userId: string): Promise<ProfileData | null> {
    try {
      // Log silindi - production'da gereksiz
      
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

      const { data, error } = await supabase
        .from('profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating default profile:', error);
        throw error;
      }

      // Log silindi - production'da gereksiz
      return data;
    } catch (error: any) {
      console.error('❌ Default profile creation failed:', error);
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
}

export const profileService = new ProfileService();

