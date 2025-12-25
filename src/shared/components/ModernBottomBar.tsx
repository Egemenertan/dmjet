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
import {useCartStore} from '@store/slices/cartStore';
import {getDeliverySettings, calculateAmountExcludingCigarettes} from '@features/cart/services/deliveryService';
import {DeliverySettings} from '@features/cart/types';

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
  onCheckout?: () => void;
  canCheckout?: boolean;
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
  onCheckout,
  canCheckout = true,
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
  
  // Aktif tab için slide animasyonu
  const slideAnimation = React.useRef(new Animated.Value(0)).current;
  
  // Buton pozisyonlarını saklamak için
  const [buttonPositions, setButtonPositions] = React.useState<number[]>([]);
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  // Sepet ve teslimat ayarları için state
  const {items, totalAmount} = useCartStore();
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  
  // Teslimat ayarlarını yükle
  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getDeliverySettings();
      setDeliverySettings(settings);
    };
    fetchSettings();
  }, []);
  
  // Sigara hariç sepet tutarını hesapla
  const cartAmountExcludingCigarettes = calculateAmountExcludingCigarettes(items);
  
  // Progress bar için yüzde hesapla
  const freeDeliveryLimit = deliverySettings?.min_order_for_free_delivery || 500;
  const progressPercentage = Math.min((cartAmountExcludingCigarettes / freeDeliveryLimit) * 100, 100);
  const remainingAmount = Math.max(freeDeliveryLimit - cartAmountExcludingCigarettes, 0);
  
  // Progress bar animasyonu
  const progressAnimValue = React.useRef(new Animated.Value(0)).current;
  const [showAchievedMessage, setShowAchievedMessage] = useState(false);
  const [showCheckoutButton, setShowCheckoutButton] = useState(false);
  
  useEffect(() => {
    Animated.timing(progressAnimValue, {
      toValue: progressPercentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressPercentage]);
  
  // Bar %100'e ulaştığında başarı mesajını göster, 3 saniye sonra checkout butonuna geç
  useEffect(() => {
    if (progressPercentage >= 100 && cartItemCount > 0) {
      setShowAchievedMessage(true);
      setShowCheckoutButton(false);
      
      const timer = setTimeout(() => {
        setShowAchievedMessage(false);
        setShowCheckoutButton(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      setShowAchievedMessage(false);
      setShowCheckoutButton(false);
    }
  }, [progressPercentage, cartItemCount]);
  
  // Active tab değiştiğinde animasyon
  useEffect(() => {
    const activeIndex = TABS.findIndex(tab => tab.key === activeTab);
    // activeIndex -1 ise (tab bulunamadıysa) animasyonu 0'a çek ama opacity ile gizle
    Animated.spring(slideAnimation, {
      toValue: activeIndex >= 0 ? activeIndex : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [activeTab, TABS]);

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
      {/* Progress Bar - Ücretsiz Teslimat */}
      {cartItemCount > 0 && !isSearchOpen && (
        <View style={styles.progressBarContainer}>
          {progressPercentage < 100 ? (
            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarBackground}>
                <Animated.View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: progressAnimValue.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {t('cart.freeDeliveryRemaining', { amount: remainingAmount.toFixed(0) })}
              </Text>
            </View>
          ) : showAchievedMessage ? (
            <View style={styles.achievedTextContainer}>
              <Text style={styles.achievedText}>
                {t('cart.freeDeliveryAchieved')}
              </Text>
            </View>
          ) : showCheckoutButton && onCheckout ? (
            <TouchableOpacity
              style={styles.checkoutButtonContainer}
              onPress={() => {
                // Eğer checkout yapılamıyorsa (hizmet saatleri dışı vb.) sadece Cart tab'ına git
                if (!canCheckout) {
                  onTabChange('Cart');
                } else {
                  // Checkout yapılabiliyorsa normal checkout fonksiyonunu çağır
                  onCheckout();
                }
              }}
              activeOpacity={0.8}>
              <View style={styles.checkoutButton}>
                <Text style={styles.checkoutButtonText}>
                  {canCheckout ? t('cart.goToCheckout') : t('cart.viewCart')}
                </Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      
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
            style={styles.pillContainer}
            onLayout={(e) => {
              const width = e.nativeEvent.layout.width;
              setContainerWidth(width);
            }}>
            {/* Sliding Background Indicator */}
            <Animated.View
              style={[
                styles.slidingBackground,
                {
                  width: containerWidth > 0 ? (containerWidth - 8) / 3 : 0,
                  opacity: TABS.findIndex(tab => tab.key === activeTab) >= 0 ? 1 : 0, // activeTab geçersizse gizle
                  transform: [
                    {
                      translateX: slideAnimation.interpolate({
                        inputRange: [0, 1, 2],
                        outputRange: containerWidth > 0 ? [
                          4, // İlk buton
                          4 + (containerWidth - 8) / 3, // İkinci buton
                          4 + ((containerWidth - 8) / 3) * 2, // Üçüncü buton
                        ] : [0, 0, 0],
                      }),
                    },
                  ],
                },
              ]}
            />
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.key;
              const Icon = tab.icon;
              // Show badge only for Cart tab
              const showBadge = tab.key === 'Cart' && cartItemCount > 0;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabButton}
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: 'transparent',
    
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs, // Ana bar ile search butonu arası boşluk azaltıldı
  },
  pillContainerWrapper: {
    flex: 1,
    maxWidth: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs, // Ekran genişliği - padding - search button - gap (xs)
    height: 65,
    overflow: 'hidden',
  },
  pillContainer: {
    flexDirection: 'row',
    borderRadius: borderRadius.full,
    paddingHorizontal: 1,
    paddingVertical: 1,
    gap: 0,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(84, 176, 71, 0.06)',
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
    minWidth: 80,
    zIndex: 1,
  },
  slidingBackground: {
    position: 'absolute',
    left: -1,
    top: 1,
    bottom: 1,
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.1)',
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
    width: 65,
    height: 65,
  },
  searchButton: {
    width: 65,
    height: 65,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(84, 176, 71, 0.06)',
  },
  searchBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 65,
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
    width: 65,
    height: 65,
  },
  closeSearchButtonInner: {
    width: 65,
    height: 65,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(84, 176, 71, 0.06)',
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
    borderWidth: 1.5,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(84, 176, 71, 0.06)',
  },
  searchInput: {
    flex: 1,
    fontSize: 19,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  clearButton: {
    padding: spacing.xs,
  },
  progressBarContainer: {
    position: 'absolute',
    top: -18,
    left: spacing.xl,
    right: spacing.md,
    zIndex: 999,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  progressBarWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
    maxWidth: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(84, 176, 71, 0.15)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  achievedTextContainer: {
    backgroundColor: 'rgba(84, 176, 71, 0.95)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    width: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
    maxWidth: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
  },
  achievedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  checkoutButtonContainer: {
    width: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
    maxWidth: SCREEN_WIDTH - spacing.lg * 2 - 70 - spacing.xs - 8,
  },
  checkoutButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(84, 176, 71, 1)',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
});

