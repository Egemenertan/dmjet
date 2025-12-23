import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../core/constants/colors';
import { typography } from '../../core/constants/typography';
import { spacing } from '../../core/constants/spacing';
import { useTranslation } from '../../localization';

interface WorkingHoursBannerProps {
  visible: boolean;
  message: string;
  workingHours: {
    start: string;
    end: string;
  } | null;
  onDismiss?: () => void;
  showDismissButton?: boolean;
}

export const WorkingHoursBanner: React.FC<WorkingHoursBannerProps> = ({
  visible,
  message,
  workingHours,
  onDismiss,
  showDismissButton = true,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons 
              name="time-outline" 
              size={20} 
              color={colors.warning} 
            />
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {t('workingHours.serviceOutside', 'Hizmet Dışı')}
            </Text>
            {message && (
              <Text style={styles.message}>
                {message}
              </Text>
            )}
            {workingHours && workingHours.start && workingHours.end && (
              <Text style={styles.hoursText}>
                {`${workingHours.start.slice(0, 5)} - ${workingHours.end.slice(0, 5)}`}
              </Text>
            )}
          </View>
        </View>

        {showDismissButton && onDismiss && (
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={onDismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons 
              name="close" 
              size={18} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.warningLight,
    borderRadius: 24,


  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.warning,
    marginBottom: 2,
  },
  message: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },
  hoursText: {
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  dismissButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
