/**
 * Microsoft Clarity Analytics Service
 * 
 * Kullanıcı davranışı analizi ve session replay için Microsoft Clarity entegrasyonu.
 * 
 * @see https://clarity.microsoft.com/
 */

import * as Clarity from '@microsoft/react-native-clarity';
import Constants from 'expo-constants';

/**
 * Clarity servisinin başlatılıp başlatılmadığını takip eder
 */
let isInitialized = false;

/**
 * Clarity'yi başlatır
 * 
 * @remarks
 * - Production ortamında otomatik olarak başlatılır
 * - Development ortamında loglama seviyesi Verbose olarak ayarlanır
 * - Expo Go'da çalışmaz, native build gerektirir
 */
export const initializeClarity = async (): Promise<void> => {
  try {
    // Zaten başlatılmışsa tekrar başlatma
    if (isInitialized) {
      console.log('ℹ️ Clarity already initialized');
      return;
    }

    // Clarity Project ID - environment'tan alınabilir veya doğrudan kullanılabilir
    const clarityProjectId = Constants.expoConfig?.extra?.clarityProjectId || 'utx6o5wd7r';

    if (!clarityProjectId) {
      console.warn('⚠️ Clarity Project ID not found - Clarity disabled');
      return;
    }

    // Development ortamında daha detaylı loglama
    const logLevel = __DEV__ ? Clarity.LogLevel.Verbose : Clarity.LogLevel.None;

    // Clarity'yi başlat
    await Clarity.initialize(clarityProjectId, {
      logLevel,
    });

    isInitialized = true;
    console.log('✅ Clarity initialized successfully');
  } catch (error) {
    console.error('❌ Clarity initialization error:', error);
  }
};

/**
 * Özel bir olay kaydeder
 * 
 * @param eventName - Olay adı
 * @param eventProperties - Olay özellikleri (opsiyonel)
 * 
 * @example
 * ```typescript
 * logClarityEvent('product_viewed', { productId: '123', category: 'beverages' });
 * ```
 */
export const logClarityEvent = (eventName: string, eventProperties?: Record<string, any>): void => {
  if (!isInitialized) {
    console.warn('⚠️ Clarity not initialized - event not logged:', eventName);
    return;
  }

  try {
    if (eventProperties) {
      Clarity.setCustomTag(eventName, JSON.stringify(eventProperties));
    } else {
      Clarity.setCustomTag(eventName, 'true');
    }
  } catch (error) {
    console.error('❌ Clarity event logging error:', error);
  }
};

/**
 * Kullanıcı bilgilerini Clarity'ye set eder
 * 
 * @param userId - Kullanıcı ID'si
 * @param userProperties - Kullanıcı özellikleri (opsiyonel)
 * 
 * @example
 * ```typescript
 * setClarityUser('user-123', { 
 *   email: 'user@example.com',
 *   plan: 'premium' 
 * });
 * ```
 */
export const setClarityUser = (userId: string, userProperties?: Record<string, any>): void => {
  if (!isInitialized) {
    console.warn('⚠️ Clarity not initialized - user not set');
    return;
  }

  try {
    Clarity.setCustomUserId(userId);
    
    if (userProperties) {
      Object.entries(userProperties).forEach(([key, value]) => {
        Clarity.setCustomTag(key, String(value));
      });
    }
  } catch (error) {
    console.error('❌ Clarity user setting error:', error);
  }
};

/**
 * Clarity session'ını temizler (logout durumunda)
 */
export const clearClarityUser = (): void => {
  if (!isInitialized) {
    return;
  }

  try {
    // Clarity'de doğrudan clear user metodu yok, 
    // ancak anonymous user olarak işaretleyebiliriz
    Clarity.setCustomUserId('anonymous');
  } catch (error) {
    console.error('❌ Clarity user clearing error:', error);
  }
};

/**
 * Mevcut session URL'sini alır
 * 
 * @returns Session URL'si veya null
 */
export const getClaritySessionUrl = async (): Promise<string | null> => {
  if (!isInitialized) {
    console.warn('⚠️ Clarity not initialized');
    return null;
  }

  try {
    const sessionUrl = await Clarity.getCurrentSessionUrl();
    return sessionUrl;
  } catch (error) {
    console.error('❌ Clarity session URL error:', error);
    return null;
  }
};

/**
 * Clarity servisini export et
 */
export const clarityService = {
  initialize: initializeClarity,
  logEvent: logClarityEvent,
  setUser: setClarityUser,
  clearUser: clearClarityUser,
  getSessionUrl: getClaritySessionUrl,
};

