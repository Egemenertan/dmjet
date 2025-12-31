/**
 * CategoryProductsScreen
 * Kategori ve alt kategoriye göre ürünleri listeler
 */

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {useInfiniteQuery} from '@tanstack/react-query';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {productsService} from '../services/productsService';
import {ProductCard} from '../components';
import {ModernBottomBar, LogoLoader, CategoryFilterBar} from '@shared/components';
import {useCartStore} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {useTranslation} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';

type RouteParams = {
  CategoryProducts: {
    categoryId: string;
    categoryName: string;
  };
};

export const CategoryProductsScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'CategoryProducts'>>();
  const initialCategoryId = route.params.categoryId;
  const initialCategoryName = route.params.categoryName;

  const {addItem, items} = useCartStore();
  const {language} = useAppStore();
  const {activeTab, setActiveTab} = useTabNavigation();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // State'leri local olarak yönet - navigation replace kullanma
  const [currentCategoryId, setCurrentCategoryId] = useState<string>(initialCategoryId);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>(initialCategoryName);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  // Ürünleri çek (kategori ve seçili alt kategoriye göre) - Infinity Scroll
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['category-products', currentCategoryId, selectedSubcategoryId, language],
    queryFn: ({pageParam = 0}) =>
      productsService.getProductsByCategoryAndSubcategory(
        currentCategoryId,
        selectedSubcategoryId,
        language,
        pageParam,
        20, // Page size
      ),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
  });

  // Tüm sayfaları birleştir
  const products = productsData?.pages.flatMap((page) => page.data) || [];
  
  // Toplam ürün sayısını al (ilk sayfadan)
  const totalCount = productsData?.pages[0]?.count || 0;

  const handleAddToCart = (product: any) => {
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
  };

  const handleCategoryChange = (categoryId: string | null, categoryName: string) => {
    // "Tümü" seçilirse ana sayfaya dön
    if (categoryId === null) {
      navigation.goBack();
      return;
    }
    
    // Navigation replace yerine state güncelle - scroll pozisyonları korunur
    setCurrentCategoryId(categoryId);
    setCurrentCategoryName(categoryName);
    setSelectedSubcategoryId(null); // Yeni kategoriye geçerken alt kategori seçimini sıfırla
  };

  const handleSubcategoryChange = (subcategoryId: string | null, subcategoryName: string) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render footer (loading indicator)
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.footerText}>Daha fazla ürün yükleniyor...</Text>
      </View>
    );
  };

  // Bottom bar tab change handler - MainTabs'a geri dön ve tab'ı değiştir
  const handleTabChange = (tab: string) => {
    // Tab'ı değiştir ve MainTabs'a geri dön (mevcut instance'a)
    setActiveTab(tab);
    // @ts-ignore - goBack ile mevcut MainTabs'a dönüyoruz, yeni instance oluşturmuyor
    navigation.goBack();
  };

  // Bottom bar search handler
  const handleBottomBarSearch = (query: string) => {
    // @ts-ignore
    navigation.navigate('SearchResults', {query});
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Category Filter Bar with Back Button */}
        <CategoryFilterBar
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={handleSubcategoryChange}
          selectedCategoryId={currentCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
          showBackButton={true}
          onBackPress={() => navigation.goBack()}
        />

      {/* Ürünler Listesi - Sadece Bu Alan Yenilenir */}
      <View style={styles.productsContainer}>
        {productsLoading ? (
          <LogoLoader showText={false} />
        ) : products && products.length > 0 ? (
          <FlatList
            data={products}
            renderItem={({item}) => {
              // @ts-ignore - product_translations service katmanında ekleniyor
              const translation = item.product_translations?.[0];
              return (
                <ProductCard
                  id={item.id}
                  name={translation?.name || item.name}
                  price={item.price}
                  image_url={item.image_url || undefined}
                  discount={item.discount}
                  onPress={() => {
                    // @ts-ignore
                    navigation.navigate('ProductDetail', {productId: item.id});
                  }}
                  onAddToCart={() => handleAddToCart(item)}
                />
              );
            }}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={() => (
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryTitle}>{currentCategoryName}</Text>
                <Text style={styles.productCount}>
                  {totalCount} ürün
                </Text>
              </View>
            )}
            ListFooterComponent={renderFooter}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={50}
            windowSize={10}
            initialNumToRender={6}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Bu kategoride ürün bulunamadı
            </Text>
          </View>
        )}
      </View>
      </SafeAreaView>

      {/* Modern Bottom Bar */}
      <ModernBottomBar
        activeTab="" // Kategori sayfasında hiçbir tab active olmamalı
        onTabChange={handleTabChange}
        onSearch={handleBottomBarSearch}
        cartItemCount={cartItemCount}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  productsContainer: {
    flex: 1,
    // Sadece bu alan scroll olur ve yenilenir
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  categoryTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  productCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  productsGrid: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 120, // Bottom bar için alan
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
});

