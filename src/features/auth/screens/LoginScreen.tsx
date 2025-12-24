/**
 * Login Screen
 * User authentication screen
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert, TouchableOpacity, Image} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NavArrowLeft} from 'iconoir-react-native';
import {Button, Input} from '@shared/ui';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {authService} from '../services/authService';
import {useTranslation} from '@localization';
import {GoogleIcon} from '../components/GoogleIcon';
import {AuthStackParamList} from '@core/navigation/types';

type LoginScreenRouteProp = RouteProp<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<LoginScreenRouteProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Login öncesi hangi sayfadan gelindiyse oraya dönmek için
  const returnTo = route.params?.returnTo;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.emailRequired'));
      return;
    }

    try {
      setLoading(true);
      await authService.login({email, password});
      
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
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      
      const result = await authService.loginWithGoogle();
      
      if (result) {
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
      }
    } catch (error: any) {
      console.error('❌ Google login error in LoginScreen:', error);
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

      <View style={styles.content}>
        <Image
          source={require('../../../../assets/dmjet.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>{t('auth.login')}</Text>
        
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
          secureTextEntry
          placeholder="••••••••"
        />

        <Button
          title={t('auth.login')}
          onPress={handleLogin}
          loading={loading}
          fullWidth
          style={styles.loginButton}
        />

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>{t('auth.orContinueWith')}</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <GoogleIcon size={20} />
          <Text style={styles.googleButtonText}>
            {googleLoading ? t('common.loading') : t('auth.loginWithGoogle')}
          </Text>
        </TouchableOpacity>

        <Button
          title={t('auth.dontHaveAccount')}
          onPress={() => navigation.navigate('Register' as never, returnTo ? {returnTo} : undefined)}
          variant="ghost"
          fullWidth
          style={styles.registerButton}
        />
      </View>
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
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    borderRadius: 50,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    marginBottom: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  googleButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  registerButton: {
    marginTop: spacing.sm,
  },
});

