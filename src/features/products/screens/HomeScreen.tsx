/**
 * Home Screen
 * Main screen showing products and categories
 * Optimized for fast loading with parallel queries and memoization
 */

import React, {useMemo, useCallback} from 'react';
import {View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useQueries} from '@tanstack/react-query';
import {BlurView} from 'expo-blur';
import {User} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {productsService} from '../services/productsService';
import {ProductCard, CategoriesSection} from '../components';
import {BannerCarousel, QueryErrorBoundary, LogoLoader, WorkingHoursBanner} from '@shared/components';
import {useCartStore} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';
import {useWorkingHours} from '@core/hooks';

export const HomeScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {addItem} = useCartStore();
  const {language} = useAppStore();
  const {isAuthenticated, user} = useAuthStore();
  const {setActiveTab} = useTabNavigation();
  const {isOutsideWorkingHours, workingHours, getOutsideWorkingHoursMessage} = useWorkingHours();

  // Paralel veri yükleme - ürünler ve kategoriler aynı anda
  const [productsQuery, categoriesQuery] = useQueries({
    queries: [
      {
        queryKey: ['products', language],
        queryFn: () => productsService.getProducts(language, 20),
        retry: 2,
        retryDelay: 1000,
        staleTime: 2 * 60 * 1000, // 2 dakika
        gcTime: 5 * 60 * 1000, // 5 dakika (eski cacheTime)
      },
      {
        queryKey: ['categories', language],
        queryFn: () => productsService.getCategories(language),
        retry: 2,
        retryDelay: 1000,
        staleTime: 10 * 60 * 1000, // 10 dakika - kategoriler daha az değişir
        gcTime: 30 * 60 * 1000, // 30 dakika
      },
    ],
  });

  const {data: products, isLoading: productsLoading, error: productsError, refetch: refetchProducts} = productsQuery;
  const {data: categories, isLoading: categoriesLoading} = categoriesQuery;

  const isLoading = productsLoading;
  const error = productsError;

  // TÜM HOOK'LAR KOŞULSUZ OLARAK EN ÜSTTE TANIMLANMALI
  // Memoized handlers - gereksiz re-render'ları önler
  const handleAddToCart = useCallback((product: any) => {
    const translation = product.product_translations?.[0];
    addItem({
      id: product.id,
      name: translation?.name || product.name,
      price: product.price,
      image_url: product.image_url,
      discount: product.discount,
      barcode: product.barcode || null,
      category_id: product.category_id || null,
    });
  }, [addItem]);

  const handleCategoryPress = useCallback((categoryId: string, categoryName: string) => {
    // Kategori detay sayfasına yönlendir
    // @ts-ignore - Navigation type issue
    navigation.navigate('CategoryProducts', {
      categoryId,
      categoryName,
    });
  }, [navigation]);

  const handleBannerPress = useCallback((banner: any) => {
    // Banner click handling - can be extended with deep linking
    // Currently disabled - no action on banner press
    // You can add navigation or other actions here in the future
  }, []);

  // Banner verisi - memoized, her render'da yeniden oluşturulmaz
  const demoBanners = useMemo(() => [
    {
      id: '1',
      image_source: require('../../../../assets/banner.png'),
    },
  ], []);

  // Render item memoized - FlatList performansı için
  const renderProduct = useCallback(({item}: {item: any}) => {
    const translation = item.product_translations?.[0];
    return (
      <ProductCard
        id={item.id}
        name={translation?.name || item.name}
        price={item.price}
        image_url={item.image_url || ''}
        discount={item.discount}
        onPress={() => {
          // @ts-ignore - Navigation type issue
          navigation.navigate('ProductDetail', {productId: item.id});
        }}
        onAddToCart={() => handleAddToCart(item)}
      />
    );
  }, [navigation, handleAddToCart]);

  // Key extractor memoized
  const keyExtractor = useCallback((item: any) => item.id, []);

  // KOŞULLU RENDER'LAR HOOK'LARDAN SONRA
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LogoLoader />
      </SafeAreaView>
    );
  }

  // Show error state with retry option
  if (error && !products) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Ürünler yüklenemedi</Text>
          <Text style={styles.errorText}>
            Bağlantı sorunu yaşanıyor. Lütfen internet bağlantınızı kontrol edin.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => refetchProducts()}
          >
            <Text style={styles.retryButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Image 
              source={require('../../../../assets/dmjet.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            
            {/* Profil Butonu */}
            <TouchableOpacity
              style={styles.profileButtonWrapper}
              onPress={() => {
                if (isAuthenticated) {
                  // MainTabs içindeki Profile tab'ına direkt geç
                  setActiveTab('Profile');
                } else {
                  // @ts-ignore - Navigation type issue
                  navigation.navigate('Auth', {
                    screen: 'Login',
                    params: { returnTo: 'MainTabs' }
                  });
                }
              }}
              activeOpacity={0.8}>
              <BlurView
                intensity={80}
                tint="light"
                style={styles.profileButton}>
                {isAuthenticated ? (
                  <Text style={styles.profileButtonText}>
                    {user?.email?.substring(0, 2).toUpperCase()}
                  </Text>
                ) : (
                  <User
                    width={22}
                    height={22}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                )}
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Çalışma Saatleri Uyarısı */}
        <WorkingHoursBanner
          visible={isOutsideWorkingHours}
          message={getOutsideWorkingHoursMessage()}
          workingHours={workingHours}
          showDismissButton={false}
        />

        {/* Kategoriler Section - Yatay Scroll */}
        {!categoriesLoading && categories && categories.length > 0 && (
          <CategoriesSection 
            categories={categories}
            onCategoryPress={handleCategoryPress} 
          />
        )}

        {/* Banner - Tek banner gösterimi */}
        <BannerCarousel 
          banners={demoBanners} 
          onBannerPress={handleBannerPress}
          autoScroll={false}
        />

        {/* Featured Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.featuredProducts')}</Text>
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={keyExtractor}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsGrid}
            // Gelişmiş performans optimizasyonları
            removeClippedSubviews={true}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={100}
            windowSize={5}
            initialNumToRender={4}
            getItemLayout={(data, index) => ({
              length: 280, // Yaklaşık kart yüksekliği
              offset: 280 * Math.floor(index / 2),
              index,
            })}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Bottom bar için alan
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  errorText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 50,
  },
  profileButtonWrapper: {
    width: 50,
    height: 50,
  },
  profileButton: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  profileButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  productsGrid: {
    paddingHorizontal: spacing.md,
  },
});

