/**
 * Security Screen
 * Kullanıcının şifresini değiştirdiği sayfa
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NavArrowLeft, Lock, Eye, EyeClosed} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {supabase} from '@core/services/supabase';
import {useTranslation} from '@localization';

export const SecurityScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    // Validasyon
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('profile.allFieldsRequired'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('profile.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('profile.passwordsDoNotMatch'));
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert(t('common.error'), t('profile.samePassword'));
      return;
    }

    try {
      setIsLoading(true);

      // Önce mevcut şifre ile yeniden giriş yap (doğrulama için)
      const {data: {user}} = await supabase.auth.getUser();
      if (!user?.email) {
        throw new Error(t('profile.userNotFound'));
      }

      const {error: signInError} = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error(t('profile.currentPasswordWrong'));
      }

      // Şimdi yeni şifreyi güncelle
      const {error: updateError} = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert(
        t('profile.passwordChangeSuccess'),
        t('profile.passwordChangeSuccessMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Şifre değiştirilemedi:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('profile.passwordChangeError')
      );
    } finally {
      setIsLoading(false);
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
        <Text style={styles.title}>{t('profile.security')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>{t('profile.changePassword')}</Text>
          <Text style={styles.infoText}>
            {t('profile.securityDescription')}
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.currentPassword')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Lock
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <TextInput
                style={styles.input}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder={t('profile.currentPasswordPlaceholder')}
                placeholderTextColor={colors.text.secondary + '80'}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}>
                {showCurrentPassword ? (
                  <Eye
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                ) : (
                  <EyeClosed
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.newPassword')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Lock
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder={t('profile.newPasswordPlaceholder')}
                placeholderTextColor={colors.text.secondary + '80'}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}>
                {showNewPassword ? (
                  <Eye
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                ) : (
                  <EyeClosed
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>{t('profile.passwordMinLength')}</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.confirmNewPassword')} <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Lock
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t('profile.confirmNewPasswordPlaceholder')}
                placeholderTextColor={colors.text.secondary + '80'}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}>
                {showConfirmPassword ? (
                  <Eye
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                ) : (
                  <EyeClosed
                    width={20}
                    height={20}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? t('common.loading') : t('profile.changePassword')}
            onPress={handleChangePassword}
            disabled={isLoading}
            fullWidth
            size="md"
            rounded
          />
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
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
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
  hint: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  buttonContainer: {
    marginTop: spacing.xl,
  },
});

