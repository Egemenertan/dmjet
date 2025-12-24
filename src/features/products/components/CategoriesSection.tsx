/**
 * CategoriesSection Component
 * Kategorileri yatay scroll ile gösteren section
 * Optimized: Kategoriler prop olarak alınır, gereksiz query yok
 */

import React, {useState, useMemo, memo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {colors, spacing, fontSize, fontWeight} from '@core/constants';
import {CategoryCard} from './CategoryCard';
import {AllCategoriesModal} from './AllCategoriesModal';
import {useTranslation} from '@localization';

interface CategoriesSectionProps {
  categories: any[]; // HomeScreen'den prop olarak gelir
  onCategoryPress?: (categoryId: string, categoryName: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = memo(({
  categories,
  onCategoryPress,
}) => {
  const {t} = useTranslation();
  const [showAllModal, setShowAllModal] = useState(false);

  // Kategorileri memoize et - sadece categories değiştiğinde yeniden hesapla
  const processedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    return categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      image_url: category.image_url,
      original_name: category.original_name,
      has_translation: category.has_translation,
    }));
  }, [categories]);

  if (!processedCategories || processedCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('home.categories')}</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => setShowAllModal(true)}
          activeOpacity={0.7}>
          <Text style={styles.viewAllText}>{t('home.viewAll')}</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // Performans optimizasyonları
        removeClippedSubviews={true}
        decelerationRate="fast"
        snapToInterval={86} // 70 (width) + 16 (marginRight)
        snapToAlignment="start">
        {processedCategories.map((category) => (
          <CategoryCard
            key={category.id}
            id={category.id}
            name={category.name}
            image_url={category.image_url}
            onPress={() => {
              if (onCategoryPress) {
                onCategoryPress(category.id, category.name);
              }
            }}
          />
        ))}
      </ScrollView>

      {/* All Categories Modal */}
      <AllCategoriesModal
        visible={showAllModal}
        categories={processedCategories}
        onClose={() => setShowAllModal(false)}
        onCategoryPress={(categoryId, categoryName) => {
          if (onCategoryPress) {
            onCategoryPress(categoryId, categoryName);
          }
        }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  viewAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewAllText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});

