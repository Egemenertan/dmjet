import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useTranslation } from '../../localization';

interface DeliverySettings {
  id: string;
  working_hours_start: string;
  working_hours_end: string;
  is_working_hours_enabled: boolean;
  working_hours_message_tr: string;
  working_hours_message_en: string;
  working_hours_message_ru: string;
}

interface WorkingHoursStatus {
  isWithinWorkingHours: boolean;
  message: string;
  workingHours: {
    start: string;
    end: string;
  } | null;
  isEnabled: boolean;
}

export const useWorkingHours = () => {
  const [status, setStatus] = useState<WorkingHoursStatus>({
    isWithinWorkingHours: true,
    message: '',
    workingHours: null,
    isEnabled: false,
  });
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const checkWorkingHours = (settings: DeliverySettings): WorkingHoursStatus => {
    if (!settings.is_working_hours_enabled) {
      return {
        isWithinWorkingHours: true,
        message: '',
        workingHours: {
          start: settings.working_hours_start,
          end: settings.working_hours_end,
        },
        isEnabled: false,
      };
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS formatında

    const startTime = settings.working_hours_start;
    const endTime = settings.working_hours_end;

    // Saat karşılaştırması
    const isWithinHours = currentTime >= startTime && currentTime <= endTime;

    // Mesajı dile göre seç
    let message = '';
    if (!isWithinHours) {
      const messageTemplate = 
        currentLanguage === 'en' ? settings.working_hours_message_en :
        currentLanguage === 'ru' ? settings.working_hours_message_ru :
        settings.working_hours_message_tr;

      // Saat formatını HH:MM olarak düzenle
      const formatTime = (time: string) => time.slice(0, 5);
      
      message = messageTemplate
        .replace('{start}', formatTime(startTime))
        .replace('{end}', formatTime(endTime));
    }

    return {
      isWithinWorkingHours: isWithinHours,
      message,
      workingHours: {
        start: startTime,
        end: endTime,
      },
      isEnabled: true,
    };
  };

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('delivery_settings')
        .select(`
          id,
          working_hours_start,
          working_hours_end,
          is_working_hours_enabled,
          working_hours_message_tr,
          working_hours_message_en,
          working_hours_message_ru
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Çalışma saatleri alınırken hata:', error);
        return;
      }

      if (data) {
        const newStatus = checkWorkingHours(data);
        setStatus(newStatus);
      }
    } catch (error) {
      console.error('Çalışma saatleri kontrol hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // İlk yükleme
  useEffect(() => {
    fetchWorkingHours();
  }, [currentLanguage]);

  // Her dakika kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      fetchWorkingHours();
    }, 60000); // 1 dakika

    return () => clearInterval(interval);
  }, [currentLanguage]);

  const refreshWorkingHours = () => {
    fetchWorkingHours();
  };

  const getOutsideWorkingHoursMessage = () => {
    return status.message;
  };

  return {
    ...status,
    loading,
    refreshWorkingHours,
    getOutsideWorkingHoursMessage,
    isOutsideWorkingHours: !status.isWithinWorkingHours,
  };
};
