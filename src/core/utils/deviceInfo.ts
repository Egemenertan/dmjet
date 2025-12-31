/**
 * Device Information Utility
 * Gets device ID and IP for security tracking
 */

import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Get unique device identifier
 * This is used for device banning
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    // Try to get installation ID (best option)
    if (Application.androidId) {
      return `android_${Application.androidId}`;
    }
    
    // iOS doesn't have a persistent ID, use combination
    const deviceName = Device.deviceName || 'unknown';
    const modelName = Device.modelName || 'unknown';
    const osVersion = Device.osVersion || 'unknown';
    
    // Create a fingerprint from device characteristics
    const fingerprint = `${Platform.OS}_${deviceName}_${modelName}_${osVersion}`;
    
    // Hash it for privacy
    return hashString(fingerprint);
  } catch (error) {
    console.error('Error getting device ID:', error);
    return 'unknown_device';
  }
};

/**
 * Get device user agent
 */
export const getUserAgent = (): string => {
  const deviceName = Device.deviceName || 'Unknown Device';
  const modelName = Device.modelName || 'Unknown Model';
  const osVersion = Device.osVersion || 'Unknown';
  const appVersion = Application.nativeApplicationVersion || '1.0.0';
  
  return `Dmarjet/${appVersion} (${Platform.OS} ${osVersion}; ${modelName}; ${deviceName})`;
};

/**
 * Simple hash function for device fingerprinting
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get client IP address from external API
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Use ipify API to get public IP
    const response = await fetch('https://api.ipify.org?format=json', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch IP');
    }
    
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.error('Error getting IP address:', error);
    return null;
  }
};

/**
 * Get device info for security logging
 */
export const getDeviceInfo = async () => {
  const deviceId = await getDeviceId();
  const userAgent = getUserAgent();
  const ip = await getClientIP();
  
  return {
    deviceId,
    userAgent,
    ip,
  };
};

