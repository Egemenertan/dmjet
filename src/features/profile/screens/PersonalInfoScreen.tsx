/**
 * Personal Info Screen
 * Kullanıcının kişisel bilgilerini düzenlediği sayfa
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NavArrowLeft, User, Mail} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useAuthStore} from '@store/slices/authStore';
import {profileService} from '../services/profileService';
import {useTranslation} from '@localization';
import {CountryCodePicker} from '@shared/components/CountryCodePicker';

export const PersonalInfoScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, profile, setProfile} = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [countryCode, setCountryCode] = useState(profile?.country_code || '+90');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Değişiklik kontrolü
    const changed =
      fullName !== (profile?.full_name || '') ||
      phone !== (profile?.phone || '') ||
      countryCode !== (profile?.country_code || '+90');
    setHasChanges(changed);
  }, [fullName, phone, countryCode, profile]);

  const handleSave = async () => {
    if (!user?.id) return;

    // Validasyon
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), t('profile.enterFullName'));
      return;
    }

    if (!phone.trim()) {
      Alert.alert(t('common.error'), t('profile.enterPhone'));
      return;
    }

    // Telefon numarası validasyonu (sadece rakamlar)
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert(t('common.error'), t('profile.invalidPhone'));
      return;
    }

    try {
      setIsLoading(true);

      await profileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        phone: cleanPhone,
        country_code: countryCode,
      });

      // Profili yeniden yükle
      const updatedProfile = await profileService.getProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      Alert.alert(t('common.done'), t('profile.profileUpdated'));
      navigation.goBack();
    } catch (error: any) {
      console.error('Profil güncellenemedi:', error);
      Alert.alert(t('common.error'), t('profile.profileUpdateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('profile.deleteAccountTitle'),
      t('profile.deleteAccountConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.deleteAccountYes'),
          style: 'destructive',
          onPress: () => {
            // İkinci onay
            Alert.alert(
              t('profile.deleteAccountFinalTitle'),
              t('profile.deleteAccountFinalConfirm'),
              [
                {
                  text: t('common.cancel'),
                  style: 'cancel',
                },
                {
                  text: t('profile.deleteAccountFinalYes'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeleting(true);
                      await profileService.deleteAccount();
                      // Hesap silindi, geri dön ve bildirim göster
                      navigation.goBack();
                      // Kısa bir gecikme ile alert göster (navigation tamamlansın diye)
                      setTimeout(() => {
                        Alert.alert(
                          t('profile.deleteAccountSuccess'),
                          t('profile.deleteAccountSuccessMessage'),
                          [{ text: t('common.ok') }]
                        );
                      }, 500);
                    } catch (error: any) {
                      console.error('Hesap silinemedi:', error);
                      setIsDeleting(false);
                      Alert.alert(
                        t('common.error'),
                        error.message || t('profile.deleteAccountError')
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
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
        <Text style={styles.title}>{t('profile.personalInfo')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Profile Picture Section - Sola Dayalı */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{uri: profile.avatar_url}}
                style={styles.avatar}
              />
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
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.fullName')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <User
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t('profile.fullNamePlaceholder')}
                placeholderTextColor={colors.text.secondary + '80'}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.email')}</Text>
            <View style={styles.readOnlyInput}>
              <Mail
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <Text style={styles.readOnlyText}>{user?.email}</Text>
            </View>
            <Text style={styles.hint}>E-posta adresi değiştirilemez</Text>
          </View>

          {/* Phone - Fonksiyonel Alan Kodu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.phone')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.phoneInputContainer}>
              <CountryCodePicker
                selectedCode={countryCode}
                onSelect={setCountryCode}
              />
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={setPhone}
                placeholder={t('profile.phonePlaceholder')}
                placeholderTextColor={colors.text.secondary + '80'}
                keyboardType="phone-pad"
                maxLength={15}
              />
            </View>
            <Text style={styles.hint}>{t('profile.phoneHint')}</Text>
          </View>

          {/* Required Fields Note */}
          <Text style={styles.requiredNote}>{t('profile.requiredFields')}</Text>

          {/* Delete Account Section */}
          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneText}>
              {t('profile.deleteAccountWarning')}
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
              activeOpacity={0.7}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Text style={styles.deleteButtonText}>
                  {t('profile.deleteAccount')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.footer}>
          <Button
            title={isLoading ? t('common.loading') : t('common.save')}
            onPress={handleSave}
            disabled={isLoading}
            fullWidth
            size="md"
            rounded
          />
        </View>
      )}
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
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 100,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
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
  email: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  formSection: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  readOnlyText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    flex: 1,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 50,
  },
  requiredNote: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
  dangerZone: {
    marginTop: spacing.xxl,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerZoneText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.md,
    textAlign: 'left',
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  deleteButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: '#ef4444',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});

