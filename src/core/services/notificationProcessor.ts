import { supabase } from './supabase';

/**
 * Notification Processor Service
 * Pending bildirimleri işlemek için Edge Function'ı tetikler
 */
class NotificationProcessor {
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;

  /**
   * Edge Function'ı çağırarak pending bildirimleri işle
   */
  async processPendingNotifications(): Promise<{
    success: boolean;
    sent?: number;
    failed?: number;
    error?: string;
  }> {
    if (this.isProcessing) {
      console.log('Already processing notifications...');
      return { success: false, error: 'Already processing' };
    }

    this.isProcessing = true;

    try {
      // Edge Function'ı çağır
      const { data, error } = await supabase.functions.invoke('send-push-notifications', {
        body: {},
      });

      if (error) {
        console.error('Error invoking edge function:', error);
        return { success: false, error: error.message };
      }

      console.log('Notification processing result:', data);
      return {
        success: true,
        sent: data?.sent || 0,
        failed: data?.failed || 0,
      };
    } catch (error: any) {
      console.error('Error processing notifications:', error);
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
      console.log('Auto processing already started');
      return;
    }

    console.log('Starting auto notification processing...');
    
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
      console.log('Auto notification processing stopped');
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







