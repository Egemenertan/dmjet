/**
 * BannerCarousel Component
 * Otomatik scroll özellikli modern carousel
 */

import React, {useRef, useEffect, useState} from 'react';
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
  image_url: string;
  link?: string;
}

interface BannerCarouselProps {
  banners: Banner[];
  onBannerPress?: (banner: Banner) => void;
  autoScroll?: boolean;
}

export const BannerCarousel: React.FC<BannerCarouselProps> = ({
  banners,
  onBannerPress,
  autoScroll = true,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll fonksiyonu
  const scrollToNext = () => {
    if (!banners || banners.length === 0) return;

    const nextIndex = (currentIndex + 1) % banners.length;
    const offset = nextIndex * (CARD_WIDTH + spacing.md * 2);

    scrollViewRef.current?.scrollTo({
      x: offset,
      animated: true,
    });

    setCurrentIndex(nextIndex);
  };

  // Auto scroll timer
  useEffect(() => {
    if (!autoScroll || !banners || banners.length <= 1) return;

    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [currentIndex, autoScroll, banners]);

  // Scroll event handler
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / (CARD_WIDTH + spacing.md * 2));
    
    if (index !== currentIndex && index >= 0 && index < banners.length) {
      setCurrentIndex(index);
    }
  };

  // Manuel scroll başladığında timer'ı sıfırla
  const handleScrollBeginDrag = () => {
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
  };

  // Manuel scroll bittiğinde timer'ı yeniden başlat
  const handleScrollEndDrag = () => {
    if (!autoScroll || !banners || banners.length <= 1) return;

    autoScrollTimer.current = setInterval(scrollToNext, AUTO_SCROLL_INTERVAL);
  };

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
            onPress={() => onBannerPress?.(banner)}
          />
        ))}
      </ScrollView>

      {/* Pagination dots */}
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
    </View>
  );
};

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
    width: 0,
    height: 0,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
});

