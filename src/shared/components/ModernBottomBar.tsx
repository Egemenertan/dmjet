/**
 * ModernBottomBar
 * Modern pill-style bottom bar with animated search functionality and liquid glass effect
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BlurView} from 'expo-blur';
import {
  Home,
  DeliveryTruck,
  ShoppingBag,
  Search,
  Xmark,
} from 'iconoir-react-native';
import {colors, spacing, borderRadius} from '@core/constants';
import {useTranslation} from '@localization';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

interface BottomBarItem {
  key: string;
  icon: React.ComponentType<any>;
  labelKey: string;
}

interface ModernBottomBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSearch?: (query: string) => void;
  cartItemCount?: number;
  isAdmin?: boolean;
}

// Base tabs - Orders tab will be dynamically configured based on admin status
const getTabsConfig = (isAdmin: boolean): BottomBarItem[] => [
  {key: 'Home', icon: Home, labelKey: 'navigation.home'},
  {
    key: 'Orders',
    icon: DeliveryTruck,
    labelKey: isAdmin ? 'admin.orders' : 'navigation.orders',
  },
  {
    key: 'Cart',
    icon: ShoppingBag,
    labelKey: 'navigation.cart',
  },
];

export const ModernBottomBar: React.FC<ModernBottomBarProps> = ({
  activeTab,
  onTabChange,
  onSearch,
  cartItemCount = 0,
  isAdmin = false,
}) => {
  const {t} = useTranslation();
  const insets = useSafeAreaInsets();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const searchAnimation = React.useRef(new Animated.Value(0)).current;
  const keyboardAnimation = React.useRef(new Animated.Value(0)).current;
  const searchInputRef = React.useRef<TextInput>(null);
  
  // Get tabs configuration based on admin status
  const TABS = getTabsConfig(isAdmin);

  // Klavye event listener'ları
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        const height = e.endCoordinates.height;
        if (height > 0) {
          setKeyboardHeight(height);
          // Klavye yüksekliğini direkt kullanarak bottom bar'ı klavyenin hemen üzerine yerleştiriyoruz
          // iOS'ta animasyonlu, Android'de daha hızlı animasyon
          if (Platform.OS === 'ios') {
            Animated.spring(keyboardAnimation, {
              toValue: height,
              useNativeDriver: false,
              tension: 50,
              friction: 8,
            }).start();
          } else {
            // Android'de daha hızlı animasyon - klavye hemen üzerinde olmalı
            Animated.timing(keyboardAnimation, {
              toValue: height,
              duration: 200,
              useNativeDriver: false,
            }).start();
          }
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        if (Platform.OS === 'ios') {
          Animated.spring(keyboardAnimation, {
            toValue: 0,
            useNativeDriver: false,
            tension: 50,
            friction: 8,
          }).start();
        } else {
          Animated.timing(keyboardAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const toggleSearch = () => {
    const toValue = isSearchOpen ? 0 : 1;
    
    Animated.spring(searchAnimation, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();

    if (isSearchOpen) {
      // Kapatılıyor
      setSearchQuery('');
      Keyboard.dismiss();
      setIsSearchOpen(false);
    } else {
      // Açılıyor - klavyeyi manuel olarak açıyoruz
      setIsSearchOpen(true);
      // iOS'ta animasyon tamamlandıktan sonra, Android'de hemen focus yap
      const focusDelay = Platform.OS === 'ios' ? 150 : 100;
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, focusDelay);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim());
      toggleSearch();
    }
  };

  // Search bar wrapper genişliği (search bar + close button + gap) - artık ortalanmış olduğu için maxWidth kullanıyoruz
  const searchBarWrapperMaxWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH - spacing.lg * 2], // Ekran genişliği - padding
  });

  // Search bar genişliği (sadece input alanı)
  const searchBarWidth = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs], // Wrapper genişliği - close button - gap
  });

  const searchBarOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const tabBarOpacity = searchAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const tabBarScale = searchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });


  // Klavye açıkken search bar'ı klavyenin hemen üzerine yerleştirmek için translateY hesaplama
  const translateY = Animated.multiply(keyboardAnimation, -1);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.md,
          bottom: -20,
          transform: [
            {
              // Klavye yüksekliğini direkt kullanarak bottom bar'ı klavyenin hemen üzerine yerleştiriyoruz
              // Boşluk olmaması için klavye yüksekliği kadar negatif yönde kaydırıyoruz
              translateY: translateY,
            },
          ],
        },
      ]}>
      {/* Main Bottom Bar Container */}
      <View style={styles.innerContainer}>
        {/* Pill-style Tab Bar with Liquid Glass Effect */}
        <Animated.View
          style={[
            styles.pillContainerWrapper,
            {
              opacity: tabBarOpacity,
              transform: [{scale: tabBarScale}],
            },
          ]}
          pointerEvents={isSearchOpen ? 'none' : 'auto'}>
          <BlurView
            intensity={80}
            tint="light"
            style={styles.pillContainer}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              // Show badge only for Cart tab
              const showBadge = tab.key === 'Cart' && cartItemCount > 0;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tabButton,
                    isActive && styles.tabButtonActive,
                  ]}
                  onPress={() => onTabChange(tab.key)}
                  activeOpacity={0.7}>
                  <View style={styles.iconContainer}>
                    <Icon
                      width={24}
                      height={24}
                      color={isActive ? colors.primary : colors.text.secondary}
                      strokeWidth={2}
                    />
                    {showBadge && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {cartItemCount > 99 ? '99+' : cartItemCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.tabLabel,
                    !isActive && styles.tabLabelInactive,
                  ]}>
                    {t(tab.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </BlurView>
        </Animated.View>

        {/* Search Bar and Close Button Wrapper */}
        <Animated.View
          style={[
            styles.searchBarWrapper,
            {
              maxWidth: searchBarWrapperMaxWidth,
              opacity: searchBarOpacity,
            },
          ]}
          pointerEvents={isSearchOpen ? 'auto' : 'none'}>
          {/* Animated Search Bar with Liquid Glass */}
          <Animated.View
            style={[
              styles.searchBarContainer,
              {
                width: searchBarWidth,
              },
            ]}>
            <BlurView
              intensity={80}
              tint="light"
              style={styles.searchInputWrapper}>
              <Search
                width={20}
                height={20}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder={t('navigation.searchPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
                autoFocus={isSearchOpen}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  style={styles.clearButton}>
                  <Xmark
                    width={18}
                    height={18}
                    color={colors.text.secondary}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </BlurView>
          </Animated.View>

          {/* Close Search Bar Button - Yanında ayrı buton */}
          <Animated.View
            style={[
              styles.closeSearchButtonWrapper,
              {
                opacity: searchBarOpacity,
              },
            ]}>
            <TouchableOpacity
              style={styles.closeSearchButton}
              onPress={toggleSearch}
              activeOpacity={0.8}>
              <BlurView
                intensity={80}
                tint="light"
                style={styles.closeSearchButtonInner}>
                <Xmark
                  width={24}
                  height={24}
                  color={colors.text.primary}
                  strokeWidth={2.5}
                />
              </BlurView>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Search Toggle Button - Tab bar kapalıyken görünür */}
        {!isSearchOpen && (
          <TouchableOpacity
            style={styles.searchButtonWrapper}
            onPress={toggleSearch}
            activeOpacity={0.8}>
            <BlurView
              intensity={80}
              tint="light"
              style={styles.searchButton}>
              <Search
                width={24}
                height={24}
                color={colors.text.primary}
                strokeWidth={2.5}
              />
            </BlurView>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  pillContainerWrapper: {
    flex: 1,
    maxWidth: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.md, // Ekran genişliği - padding - search button (kapalıyken) - gap
    height: 70,
    overflow: 'hidden',
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    paddingHorizontal: 2,
    paddingVertical: 2,
    gap: spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 0.2)',
    backgroundColor: 'rgba(84, 176, 71, 0.08)',
    height: 65,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 1,
    minWidth: 60,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(84, 176, 71, 0.15)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.2,
    marginTop: 2,
  },
  tabLabelInactive: {
    color: colors.text.secondary,
  },
  searchButtonWrapper: {
    width: 70,
    height: 70,
  },
  searchButton: {
    width: 65,
    height: 65,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 0.2)',
    backgroundColor: 'rgba(84, 176, 71, 0.08)',
  },
  searchBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 70,
    gap: spacing.xs,
    overflow: 'visible',
    zIndex: 1000,
    paddingHorizontal: spacing.lg,
  },
  searchBarContainer: {
    height: 65,
    overflow: 'hidden',
  },
  closeSearchButtonWrapper: {
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    flexShrink: 0,
  },
  closeSearchButton: {
    width: 70,
    height: 70,
  },
  closeSearchButtonInner: {
    width: 70,
    height: 70,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 0.2)',
    backgroundColor: 'rgba(84, 176, 71, 0.08)',
  },
  iconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 0.2)',
    backgroundColor: 'rgba(84, 176, 71, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
});

