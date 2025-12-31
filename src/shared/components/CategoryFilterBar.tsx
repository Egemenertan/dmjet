/**
 * CategoryFilterBar Component
 * Kategori ve alt kategori filtreleme butonları
 * Hem arama sayfasında hem de kategori ürün sayfasında kullanılır
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {ArrowLeft} from 'iconoir-react-native';
import {useQuery} from '@tanstack/react-query';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {productsService} from '@features/products/services/productsService';
import {useAppStore} from '@store/slices/appStore';
import {useTranslation} from '@localization';

interface CategoryFilterBarProps {
  onCategoryChange: (categoryId: string | null, categoryName: string) => void;
  onSubcategoryChange: (subcategoryId: string | null, subcategoryName: string) => void;
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  onCategoryChange,
  onSubcategoryChange,
  selectedCategoryId,
  selectedSubcategoryId,
  showBackButton = false,
  onBackPress,
}) => {
  const {t} = useTranslation();
  const {language} = useAppStore();

  // Kategorileri çek
  const {data: categories, isLoading: categoriesLoading} = useQuery({
    queryKey: ['categories', language],
    queryFn: () => productsService.getCategories(language),
  });

  // Seçili kategoriye göre alt kategorileri çek
  const {data: subcategories, isLoading: subcategoriesLoading} = useQuery({
    queryKey: ['subcategories', selectedCategoryId, language],
    queryFn: () =>
      selectedCategoryId
        ? productsService.getSubcategoriesByCategory(selectedCategoryId, language)
        : Promise.resolve([]),
    enabled: !!selectedCategoryId,
  });

  // Kategorileri hazırla
  const processedCategories = categories?.map((category: any) => ({
    id: category.id,
    name: category.name,
  })) || [];

  // Alt kategorileri hazırla
  const processedSubcategories = subcategories?.map((subcategory: any) => ({
    id: subcategory.id,
    name: subcategory.name,
  })) || [];

  if (categoriesLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Kategoriler */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Geri Butonu - Sadece showBackButton true ise göster */}
        {showBackButton && onBackPress && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onBackPress();
            }}
            activeOpacity={0.7}>
            <ArrowLeft
              width={24}
              height={24}
              color={colors.text.primary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}
        
        {/* Tümü Butonu */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            !selectedCategoryId && styles.filterButtonActive,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCategoryChange(null, t('common.all'));
            onSubcategoryChange(null, '');
          }}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.filterButtonText,
              !selectedCategoryId && styles.filterButtonTextActive,
            ]}>
            {t('common.all')}
          </Text>
        </TouchableOpacity>

        {/* Kategori Butonları */}
        {processedCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterButton,
              selectedCategoryId === category.id && styles.filterButtonActive,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCategoryChange(category.id, category.name);
              onSubcategoryChange(null, '');
            }}
            activeOpacity={0.7}>
            <Text
              style={[
                styles.filterButtonText,
                selectedCategoryId === category.id && styles.filterButtonTextActive,
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Alt Kategoriler - Sadece kategori seçiliyse göster */}
      {selectedCategoryId && (
        <>
          {subcategoriesLoading ? (
            <View style={styles.subcategoryLoadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : processedSubcategories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.scrollContent, styles.subcategoryScroll]}>
              {/* Tümü Butonu */}
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  styles.subcategoryButton,
                  !selectedSubcategoryId && styles.filterButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onSubcategoryChange(null, '');
                }}
                activeOpacity={0.7}>
                <Text
                  style={[
                    styles.filterButtonText,
                    styles.subcategoryButtonText,
                    !selectedSubcategoryId && styles.filterButtonTextActive,
                  ]}>
                  {t('common.all')}
                </Text>
              </TouchableOpacity>

              {/* Alt Kategori Butonları */}
              {processedSubcategories.map((subcategory) => (
                <TouchableOpacity
                  key={subcategory.id}
                  style={[
                    styles.filterButton,
                    styles.subcategoryButton,
                    selectedSubcategoryId === subcategory.id && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSubcategoryChange(subcategory.id, subcategory.name);
                  }}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      styles.subcategoryButtonText,
                      selectedSubcategoryId === subcategory.id && styles.filterButtonTextActive,
                    ]}>
                    {subcategory.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : null}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    paddingRight: spacing.sm,
  },
  loadingContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  subcategoryLoadingContainer: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  subcategoryScroll: {
    paddingTop: 0,
  },
  filterButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: `${colors.primary}1A`, // %10 opacity
    borderColor: colors.primary,
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  filterButtonTextActive: {
    color: colors.primary,
  },
  subcategoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
  
  },
  subcategoryButtonText: {
    fontSize: fontSize.xs,
  },
});

