/**
 * Forgot Password Screen
 * Password reset request screen
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

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('common.error'), t('auth.invalidEmail'));
      return;
    }

    try {
      setLoading(true);
      await authService.resetPassword(email);
      setEmailSent(true);
      Alert.alert(
        t('auth.resetPasswordEmailSent'),
        t('auth.resetPasswordEmailSentMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('ResetPassword'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.resetPasswordError'));
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
              <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
              
              {!emailSent ? (
                <>
                  <Text style={styles.description}>
                    {t('auth.resetPasswordDescription')}
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

                  <Button
                    title={t('auth.sendResetLink')}
                    onPress={handleResetPassword}
                    loading={loading}
                    fullWidth
                    style={styles.resetButton}
                  />

                  <Button
                    title={t('auth.backToLogin')}
                    onPress={() => navigation.goBack()}
                    variant="ghost"
                    fullWidth
                    style={styles.backToLoginButton}
                  />
                </>
              ) : (
                <View style={styles.successContainer}>
                  <Text style={styles.successIcon}>✉️</Text>
                  <Text style={styles.successTitle}>{t('auth.emailSent')}</Text>
                  <Text style={styles.successMessage}>
                    {t('auth.checkYourEmail')}
                  </Text>
                  <Button
                    title={t('auth.backToLogin')}
                    onPress={() => navigation.goBack()}
                    fullWidth
                    style={styles.resetButton}
                  />
                </View>
              )}
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
  successContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
});

