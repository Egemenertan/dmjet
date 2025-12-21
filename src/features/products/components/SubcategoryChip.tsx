/**
 * SubcategoryChip Component
 * Alt kategori chip butonu
 */

import React from 'react';
import {Text, StyleSheet, TouchableOpacity} from 'react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';

interface SubcategoryChipProps {
  id: string;
  name: string;
  isActive?: boolean;
  onPress: () => void;
}

export const SubcategoryChip: React.FC<SubcategoryChipProps> = ({
  name,
  isActive = false,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.chip, isActive && styles.activeChip]}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={[styles.text, isActive && styles.activeText]}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  activeChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  activeText: {
    color: colors.text.inverse,
    fontWeight: fontWeight.bold,
  },
});




