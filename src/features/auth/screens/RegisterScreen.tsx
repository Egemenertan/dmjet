/**
 * Register Screen
 * User registration screen
 */

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {NavArrowLeft, Eye, EyeClosed} from 'iconoir-react-native';
import {Button, Input} from '@shared/ui';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {authService} from '../services/authService';
import {useTranslation} from '@localization';
import {GoogleIcon} from '../components/GoogleIcon';
import {AuthStackParamList} from '@core/navigation/types';

type RegisterScreenRouteProp = RouteProp<AuthStackParamList, 'Register'>;
type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const route = useRoute<RegisterScreenRouteProp>();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Register öncesi hangi sayfadan gelindiyse oraya dönmek için
  const returnTo = route.params?.returnTo;

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      await authService.register({email, password, fullName});
      
      // Tüm Auth modal stack'ini kapat (Welcome, Login, Register)
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.goBack();
      }
      
      // Eğer Checkout'tan geldiyse MapSelection'a yönlendir
      if (returnTo === 'Checkout') {
        setTimeout(() => {
          // @ts-ignore - Navigation type issue with nested navigators
          navigation.navigate('Main', {
            screen: 'MapSelection'
          });
          Alert.alert(t('common.done'), t('auth.registerSuccess'));
        }, 400);
      } else if (returnTo) {
        // Diğer returnTo durumları için o sayfaya yönlendir
        setTimeout(() => {
          // @ts-ignore - Navigation type issue with nested navigators
          navigation.navigate('Main', {
            screen: returnTo
          });
          Alert.alert(t('common.done'), t('auth.registerSuccess'));
        }, 400);
      } else {
        // returnTo yoksa sadece başarı mesajı göster
        setTimeout(() => {
          Alert.alert(t('common.done'), t('auth.registerSuccess'));
        }, 400);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setGoogleLoading(true);
      await authService.loginWithGoogle();
      
      // Tüm Auth modal stack'ini kapat (Welcome, Login, Register)
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.goBack();
      }
      
      // Eğer Checkout'tan geldiyse MapSelection'a yönlendir
      if (returnTo === 'Checkout') {
        setTimeout(() => {
          // @ts-ignore - Navigation type issue with nested navigators
          navigation.navigate('Main', {
            screen: 'MapSelection'
          });
          Alert.alert(t('common.done'), t('auth.loginSuccess'));
        }, 400);
      } else if (returnTo) {
        // Diğer returnTo durumları için o sayfaya yönlendir
        setTimeout(() => {
          // @ts-ignore - Navigation type issue with nested navigators
          navigation.navigate('Main', {
            screen: returnTo
          });
          Alert.alert(t('common.done'), t('auth.loginSuccess'));
        }, 400);
      } else {
        // returnTo yoksa sadece başarı mesajı göster
        setTimeout(() => {
          Alert.alert(t('common.done'), t('auth.loginSuccess'));
        }, 400);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.loginError'));
    } finally {
      setGoogleLoading(false);
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View>
        <Image
          source={require('../../../../assets/dmjet.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t('auth.register')}</Text>
        
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleRegister}
          disabled={googleLoading}
        >
          <GoogleIcon size={20} />
          <Text style={styles.googleButtonText}>
            {googleLoading ? t('common.loading') : t('auth.loginWithGoogle')}
          </Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.divider} />
        </View>
        
        <Input
          label={t('profile.personalInfo')}
          value={fullName}
          onChangeText={setFullName}
          placeholder={t('auth.fullNamePlaceholder')}
        />

        <Input
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="ornek@email.com"
        />

        <Input
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="••••••••"
          rightIcon={
            showPassword ? (
              <Eye width={20} height={20} color={colors.text.secondary} strokeWidth={2} />
            ) : (
              <EyeClosed width={20} height={20} color={colors.text.secondary} strokeWidth={2} />
            )
          }
          onRightIconPress={() => setShowPassword(!showPassword)}
        />

        <Button
          title={t('auth.register')}
          onPress={handleRegister}
          loading={loading}
          fullWidth
          style={styles.registerButton}
        />

        <Button
          title={t('auth.alreadyHaveAccount')}
          onPress={() => navigation.navigate('Login', returnTo ? {returnTo} : undefined)}
          variant="ghost"
          fullWidth
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    justifyContent: 'flex-start',
    paddingBottom: spacing.lg,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  registerButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 50,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 50,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
});

