import React from 'react';
import { Image as ExpoImage, ImageProps as ExpoImageProps } from 'expo-image';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors } from '@/core/constants';

interface OptimizedImageProps extends Omit<ExpoImageProps, 'placeholder'> {
  showLoader?: boolean;
}

/**
 * Optimized Image Component
 * 
 * Features:
 * - Automatic caching
 * - Memory optimization
 * - Blurhash placeholder support
 * - Loading state
 * - Error handling
 * 
 * @example
 * <OptimizedImage
 *   source={{ uri: product.image_url }}
 *   style={styles.image}
 *   contentFit="cover"
 * />
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  showLoader = true,
  style,
  contentFit = 'cover',
  transition = 200,
  ...props
}) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  // Default placeholder blurhash (neutral gray)
  const placeholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

  return (
    <View style={[styles.container, style]}>
      <ExpoImage
        {...props}
        style={[StyleSheet.absoluteFillObject, style]}
        contentFit={contentFit}
        transition={transition}
        placeholder={placeholder}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        // Caching strategy
        cachePolicy="memory-disk"
        // Priority for product images
        priority="normal"
      />
      
      {showLoader && isLoading && !hasError && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
      
      {hasError && (
        <View style={styles.errorContainer}>
          <ExpoImage
            source={require('../../../assets/icon.png')}
            style={styles.errorIcon}
            contentFit="contain"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
  },
  errorIcon: {
    width: 40,
    height: 40,
    opacity: 0.3,
  },
});

