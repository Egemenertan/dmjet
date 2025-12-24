/**
 * BannerCard Component
 * Modern banner kartı - carousel için
 * Optimized with React.memo
 */

import React, {memo} from 'react';
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

export const BannerCard: React.FC<BannerCardProps> = memo(({
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
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.id === nextProps.id &&
    prevProps.image_url === nextProps.image_url &&
    prevProps.image_source === nextProps.image_source
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: spacing.md,
   
    overflow: 'hidden',
    
   
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
 
});










