/**
 * SearchResultsScreen
 * Ürün arama sonuçlarını listeler
 */

import React, {useCallback, useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {useInfiniteQuery} from '@tanstack/react-query';
import {ArrowLeft, Search} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {searchService} from '../services/searchService';
import {CategoryFilter} from '../components';
import {ProductCard} from '@features/products/components';
import {productsService} from '@features/products/services/productsService';
import {useCartStore} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {LogoLoader} from '@shared/components';
import {useTranslation} from '@localization';
import {ModernBottomBar} from '@shared/components';

type RouteParams = {
  SearchResults: {
    query: string;
  };
};

export const SearchResultsScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'SearchResults'>>();
  const initialQuery = route.params.query;

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('Tümü');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {addItem, items} = useCartStore();
  const {language} = useAppStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Arama sorgusuna göre kategori/alt kategori eşleşmesi kontrol et
  useEffect(() => {
    const checkCategoryMatch = async () => {
      if (!isInitialLoad || !initialQuery || !initialQuery.trim()) {
        return;
      }

      try {
        // Önce alt kategori eşleşmesi kontrol et
        const subcategoryMatch = await searchService.findMatchingSubcategory(initialQuery);
        if (subcategoryMatch) {
          setSelectedCategoryId(subcategoryMatch.categoryId);
          setSelectedSubcategoryId(subcategoryMatch.id);
          setSelectedSubcategoryName(subcategoryMatch.name);
          
          // Kategori adını al
          const categories = await productsService.getCategories(language);
          const category = categories.find((cat: any) => cat.id === subcategoryMatch.categoryId);
          if (category) {
            const translation = category.category_translations?.[0];
            setSelectedCategoryName(translation?.name || category.name);
          }
          
          // Alt kategori bulunduğunda arama sorgusunu temizle
          setSearchQuery('');
          setIsInitialLoad(false);
          return;
        }

        // Alt kategori yoksa kategori eşleşmesi kontrol et
        const categoryMatch = await searchService.findMatchingCategory(initialQuery);
        if (categoryMatch) {
          setSelectedCategoryId(categoryMatch.id);
          setSelectedCategoryName(categoryMatch.name);
          // Kategori bulunduğunda arama sorgusunu temizle
          setSearchQuery('');
          setIsInitialLoad(false);
          return;
        }

        // Hiçbir eşleşme yoksa normal arama yap
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error checking category match:', error);
        setIsInitialLoad(false);
      }
    };

    checkCategoryMatch();
  }, [initialQuery, isInitialLoad, language]);

  // Ürünleri ara - Infinity Scroll
  const {
    data: productsData,
    isLoading: productsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['search-products', searchQuery, language, selectedCategoryId, selectedSubcategoryId],
    queryFn: ({pageParam = 0}) =>
      searchService.searchProducts(
        searchQuery,
        language,
        pageParam,
        20,
        selectedCategoryId,
        selectedSubcategoryId,
      ),
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length : undefined;
    },
    initialPageParam: 0,
    // Her zaman çalıştır - arama sorgusu, kategori veya tüm ürünler için
    enabled: true,
  });

  // Tüm sayfaları birleştir
  const products = productsData?.pages.flatMap(page => page.data) || [];
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
    });
  };

  // Load more products
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle search from bottom bar
  const handleBottomBarSearch = (query: string) => {
    // @ts-ignore
    navigation.push('SearchResults', {query});
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string | null, categoryName: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedCategoryName(categoryName);
    // Kategori seçildiğinde veya "Tümü"ye basıldığında arama sorgusunu temizle
    setSearchQuery('');
  };

  // Handle subcategory change
  const handleSubcategoryChange = (subcategoryId: string | null, subcategoryName: string) => {
    setSelectedSubcategoryId(subcategoryId);
    setSelectedSubcategoryName(subcategoryName);
    // Alt kategori seçildiğinde arama sorgusunu temizle
    // "Tümü" seçildiğinde (null) arama sorgusunu temizleme, kategori filtresini kullan
    if (subcategoryId) {
      setSearchQuery('');
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    if (tab === 'Home') {
      // @ts-ignore
      navigation.navigate('MainTabs');
    } else if (tab === 'Orders') {
      // @ts-ignore
      navigation.navigate('Orders');
    } else if (tab === 'Cart') {
      // @ts-ignore
      navigation.navigate('Cart');
    }
  };

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

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft
              width={24}
              height={24}
              color={colors.text.primary}
              strokeWidth={2}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Arama Sonuçları</Text>
        </View>

        {/* Category Filter */}
        <CategoryFilter
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={handleSubcategoryChange}
          selectedCategoryId={selectedCategoryId}
          selectedSubcategoryId={selectedSubcategoryId}
        />

        {/* Ürünler Listesi */}
        <View style={styles.productsContainer}>
        {productsLoading ? (
          <LogoLoader text="Ürünler aranıyor..." />
        ) : products && products.length > 0 ? (
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
                    // @ts-ignore
                    navigation.navigate('ProductDetail', {productId: item.id});
                  }}
                  onAddToCart={() => handleAddToCart(item)}
                />
              );
            }}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={() => (
              <View style={styles.resultsTitleContainer}>
                <View style={styles.resultsTitleRow}>
                  {searchQuery ? (
                    <Text style={styles.resultsTitle}>"{searchQuery}"</Text>
                  ) : selectedCategoryName === 'Tümü' ? (
                    <Text style={styles.resultsTitle}>Tüm Ürünler</Text>
                  ) : null}
                  {selectedCategoryName !== 'Tümü' && (
                    <Text style={styles.categoryBadge}>
                      {selectedCategoryName}
                      {selectedSubcategoryName && ` • ${selectedSubcategoryName}`}
                    </Text>
                  )}
                </View>
                <Text style={styles.resultsCount}>
                  {totalCount} ürün bulundu
                </Text>
              </View>
            )}
            ListFooterComponent={renderFooter}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Search
              width={64}
              height={64}
              color={colors.text.tertiary}
              strokeWidth={1.5}
            />
            <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
            {searchQuery ? (
              <>
                <Text style={styles.emptyText}>
                  "{searchQuery}" için ürün bulunamadı.
                </Text>
                <Text style={styles.emptySubtext}>
                  Farklı anahtar kelimeler deneyin.
                </Text>
              </>
            ) : selectedCategoryName !== 'Tümü' ? (
              <>
                <Text style={styles.emptyText}>
                  {selectedCategoryName}
                  {selectedSubcategoryName && ` - ${selectedSubcategoryName}`} kategorisinde ürün bulunamadı.
                </Text>
                <Text style={styles.emptySubtext}>
                  Farklı bir kategori deneyin.
                </Text>
              </>
            ) : (
              <Text style={styles.emptyText}>
                Henüz ürün bulunmuyor.
              </Text>
            )}
          </View>
        )}
        </View>
      </SafeAreaView>

      {/* Modern Bottom Bar */}
      <ModernBottomBar
        activeTab=""
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  productsContainer: {
    flex: 1,
  },
  resultsTitleContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  resultsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  resultsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  categoryBadge: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resultsCount: {
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
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.xl,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
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

