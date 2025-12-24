/**
 * Age Verification Modal
 * 18+ yaş kontrolü için modal
 * Apple Review için gerekli
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { useTranslation } from '@localization';

interface AgeVerificationModalProps {
  visible: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}

export const AgeVerificationModal: React.FC<AgeVerificationModalProps> = ({
  visible,
  onConfirm,
  onDecline,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={20} style={styles.overlay}>
        <View style={styles.container}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/dmjet.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {t('ageVerification.title', 'Yaş Doğrulaması')}
          </Text>

          {/* Description */}
          <Text style={styles.description}>
            {t(
              'ageVerification.description',
              'Uygulamamızda alkol ve tütün ürünleri satışı yapılmaktadır. Devam etmek için 18 yaşından büyük olmalısınız.'
            )}
          </Text>

          {/* Question */}
          <Text style={styles.question}>
            {t('ageVerification.question', '18 yaşından büyük müsünüz?')}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
              activeOpacity={0.8}
            >
              <Text style={styles.declineButtonText}>
                {t('ageVerification.no', 'Hayır')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmButtonText}>
                {t('ageVerification.yes', 'Evet')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Legal Notice */}
          <Text style={styles.legalNotice}>
            {t(
              'ageVerification.legal',
              'Bu uygulamayı kullanarak 18 yaşından büyük olduğunuzu beyan etmiş olursunuz.'
            )}
          </Text>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    marginBottom: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: '#111827',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.sm,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  question: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: '#111827',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: colors.primary,
  },
  confirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  declineButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#6B7280',
  },
  legalNotice: {
    fontSize: fontSize.xs,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});

