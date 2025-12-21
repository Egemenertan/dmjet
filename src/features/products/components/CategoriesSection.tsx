/**
 * CategoriesSection Component
 * Kategorileri yatay scroll ile gösteren section
 */

import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {productsService} from '../services/productsService';
import {CategoryCard} from './CategoryCard';
import {AllCategoriesModal} from './AllCategoriesModal';
import {useAppStore} from '@store/slices/appStore';
import {useTranslation} from '@localization';

interface CategoriesSectionProps {
  onCategoryPress?: (categoryId: string, categoryName: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  onCategoryPress,
}) => {
  const {t} = useTranslation();
  const {language} = useAppStore();
  const [showAllModal, setShowAllModal] = useState(false);

  const {data: categories, isLoading} = useQuery({
    queryKey: ['categories', language],
    queryFn: () => productsService.getCategories(language),
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('home.categories')}</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  // Kategorileri translation ile hazırla
  const processedCategories = categories?.map((category: any) => {
    const translation = category.category_translations?.[0];
    const categoryName = translation?.name || category.name;
    return {
      id: category.id,
      name: categoryName,
      image_url: category.image_url,
    };
  }) || [];

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
        contentContainerStyle={styles.scrollContent}>
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
};

const styles = StyleSheet.create({
  container: {
    
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

