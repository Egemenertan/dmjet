import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing } from '../../core/constants/spacing';
import { useTranslation } from '../../localization';

interface WorkingHoursAlertProps {
  visible: boolean;
  message: string;
  workingHours: {
    start: string;
    end: string;
  } | null;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export const WorkingHoursAlert: React.FC<WorkingHoursAlertProps> = ({
  visible,
  message,
  workingHours,
  onClose,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name="time-outline" 
                size={32} 
                color={colors.warning} 
              />
            </View>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>
              {t('workingHours.alertTitle', 'Hizmet Saatleri')}
            </Text>
            
            <Text style={styles.message}>
              {message}
            </Text>

            {workingHours && (
              <View style={styles.hoursContainer}>
                <Text style={styles.hoursLabel}>
                  {t('workingHours.currentHours', 'Çalışma Saatlerimiz:')}
                </Text>
                <Text style={styles.hoursText}>
                  {`${workingHours.start.slice(0, 5)} - ${workingHours.end.slice(0, 5)}`}
                </Text>
              </View>
            )}

            <Text style={styles.noteText}>
              {t('workingHours.noteMessage', 
                'Bu saatler dışında verilen siparişler bir sonraki çalışma günü işleme alınacaktır.'
              )}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              style={styles.okButton}
              onPress={onClose}
            >
              <Text style={styles.okButtonText}>
                {t('common.understood', 'Anladım')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: 24,
    width: width - (spacing.lg * 2),
    maxWidth: 400,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  hoursContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  hoursLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  hoursText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  noteText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  okButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  okButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
});
