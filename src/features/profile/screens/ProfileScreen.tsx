/**
 * Profile Screen
 * Yeniden tasarlanmış modern profil sayfası
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {
  NavArrowLeft,
  User,
  NavArrowRight,
  Pin,
  Language,
  BookStack,
  Lock,
  Bell,
} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {authService} from '@features/auth/services/authService';
import {useAuthStore} from '@store/slices/authStore';
import {useAppStore} from '@store/slices/appStore';
import {useTranslation, i18n, saveLanguage} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';
import {Button} from '@shared/ui';

export const ProfileScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, isAuthenticated, profile} = useAuthStore();
  const {setLanguage} = useAppStore();
  const {setActiveTab} = useTabNavigation();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language);

  const handleLogout = async () => {
    Alert.alert(
      t('auth.logout'),
      'Çıkış yapmak istediğinize emin misiniz?',
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.logout();
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message);
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      await saveLanguage(languageCode);
      setCurrentLanguage(languageCode);
      setLanguage(languageCode as 'tr' | 'en' | 'ru');
      setIsLanguageModalVisible(false);
      Alert.alert(t('common.done'), t('profile.languageChanged'));
    } catch (error) {
      console.error('Dil değiştirilemedi:', error);
      Alert.alert(t('common.error'), 'Dil değiştirilemedi');
    }
  };

  const getLanguageName = (code: string): string => {
    switch (code) {
      case 'tr':
        return t('profile.turkish');
      case 'en':
        return t('profile.english');
      case 'ru':
        return t('profile.russian');
      default:
        return code;
    }
  };

  // Kullanıcı giriş yapmamışsa
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        </View>

        <View style={styles.notLoggedInWrapper}>
          <View style={styles.notLoggedInContainer}>
            <View style={styles.notLoggedInIcon}>
              <User width={64} height={64} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.notLoggedInTitle}>
              {t('profile.loginToViewProfile')}
            </Text>
            <Text style={styles.notLoggedInText}>
              {t('profile.loginToViewProfileText')}
            </Text>
            <View style={styles.notLoggedInButtons}>
              <Button
                title={t('auth.login')}
                onPress={() =>
                  (navigation as any).navigate('Auth', {
                    screen: 'Login',
                    params: {returnTo: 'MainTabs'},
                  })
                }
                fullWidth
                size="md"
                rounded={true}
              />
              <Button
                title={t('auth.register')}
                variant="outline"
                onPress={() =>
                  (navigation as any).navigate('Auth', {
                    screen: 'Register',
                    params: {returnTo: 'MainTabs'},
                  })
                }
                fullWidth
                rounded={true}
                size="md"
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setActiveTab('Home')}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Avatar & Name Section - Sola Dayalı */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{uri: profile.avatar_url}} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User width={40} height={40} color="#fff" strokeWidth={2} />
              </View>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {profile?.full_name || t('profile.user')}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* Menu Items - Beyaz Arka Plan, Primary İkonlar */}
        <View style={styles.menuSection}>
          {/* Kişisel Bilgilerim */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('PersonalInfo')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <User
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.menuItemText}>{t('profile.personalInfo')}</Text>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Adres Bilgilerim */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('AddressInfo')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Pin
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.menuItemText}>{t('profile.addresses')}</Text>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Güvenlik */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('Security')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Lock
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.menuItemText}>{t('profile.security')}</Text>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Bildirim Tercihleri */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('NotificationPreferences')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Bell
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.menuItemText}>{t('profile.notificationPreferences')}</Text>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Dil Seçimi */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setIsLanguageModalVisible(true)}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <Language
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <View style={styles.menuItemTextContainer}>
                <Text style={styles.menuItemText}>{t('profile.language')}</Text>
                <Text style={styles.menuItemSubtext}>
                  {getLanguageName(currentLanguage)}
                </Text>
              </View>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>

          {/* Yasal Dökümanlar */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => (navigation as any).navigate('Legal')}
            activeOpacity={0.7}>
            <View style={styles.menuItemLeft}>
              <View style={styles.iconContainer}>
                <BookStack
                  width={18}
                  height={18}
                  color={colors.primary}
                  strokeWidth={2}
                />
              </View>
              <Text style={styles.menuItemText}>{t('legal.title')}</Text>
            </View>
            <NavArrowRight
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}>
            <Text style={styles.logoutText}>{t('auth.logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.languageModal}>
            <View style={styles.languageModalHeader}>
              <Text style={styles.languageModalTitle}>
                {t('profile.selectLanguage')}
              </Text>
              <TouchableOpacity
                onPress={() => setIsLanguageModalVisible(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.languageOptions}>
              {/* Turkish */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'tr' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('tr')}>
                <Text style={styles.languageFlag}>🇹🇷</Text>
                <Text
                  style={[
                    styles.languageOptionText,
                    currentLanguage === 'tr' && styles.languageOptionTextActive,
                  ]}>
                  Türkçe
                </Text>
                {currentLanguage === 'tr' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* English */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'en' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('en')}>
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text
                  style={[
                    styles.languageOptionText,
                    currentLanguage === 'en' && styles.languageOptionTextActive,
                  ]}>
                  English
                </Text>
                {currentLanguage === 'en' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Russian */}
              <TouchableOpacity
                style={[
                  styles.languageOption,
                  currentLanguage === 'ru' && styles.languageOptionActive,
                ]}
                onPress={() => handleLanguageChange('ru')}>
                <Text style={styles.languageFlag}>🇷🇺</Text>
                <Text
                  style={[
                    styles.languageOptionText,
                    currentLanguage === 'ru' && styles.languageOptionTextActive,
                  ]}>
                  Русский
                </Text>
                {currentLanguage === 'ru' && (
                  <View style={styles.languageCheckmark}>
                    <Text style={styles.languageCheckmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#fff',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginRight: spacing.md,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  menuSection: {
    marginTop: spacing.lg,
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  menuItemSubtext: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutSection: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 72,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#fee2e2',
    minHeight: 56,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: '#ef4444',
  },
  notLoggedInWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  notLoggedInContainer: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: spacing.xl,
  },
  notLoggedInIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  notLoggedInTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  notLoggedInText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
    paddingHorizontal: spacing.sm,
  },
  notLoggedInButtons: {
    width: '100%',
    gap: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  languageModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  languageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  languageModalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: fontSize.xl,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  languageOptions: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  languageFlag: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  languageOptionText: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  languageOptionTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
  languageCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageCheckmarkText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});
