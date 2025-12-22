/**
 * Home Screen
 * Main screen showing products and categories
 */

import React from 'react';
import {View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {BlurView} from 'expo-blur';
import {User} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {productsService} from '../services/productsService';
import {ProductCard, CategoriesSection} from '../components';
import {BannerCarousel, QueryErrorBoundary} from '@shared/components';
import {useCartStore} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';

export const HomeScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {addItem} = useCartStore();
  const {language} = useAppStore();
  const {isAuthenticated, user} = useAuthStore();
  const {setActiveTab} = useTabNavigation();

  const {data: products, isLoading, error, refetch} = useQuery({
    queryKey: ['products', language],
    queryFn: () => productsService.getProducts(language),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error: any) => {
      console.error('❌ Products query error:', error);
    },
    onSuccess: (data) => {
      console.log(`✅ Products query success: ${data?.length || 0} products loaded`);
    },
  });

  const handleAddToCart = (product: any) => {
    const translation = product.product_translations?.[0];
    addItem({
      id: product.id,
      name: translation?.name || product.name,
      price: product.price,
      image_url: product.image_url,
      discount: product.discount,
      barcode: product.barcode || null,
    });
  };

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    // Kategori detay sayfasına yönlendir
    // @ts-ignore - Navigation type issue
    navigation.navigate('CategoryProducts', {
      categoryId,
      categoryName,
    });
  };

  const handleBannerPress = (banner: any) => {
    // Banner click handling - can be extended with deep linking
    // Currently disabled - no action on banner press
    // You can add navigation or other actions here in the future
  };

  // Demo banner verileri - gerçek uygulamada Supabase'den çekilecek
  const demoBanners = [
    {
      id: '1',
      image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    },
    {
      id: '2',
      image_url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=800&q=80',
    },
    {
      id: '3',
      image_url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&q=80',
    },
    {
      id: '4',
      image_url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    },
    {
      id: '5',
      image_url: 'https://images.unsplash.com/photo-1601599561213-832382fd07ba?w=800&q=80',
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
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
            onPress={() => refetch()}
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

        {/* Kategoriler Section - Yatay Scroll */}
        <CategoriesSection onCategoryPress={handleCategoryPress} />

        {/* Banner Carousel - Otomatik Scroll */}
        <BannerCarousel 
          banners={demoBanners} 
          onBannerPress={handleBannerPress}
          autoScroll={true}
        />

        {/* Featured Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.featuredProducts')}</Text>
          <FlatList
            data={products}
            renderItem={({item}) => {
              const translation = item.product_translations?.[0];
              return (
                <ProductCard
                  id={item.id}
                  name={translation?.name || item.name}
                  price={item.price}
                  image_url={item.image_url}
                  discount={item.discount}
                  onPress={() => {
                    // @ts-ignore - Navigation type issue
                    navigation.navigate('ProductDetail', {productId: item.id});
                  }}
                  onAddToCart={() => handleAddToCart(item)}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsGrid}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={6}
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

