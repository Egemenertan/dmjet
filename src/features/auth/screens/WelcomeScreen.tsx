/**
 * Welcome Screen
 * Initial onboarding screen
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Button} from '@shared/ui';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {useTranslation} from '@localization';

export const WelcomeScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>DmarJet</Text>
          <Text style={styles.subtitle}>{t('common.welcome')}</Text>
        </View>

        <View style={styles.footer}>
          <Button
            title={t('auth.login')}
            onPress={() => navigation.navigate('Login' as never)}
            fullWidth
            style={styles.button}
          />
          <Button
            title={t('auth.register')}
            onPress={() => navigation.navigate('Register' as never)}
            variant="outline"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.md,
  },
  subtitle: {
    fontSize: fontSize.xl,
    color: colors.text.secondary,
  },
  footer: {
    gap: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
});

