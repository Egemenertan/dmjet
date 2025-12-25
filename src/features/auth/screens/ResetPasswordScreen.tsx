/**
 * Reset Password Screen
 * Enter OTP code and new password
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {NavArrowLeft} from 'iconoir-react-native';
import {Button, Input} from '@shared/ui';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {authService} from '../services/authService';
import {useTranslation} from '@localization';
import {AuthStackParamList} from '@core/navigation/types';

type ResetPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ResetPassword'>;

export const ResetPasswordScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    // Validation
    if (!email || !code || !newPassword || !confirmPassword) {
      Alert.alert(t('common.error'), t('auth.allFieldsRequired'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return;
    }

    // Code validation (6 digits)
    if (code.length !== 6 || !/^\d+$/.test(code)) {
      Alert.alert(t('common.error'), t('auth.invalidCode'));
      return;
    }

    // Password validation
    if (newPassword.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'));
      return;
    }

    // Password match validation
    if (newPassword !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDoNotMatch'));
      return;
    }

    try {
      setLoading(true);
      
      // Verify OTP and update password
      await authService.verifyOtpAndUpdatePassword(email, code, newPassword);
      
      Alert.alert(
        t('auth.passwordResetSuccess'),
        t('auth.passwordResetSuccessMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Reset password error:', error);
      Alert.alert(t('common.error'), error.message || t('auth.passwordResetError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              <Image
                source={require('../../../../assets/dmjet.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t('auth.resetPassword')}</Text>
              
              <Text style={styles.description}>
                {t('auth.resetPasswordCodeDescription')}
              </Text>

              <Input
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="ornek@email.com"
                editable={!loading}
              />

              <Input
                label={t('auth.verificationCode')}
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                placeholder="123456"
                maxLength={6}
                editable={!loading}
              />

              <Input
                label={t('auth.newPassword')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="••••••••"
                editable={!loading}
              />

              <Input
                label={t('auth.confirmNewPassword')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="••••••••"
                editable={!loading}
              />

              <Button
                title={t('auth.resetPassword')}
                onPress={handleResetPassword}
                loading={loading}
                fullWidth
                style={styles.resetButton}
              />

              <Button
                title={t('auth.backToLogin')}
                onPress={() => navigation.navigate('Login')}
                variant="ghost"
                fullWidth
                style={styles.backToLoginButton}
              />
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backButton: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    zIndex: 10,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  resetButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 50,
  },
  backToLoginButton: {
    marginTop: spacing.sm,
  },
});




