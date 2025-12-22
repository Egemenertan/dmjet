/**
 * AllCategoriesModal Component
 * Tüm kategorileri grid layout ile gösteren modern modal
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
} from 'react-native';
import {Xmark} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const ITEM_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2) / 3;

interface Category {
  id: string;
  name: string;
  image_url?: string | null;
}

interface AllCategoriesModalProps {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onCategoryPress: (categoryId: string, categoryName: string) => void;
}

export const AllCategoriesModal: React.FC<AllCategoriesModalProps> = ({
  visible,
  categories,
  onClose,
  onCategoryPress,
}) => {
  const handleCategoryPress = (category: Category) => {
    onCategoryPress(category.id, category.name);
    onClose();
  };

  const renderCategory = ({item}: {item: Category}) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}>
      <View style={styles.categoryImageContainer}>
        {item.image_url ? (
          <Image
            source={{uri: item.image_url}}
            style={styles.categoryImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>
              {item.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.categoryName} numberOfLines={2}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Tüm Kategoriler</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}>
              <Xmark
                width={24}
                height={24}
                color={colors.text.primary}
                strokeWidth={2}
              />
            </TouchableOpacity>
          </View>

          {/* Categories Grid */}
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    maxHeight: '85%',
    paddingTop: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  categoryItem: {
    width: ITEM_WIDTH,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: ITEM_WIDTH - spacing.sm,
    height: ITEM_WIDTH - spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
  },
  categoryName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
});









