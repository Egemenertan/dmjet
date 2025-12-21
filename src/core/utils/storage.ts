/**
 * Storage Utilities
 * Helper functions for Supabase Storage operations
 */

import {supabase} from '@core/services/supabase';

/**
 * Get public URL for a file in Supabase Storage
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

