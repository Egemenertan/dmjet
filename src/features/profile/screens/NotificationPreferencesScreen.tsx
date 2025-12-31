/**
 * Notification Preferences Screen
 * Kullanıcı bildirim tercihlerini yönetme sayfası
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NavArrowLeft, X} from 'iconoir-react-native';
import * as Notifications from 'expo-notifications';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {supabase} from '@core/services/supabase';
import {useTranslation} from '@localization';

interface NotificationPreferences {
  order_updates: boolean;
  promotional: boolean;
  system: boolean;
}

export const NotificationPreferencesScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user} = useAuthStore();
  
  const [systemPermissionGranted, setSystemPermissionGranted] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    order_updates: true,
    promotional: true,
    system: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Sistem izinlerini kontrol et
  useEffect(() => {
    checkSystemPermissions();
    loadPreferences();
  }, []);

  const checkSystemPermissions = async () => {
    try {
      const {status} = await Notifications.getPermissionsAsync();
      setSystemPermissionGranted(status === 'granted');
    } catch (error) {
      console.error('İzin kontrolü hatası:', error);
    }
  };

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      const {data, error} = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        setPreferences(data.notification_preferences);
      }
    } catch (error) {
      console.error('Tercihler yüklenemedi:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async (newPreferences: NotificationPreferences) => {
    if (!user?.id) return;

    try {
      const {error} = await supabase
        .from('profiles')
        .update({notification_preferences: newPreferences})
        .eq('id', user.id);

      if (error) throw error;

      setPreferences(newPreferences);
    } catch (error) {
      console.error('Tercihler kaydedilemedi:', error);
      Alert.alert(t('common.error'), t('profile.preferencesError'));
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    // Eğer sistem izni yoksa ve kullanıcı açmaya çalışıyorsa
    if (!systemPermissionGranted && !preferences[key]) {
      Alert.alert(
        t('profile.notificationPermissionRequired'),
        t('profile.notificationPermissionAlert'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {
            text: t('profile.goToSettings'),
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
      return;
    }

    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    await savePreferences(newPreferences);
  };

  const requestSystemPermission = async () => {
    try {
      const {status: existingStatus} = await Notifications.getPermissionsAsync();
      
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const {status} = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setSystemPermissionGranted(true);
        Alert.alert(t('common.done'), t('profile.permissionGranted'));
      } else {
        Alert.alert(
          t('profile.permissionDenied'),
          t('profile.permissionDeniedDesc'),
          [
            {text: t('common.ok'), style: 'cancel'},
            {
              text: t('profile.goToSettings'),
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('İzin isteği hatası:', error);
      Alert.alert(t('common.error'), t('profile.permissionError'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.notificationPreferences')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        
        {/* Sistem İzni Durumu */}
        {!systemPermissionGranted && (
          <View style={styles.permissionSection}>
            <View style={styles.permissionHeader}>
              <Text style={styles.permissionTitle}>
                {t('profile.notificationPermissionRequired')}
              </Text>
              <Text style={styles.permissionDescription}>
                {t('profile.notificationPermissionDesc')}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestSystemPermission}
              activeOpacity={0.7}>
              <Text style={styles.permissionButtonText}>{t('profile.grantPermission')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bildirim Tercihleri */}
        <View style={styles.preferencesSection}>
          <Text style={styles.sectionTitle}>{t('profile.notificationTypes')}</Text>
          
          {/* Sipariş Bildirimleri */}
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>{t('profile.orderNotifications')}</Text>
              <Text style={styles.preferenceDescription}>
                {t('profile.orderNotificationsDesc')}
              </Text>
            </View>
            <Switch
              value={preferences.order_updates && systemPermissionGranted}
              onValueChange={() => handleToggle('order_updates')}
              trackColor={{false: '#e5e5e5', true: colors.primary}}
              thumbColor={'#fff'}
              ios_backgroundColor="#e5e5e5"
              disabled={!systemPermissionGranted}
            />
          </View>

          {/* Kampanya Bildirimleri */}
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>{t('profile.promotionalNotifications')}</Text>
              <Text style={styles.preferenceDescription}>
                {t('profile.promotionalNotificationsDesc')}
              </Text>
            </View>
            <Switch
              value={preferences.promotional && systemPermissionGranted}
              onValueChange={() => handleToggle('promotional')}
              trackColor={{false: '#e5e5e5', true: colors.primary}}
              thumbColor={'#fff'}
              ios_backgroundColor="#e5e5e5"
              disabled={!systemPermissionGranted}
            />
          </View>

          {/* Sistem Bildirimleri */}
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceInfo}>
              <Text style={styles.preferenceTitle}>{t('profile.systemNotifications')}</Text>
              <Text style={styles.preferenceDescription}>
                {t('profile.systemNotificationsDesc')}
              </Text>
            </View>
            <Switch
              value={preferences.system && systemPermissionGranted}
              onValueChange={() => handleToggle('system')}
              trackColor={{false: '#e5e5e5', true: colors.primary}}
              thumbColor={'#fff'}
              ios_backgroundColor="#e5e5e5"
              disabled={!systemPermissionGranted}
            />
          </View>
        </View>

        {/* Bilgi Kutusu */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>{t('profile.notificationInfo')}</Text>
          <Text style={styles.infoText}>
            {t('profile.notificationInfoDesc')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  permissionSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  permissionHeader: {
    marginBottom: spacing.md,
  },
  permissionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  permissionDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  preferencesSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,

    letterSpacing: 0.5,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  preferenceTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  preferenceDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
  },
  infoTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,

    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

