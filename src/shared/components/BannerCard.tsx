/**
 * BannerCard Component
 * Modern banner kartı - carousel için
 */

import React from 'react';
import {View, Image, StyleSheet, TouchableOpacity, Dimensions} from 'react-native';
import {colors, borderRadius, spacing} from '@core/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CARD_HEIGHT = 180;

interface BannerCardProps {
  id: string;
  image_url?: string;
  image_source?: any; // Local asset için
  onPress?: () => void;
}

export const BannerCard: React.FC<BannerCardProps> = ({
  image_url,
  image_source,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={image_source || {uri: image_url}}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Gradient overlay for better text visibility if needed */}
        <View style={styles.overlay} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 6,
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
});










