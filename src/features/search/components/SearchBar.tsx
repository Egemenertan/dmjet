/**
 * SearchBar Component
 * Arama çubuğu komponenti
 */

import React, {useState} from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import {Search, Xmark} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialValue = '',
  placeholder = 'Ürün ara...',
  onSearch,
  autoFocus = false,
}) => {
  const [searchText, setSearchText] = useState(initialValue);

  const handleSearch = () => {
    if (searchText.trim()) {
      Keyboard.dismiss();
      onSearch(searchText.trim());
    }
  };

  const handleClear = () => {
    setSearchText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Search
          width={20}
          height={20}
          color={colors.text.secondary}
          strokeWidth={2}
        />
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={setSearchText}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          autoFocus={autoFocus}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Xmark
              width={18}
              height={18}
              color={colors.text.secondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs,
  },
});











