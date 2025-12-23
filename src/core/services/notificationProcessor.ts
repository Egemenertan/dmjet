import { supabase } from './supabase';

/**
 * Notification Processor Service
 * Pending bildirimleri işlemek için Edge Function'ı tetikler
 * Yeniden tasarlanmış ve geliştirilmiş versiyon
 */
class NotificationProcessor {
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;
  private lastProcessTime = 0;
  private minProcessInterval = 5000; // Minimum 5 saniye bekle

  /**
   * Edge Function'ı çağırarak pending bildirimleri işle
   * Geliştirilmiş hata yönetimi ve rate limiting ile
   */
  async processPendingNotifications(): Promise<{
    success: boolean;
    sent?: number;
    failed?: number;
    total?: number;
    error?: string;
  }> {
    // Rate limiting kontrolü
    const now = Date.now();
    if (now - this.lastProcessTime < this.minProcessInterval) {
      return { success: false, error: 'Rate limited' };
    }

    if (this.isProcessing) {
      return { success: false, error: 'Already processing' };
    }

    this.isProcessing = true;
    this.lastProcessTime = now;

    try {
      // Önce pending bildirim sayısını kontrol et
      const pendingCount = await this.getPendingCount();
      if (pendingCount === 0) {
        return { success: true, sent: 0, failed: 0, total: 0 };
      }

      // Yeni Edge Function'ı çağır (v2)
      const { data, error } = await supabase.functions.invoke('send-push-notifications-v2', {
        body: { 
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          version: 'v2'
        },
      });

      if (error) {
        console.error('❌ Edge function hatası:', error.message);
        return { success: false, error: error.message };
      }

      const result = {
        success: true,
        sent: data?.sent || data?.success || 0,
        failed: data?.failed || 0,
        total: data?.total || pendingCount,
      };

      // Sadece başarılı gönderimde log
      if (result.sent > 0) {
        console.log(`✅ ${result.sent} bildirim gönderildi`);
      }

      return result;
    } catch (error: any) {
      console.error('❌ Bildirim işleme hatası:', error.message);
      return { success: false, error: error.message };
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Otomatik işleme başlat (her 30 saniyede bir)
   */
  startAutoProcessing(intervalMs: number = 30000) {
    if (this.processInterval) {
      return;
    }

    // İlk işlemi hemen başlat
    this.processPendingNotifications();

    // Periyodik işleme başlat
    this.processInterval = setInterval(() => {
      this.processPendingNotifications();
    }, intervalMs);
  }

  /**
   * Otomatik işlemeyi durdur
   */
  stopAutoProcessing() {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }
  }

  /**
   * Pending bildirim sayısını al
   */
  async getPendingCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) {
        console.error('Error getting pending count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
  }
}

export const notificationProcessor = new NotificationProcessor();








