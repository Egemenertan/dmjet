/**
 * Device Security Service - Basit Versiyon
 * profiles tablosundaki device_id kolonunu kullanır
 */

import DeviceInfo from 'react-native-device-info';
import {supabase} from './supabase';

export interface SimpleDeviceInfo {
  device_id: string;
  device_name: string;
  ip_address?: string;
}

export interface DeviceCheckResult {
  allowed: boolean;
  reason: string;
  message?: string;
  device_id?: string;
  old_device_id?: string;
  new_device_id?: string;
}

class DeviceSecurityService {
  private deviceId: string | null = null;

  /**
   * Cihaz ID'sini al
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }

    try {
      this.deviceId = await DeviceInfo.getUniqueId();
      return this.deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      throw error;
    }
  }

  /**
   * Basit cihaz bilgilerini topla
   */
  async getDeviceInfo(): Promise<SimpleDeviceInfo> {
    try {
      const [deviceId, deviceName] = await Promise.all([
        this.getDeviceId(),
        DeviceInfo.getDeviceName(),
      ]);

      // IP adresini al (opsiyonel)
      let ipAddress: string | undefined;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.warn('IP address could not be fetched:', error);
      }

      return {
        device_id: deviceId,
        device_name: deviceName,
        ip_address: ipAddress,
      };
    } catch (error) {
      console.error('Error getting device info:', error);
      throw error;
    }
  }

  /**
   * Cihazı kontrol et ve güncelle
   */
  async checkAndUpdateDevice(): Promise<DeviceCheckResult> {
    try {
      const deviceInfo = await this.getDeviceInfo();

      const {data, error} = await supabase.rpc('check_and_update_device', {
        p_device_id: deviceInfo.device_id,
        p_device_info: deviceInfo,
      });

      if (error) {
        console.error('Device check error:', error);
        throw error;
      }

      return data as DeviceCheckResult;
    } catch (error) {
      console.error('Error checking device:', error);
      throw error;
    }
  }

  /**
   * Yeni cihazı onayla (email linkinden)
   */
  async approveNewDevice(newDeviceId: string): Promise<void> {
    try {
      const {data, error} = await supabase.rpc('approve_new_device', {
        p_new_device_id: newDeviceId,
      });

      if (error) {
        console.error('Error approving device:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to approve device');
      }
    } catch (error) {
      console.error('Error approving device:', error);
      throw error;
    }
  }

  /**
   * Cihazı sıfırla (yeni cihaz kullanmak için)
   */
  async resetDevice(): Promise<void> {
    try {
      const {data, error} = await supabase.rpc('reset_device');

      if (error) {
        console.error('Error resetting device:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to reset device');
      }
    } catch (error) {
      console.error('Error resetting device:', error);
      throw error;
    }
  }

  /**
   * Cache'i temizle (logout için)
   */
  clearCache() {
    this.deviceId = null;
  }
}

export const deviceSecurityService = new DeviceSecurityService();

