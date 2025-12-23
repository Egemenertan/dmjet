/**
 * Role Guard Component
 * Güvenli role-based access control için wrapper component
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Package} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';

interface RoleGuardProps {
  allowedRoles: Array<'user' | 'admin' | 'courier' | 'picker'>;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallbackMessage,
}) => {
  const {profile} = useAuthStore();
  const {t} = useTranslation();

  // Güvenlik kontrolü
  const hasAccess = React.useMemo(() => {
    if (!profile) {
      // Debug log silindi - production'da gereksiz
      return false;
    }

    const hasRole = allowedRoles.includes(profile.role);
    
    // Debug log silindi - production'da gereksiz

    return hasRole;
  }, [profile, allowedRoles]);

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Package width={80} height={80} color={colors.error} strokeWidth={2} />
          <Text style={styles.unauthorizedTitle}>
            {t('admin.unauthorized') || 'Yetkisiz Erişim'}
          </Text>
          <Text style={styles.unauthorizedText}>
            {fallbackMessage || 
             t('admin.unauthorizedMessage') || 
             'Bu sayfaya erişim yetkiniz bulunmamaktadır.'}
          </Text>
          <Text style={styles.roleInfo}>
            Gerekli roller: {allowedRoles.join(', ')}
          </Text>
          <Text style={styles.currentRole}>
            Mevcut rolünüz: {profile?.role || 'Bilinmiyor'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  unauthorizedTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  unauthorizedText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  roleInfo: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  currentRole: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


