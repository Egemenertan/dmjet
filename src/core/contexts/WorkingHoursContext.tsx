import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useWorkingHours} from '../hooks/useWorkingHours';
import {WorkingHoursAlert} from '../../shared/components/WorkingHoursAlert';

interface WorkingHoursContextType {
  isWithinWorkingHours: boolean;
  message: string;
  workingHours: {
    start: string;
    end: string;
  } | null;
  isEnabled: boolean;
  loading: boolean;
  showAlert: () => void;
  hideAlert: () => void;
}

const WorkingHoursContext = createContext<WorkingHoursContextType | undefined>(
  undefined,
);

const ALERT_SHOWN_KEY = '@working_hours_alert_shown';
const ALERT_COOLDOWN_HOURS = 4; // 4 saat boyunca tekrar gösterme

interface WorkingHoursProviderProps {
  children: React.ReactNode;
}

export const WorkingHoursProvider: React.FC<WorkingHoursProviderProps> = ({
  children,
}) => {
  const workingHoursData = useWorkingHours();
  const [alertVisible, setAlertVisible] = useState(false);
  const [hasShownAlertToday, setHasShownAlertToday] = useState(false);

  // Uyarının gösterilip gösterilmeyeceğini kontrol et
  const checkShouldShowAlert = async () => {
    try {
      const lastShownData = await AsyncStorage.getItem(ALERT_SHOWN_KEY);

      if (lastShownData) {
        const {timestamp} = JSON.parse(lastShownData);
        const now = new Date().getTime();
        const timeDiff = now - timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);

        // 4 saatten az geçmişse uyarı gösterme
        if (hoursDiff < ALERT_COOLDOWN_HOURS) {
          setHasShownAlertToday(true);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Uyarı kontrol hatası:', error);
      return true;
    }
  };

  // Uyarının gösterildiğini kaydet
  const markAlertAsShown = async () => {
    try {
      const data = {
        timestamp: new Date().getTime(),
      };
      await AsyncStorage.setItem(ALERT_SHOWN_KEY, JSON.stringify(data));
      setHasShownAlertToday(true);
    } catch (error) {
      console.error('Uyarı kaydetme hatası:', error);
    }
  };

  // Çalışma saatleri dışındaysa ve daha önce gösterilmediyse uyarı göster
  useEffect(() => {
    const showAlertIfNeeded = async () => {
      if (
        !workingHoursData.loading &&
        workingHoursData.isEnabled &&
        !workingHoursData.isWithinWorkingHours &&
        !hasShownAlertToday
      ) {
        const shouldShow = await checkShouldShowAlert();
        if (shouldShow) {
          setAlertVisible(true);
        }
      }
    };

    showAlertIfNeeded();
  }, [
    workingHoursData.loading,
    workingHoursData.isEnabled,
    workingHoursData.isWithinWorkingHours,
    hasShownAlertToday,
  ]);

  const showAlert = () => {
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
    markAlertAsShown();
  };

  const contextValue: WorkingHoursContextType = {
    ...workingHoursData,
    showAlert,
    hideAlert,
  };

  return (
    <WorkingHoursContext.Provider value={contextValue}>
      {children}
      <WorkingHoursAlert
        visible={alertVisible}
        message={workingHoursData.message}
        workingHours={workingHoursData.workingHours}
        onClose={hideAlert}
      />
    </WorkingHoursContext.Provider>
  );
};

export const useWorkingHoursContext = (): WorkingHoursContextType => {
  const context = useContext(WorkingHoursContext);
  if (context === undefined) {
    throw new Error(
      'useWorkingHoursContext must be used within a WorkingHoursProvider',
    );
  }
  return context;
};





