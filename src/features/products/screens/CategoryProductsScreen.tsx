/**
 * CategoryProductsScreen
 * Kategori ve alt kategoriye göre ürünleri listeler
 */

import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {productsService} from '../services/productsService';
import {ProductCard, CategoryCard, SubcategoryChip} from '../components';
import {useCartStore} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {useTranslation} from '@localization';

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

  const {addItem} = useCartStore();
  const {language} = useAppStore();

  // State'leri local olarak yönet - navigation replace kullanma
  const [currentCategoryId, setCurrentCategoryId] = useState<string>(initialCategoryId);
  const [currentCategoryName, setCurrentCategoryName] = useState<string>(initialCategoryName);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  
  // Scroll pozisyonlarını korumak için ref'ler
  const categoryScrollRef = useRef<ScrollView>(null);
  const subcategoryScrollRef = useRef<ScrollView>(null);

  // Tüm kategorileri çek (yatay scroll için)
  const {data: allCategories} = useQuery({
    queryKey: ['categories', language],
    queryFn: () => productsService.getCategories(language),
  });

  // Bu kategorinin alt kategorilerini çek - currentCategoryId kullan
  const {data: subcategories, isLoading: subcategoriesLoading} = useQuery({
    queryKey: ['subcategories', currentCategoryId, language],
    queryFn: () => productsService.getSubcategoriesByCategory(currentCategoryId, language),
  });

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

  const handleAddToCart = (product: any) => {
    const translation = product.product_translations?.[0];
    addItem({
      id: product.id,
      name: translation?.name || product.name,
      price: product.price,
      image_url: product.image_url,
      discount: product.discount,
    });
  };

  const handleCategoryChange = (newCategoryId: string, newCategoryName: string) => {
    // Navigation replace yerine state güncelle - scroll pozisyonları korunur
    setCurrentCategoryId(newCategoryId);
    setCurrentCategoryName(newCategoryName);
    setSelectedSubcategoryId(null); // Yeni kategoriye geçerken alt kategori seçimini sıfırla
  };

  const handleSubcategoryPress = (subcategoryId: string | null) => {
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Sticky Header - Kategori ve Alt Kategori Filtreleri - Sabit Pozisyon */}
      <View style={styles.stickyHeader}>
        {/* Kategoriler - Chip Tarzında */}
        <View style={styles.categoriesSection}>
          <ScrollView
            ref={categoryScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}>
            {allCategories?.map((category: any) => {
              const translation = category.category_translations?.[0];
              const catName = translation?.name || category.name;
              const isActive = category.id === currentCategoryId;

              return (
                <SubcategoryChip
                  key={category.id}
                  id={category.id}
                  name={catName}
                  isActive={isActive}
                  onPress={() => handleCategoryChange(category.id, catName)}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* Alt Kategoriler - Yatay Scroll */}
        {subcategories && subcategories.length > 0 && (
          <View style={styles.subcategoriesSection}>
            <ScrollView
              ref={subcategoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subcategoriesScroll}>
              {/* Tümü Butonu */}
              <SubcategoryChip
                id="all"
                name="Tümü"
                isActive={selectedSubcategoryId === null}
                onPress={() => handleSubcategoryPress(null)}
              />
              {subcategories.map((subcategory: any) => {
                const translation = subcategory.subcategory_translations?.[0];
                const subName = translation?.name || subcategory.name;

                return (
                  <SubcategoryChip
                    key={subcategory.id}
                    id={subcategory.id}
                    name={subName}
                    isActive={selectedSubcategoryId === subcategory.id}
                    onPress={() => handleSubcategoryPress(subcategory.id)}
                  />
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Ürünler Listesi - Sadece Bu Alan Yenilenir */}
      <View style={styles.productsContainer}>
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Ürünler yükleniyor...</Text>
          </View>
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
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.productsGrid}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListHeaderComponent={() => (
              <View style={styles.categoryTitleContainer}>
                <Text style={styles.categoryTitle}>{currentCategoryName}</Text>
                <Text style={styles.productCount}>
                  {products.length} ürün
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stickyHeader: {
    backgroundColor: colors.background,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // Sabit pozisyon - scroll ile hareket etmez
    zIndex: 10,
  },
  categoriesSection: {
    marginBottom: spacing.sm,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.lg,
  },
  subcategoriesSection: {
    paddingBottom: spacing.sm,
  },
  subcategoriesScroll: {
    paddingHorizontal: spacing.lg,
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

