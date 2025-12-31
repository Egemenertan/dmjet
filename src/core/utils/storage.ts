/**
 * Storage Utilities - SECURE VERSION
 * Helper functions for Supabase Storage operations with security
 */

import {supabase} from '@core/services/supabase';

// ============================================================================
// PUBLIC BUCKET FUNCTIONS (product)
// ============================================================================

/**
 * Get public URL for a file in PUBLIC bucket
 * @param bucket - Bucket name
 * @param path - File path in bucket
 * @returns Public URL or null if path is empty
 */
export const getStorageUrl = (bucket: string, path: string | null | undefined): string | null => {
  if (!path) return null;
  
  const {data} = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

/**
 * Get public URL for a category image
 * @param imagePath - Image file name or path
 * @returns Public URL or null
 */
export const getCategoryImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // Eğer tam URL ise direkt döndür
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Supabase Storage'dan public URL oluştur
  // Kategoriler için bucket adı 'product' ve path 'category/{filename}'
  const fullPath = imagePath.includes('/') ? imagePath : `category/${imagePath}`;
  return getStorageUrl('product', fullPath);
};

/**
 * Get public URL for a product image
 * @param imagePath - Image file name or path
 * @returns Public URL or null
 */
export const getProductImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath) return null;
  
  // Eğer tam URL ise direkt döndür
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Supabase Storage'dan public URL oluştur
  // Ürünler için bucket adı 'product' ve path 'products/{filename}'
  const fullPath = imagePath.includes('/') ? imagePath : `products/${imagePath}`;
  return getStorageUrl('product', fullPath);
};

// ============================================================================
// PRIVATE BUCKET FUNCTIONS (avatars)
// ============================================================================

/**
 * Get signed URL for a file in PRIVATE bucket
 * @param bucket - Bucket name
 * @param path - File path
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL or null
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!path) return null;

  try {
    const {data, error} = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('Signed URL error:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Failed to create signed URL:', error);
    return null;
  }
};

/**
 * Upload avatar image
 * @param userId - User ID
 * @param fileUri - Local file URI
 * @param fileName - File name
 * @returns File path or null
 */
export const uploadAvatar = async (
  userId: string,
  fileUri: string,
  fileName: string
): Promise<string | null> => {
  try {
    // Dosyayı fetch ile al
    const response = await fetch(fileUri);
    const blob = await response.blob();

    // Dosya boyutu kontrolü (2 MB)
    if (blob.size > 2 * 1024 * 1024) {
      throw new Error('File size exceeds 2MB limit');
    }

    // Dosya tipi kontrolü
    if (!blob.type.startsWith('image/')) {
      throw new Error('Only image files are allowed');
    }

    const filePath = `${userId}/${fileName}`;

    const {data, error} = await supabase.storage
      .from('avatars')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true, // Üzerine yaz
        contentType: blob.type,
      });

    if (error) throw error;

    return data.path;
  } catch (error) {
    console.error('Avatar upload error:', error);
    return null;
  }
};

/**
 * Get avatar URL (signed)
 * @param userId - User ID
 * @param fileName - File name
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL or null
 */
export const getAvatarUrl = async (
  userId: string,
  fileName: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!userId || !fileName) return null;
  
  const filePath = `${userId}/${fileName}`;
  return getSignedUrl('avatars', filePath, expiresIn);
};

/**
 * Get avatar URL from full path (signed)
 * @param avatarPath - Full path (e.g., "user-id/avatar.jpg")
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL or null
 */
export const getAvatarUrlFromPath = async (
  avatarPath: string | null | undefined,
  expiresIn: number = 3600
): Promise<string | null> => {
  if (!avatarPath) return null;
  
  // Eğer tam URL ise direkt döndür
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  return getSignedUrl('avatars', avatarPath, expiresIn);
};

/**
 * Delete avatar
 * @param userId - User ID
 * @param fileName - File name
 * @returns Success status
 */
export const deleteAvatar = async (
  userId: string,
  fileName: string
): Promise<boolean> => {
  try {
    const filePath = `${userId}/${fileName}`;

    const {error} = await supabase.storage.from('avatars').remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Avatar delete error:', error);
    return false;
  }
};

/**
 * List user's avatars
 * @param userId - User ID
 * @returns List of files or empty array
 */
export const listUserAvatars = async (userId: string): Promise<string[]> => {
  try {
    const {data, error} = await supabase.storage
      .from('avatars')
      .list(userId, {
        limit: 10,
        sortBy: {column: 'created_at', order: 'desc'},
      });

    if (error) throw error;

    return data?.map(file => `${userId}/${file.name}`) || [];
  } catch (error) {
    console.error('List avatars error:', error);
    return [];
  }
};

