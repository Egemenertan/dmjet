/**
 * BannerCard Component
 * Modern banner kartı - carousel için
 * Optimized with React.memo
 */

import React, {memo} from 'react';
import {View, Image, StyleSheet, TouchableOpacity, Dimensions, Text} from 'react-native';
import {ArrowRight} from 'iconoir-react-native';
import {colors, borderRadius, spacing, fontSize, fontWeight} from '@core/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const CARD_HEIGHT = 180;

interface BannerCardProps {
  id: string;
  image_url?: string;
  image_source?: any; // Local asset için
  onPress?: () => void;
  showActionButton?: boolean; // Aksiyon butonu göster/gizle
  onActionPress?: () => void; // Aksiyon butonu tıklama
  actionButtonText?: string; // Buton metni (opsiyonel)
}

export const BannerCard: React.FC<BannerCardProps> = memo(({
  image_url,
  image_source,
  onPress,
  showActionButton = false,
  onActionPress,
  actionButtonText,
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
        
        {/* Zarif Aksiyon Butonu - Sağ Üst Köşe */}
        {showActionButton && onActionPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation(); // Banner'ın onPress'ini tetikleme
              onActionPress();
            }}
            activeOpacity={0.8}>
            {actionButtonText ? (
              <Text style={styles.actionButtonText}>{actionButtonText}</Text>
            ) : (
              <ArrowRight
                width={20}
                height={20}
                color={colors.white}
                strokeWidth={2.5}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.id === nextProps.id &&
    prevProps.image_url === nextProps.image_url &&
    prevProps.image_source === nextProps.image_source &&
    prevProps.showActionButton === nextProps.showActionButton
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.xl,
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Zarif gölge efekti
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    // Hafif border için
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
  },
});










