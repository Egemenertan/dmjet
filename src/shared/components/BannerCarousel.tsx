/**
 * BannerCarousel Component
 * Otomatik scroll özellikli modern carousel
 * Optimized: Gereksiz re-render'lar önlendi, memo eklendi
 */

import React, {useRef, useEffect, useState, memo, useCallback} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import {BannerCard} from './BannerCard';
import {colors, spacing} from '@core/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.md * 2;
const AUTO_SCROLL_INTERVAL = 4000; // 4 saniye

interface Banner {
  id: string;
  image_url?: string;
  image_source?: any; // Local asset için
  link?: string;
  showActionButton?: boolean;
  actionButtonText?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
  onActionPress?: (banner: Banner) => void; // Action button için callback
  autoScroll?: boolean;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = memo(({
  banners,
  onBannerPress,
  onActionPress,
  autoScroll = true,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll fonksiyonu - useCallback ile memoize
  const scrollToNext = useCallback(() => {
    if (!banners || banners.length === 0) return;

    const nextIndex = (currentIndex + 1) % banners.length;
    const offset = nextIndex * (CARD_WIDTH + spacing.md * 2);

    scrollViewRef.current?.scrollTo({
      x: offset,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  }, [banners, currentIndex]);

  // Auto scroll timer - sadece gerektiğinde çalışır
  useEffect(() => {
    // Tek banner varsa veya autoScroll kapalıysa timer başlatma
    if (!autoScroll || !banners || banners.length <= 1) return;

    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [currentIndex, autoScroll, banners, scrollToNext]);

  // Scroll event handler - memoized
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + spacing.md * 2));
    
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  }, [currentIndex, banners]);

  // Manuel scroll başladığında timer'ı sıfırla - memoized
  const handleScrollBeginDrag = useCallback(() => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
  }, []);

  // Manuel scroll bittiğinde timer'ı yeniden başlat - memoized
  const handleScrollEndDrag = useCallback(() => {
    if (!autoScroll || !banners || banners.length <= 1) return;

    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);
  }, [autoScroll, banners, scrollToNext]);

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + spacing.md * 2}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        scrollEventThrottle={16}>
        {banners.map((banner) => (
          <BannerCard
            key={banner.id}
            id={banner.id}
            image_url={banner.image_url}
            image_source={banner.image_source}
            onPress={() => onBannerPress?.(banner)}
            showActionButton={banner.showActionButton}
            actionButtonText={banner.actionButtonText}
            onActionPress={() => onActionPress?.(banner)}
          />
        ))}
      </ScrollView>

      {/* Pagination dots - sadece birden fazla banner varsa göster */}
      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison - sadece banners değiştiğinde re-render
  return (
    prevProps.banners.length === nextProps.banners.length &&
    prevProps.autoScroll === nextProps.autoScroll
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  scrollContent: {
    paddingRight: spacing.md,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 24,
    height: 8,
    backgroundColor: colors.primary,
  },
});

