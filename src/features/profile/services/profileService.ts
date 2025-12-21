/**
 * Profile Service
 * Handles profile-related operations
 */

import { supabase } from '@core/services/supabase';
import { ProfileData as AuthProfileData } from '@store/slices/authStore';

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
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ProfileData | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
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

