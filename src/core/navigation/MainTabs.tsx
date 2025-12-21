/**
 * Main Tabs
 * Custom bottom bar navigation with ModernBottomBar
 */

import React, {useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {createStackNavigator} from '@react-navigation/stack';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {HomeScreen, CategoryProductsScreen} from '@features/products/screens';
import {OrdersScreen} from '@features/orders/screens/OrdersScreen';
import {AdminOrdersScreen} from '@features/orders/screens/AdminOrdersScreen';
import {CartScreen} from '@features/cart/screens/CartScreen';
import {ProfileScreen} from '@features/profile/screens/ProfileScreen';
import {ModernBottomBar} from '@shared/components';
import {useCartStore} from '@store/slices/cartStore';
import {useAuthStore} from '@store/slices/authStore';
import {TabProvider, useTabNavigation} from './TabContext';

const HomeStack = createStackNavigator();
const OrdersStack = createStackNavigator();
const CartStack = createStackNavigator();
const ProfileStack = createStackNavigator();

// Home Stack Navigator (Ana Sayfa + Kategori Sayfası)
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{headerShown: false}}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
    </HomeStack.Navigator>
  );
};

// Orders Stack Navigator
const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator screenOptions={{headerShown: false}}>
      <OrdersStack.Screen name="OrdersMain" component={OrdersScreen} />
    </OrdersStack.Navigator>
  );
};

// Cart Stack Navigator (Normal users)
const CartStackNavigator = () => {
  return (
    <CartStack.Navigator screenOptions={{headerShown: false}}>
      <CartStack.Screen name="CartMain" component={CartScreen} />
    </CartStack.Navigator>
  );
};

// Admin Orders Stack Navigator (Admin users)
const AdminOrdersStackNavigator = () => {
  return (
    <CartStack.Navigator screenOptions={{headerShown: false}}>
      <CartStack.Screen name="AdminOrdersMain" component={AdminOrdersScreen} />
    </CartStack.Navigator>
  );
};

// Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{headerShown: false}}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
};

const MainTabsContent: React.FC = () => {
  const {activeTab, setActiveTab} = useTabNavigation();
  const navigation = useNavigation();
  const {items} = useCartStore();
  const {isAdmin, canAccessAdminOrders} = useAuthStore();
  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Orders tab'ına yönlendirme kontrolü
  useEffect(() => {
    const checkNavigateToOrders = async () => {
      try {
        const shouldNavigate = await AsyncStorage.getItem('navigateToOrders');
        if (shouldNavigate === 'true') {
          await AsyncStorage.removeItem('navigateToOrders');
          setActiveTab('Orders');
        }
      } catch (error) {
        console.error('Navigation check error:', error);
      }
    };

    checkNavigateToOrders();
  }, [setActiveTab]);

  const handleSearch = (query: string) => {
    // @ts-ignore
    navigation.navigate('SearchResults', {query});
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeStackNavigator />;
      case 'Orders':
        // Admin and courier users see AdminOrdersScreen, normal users see OrdersScreen
        return canAccessAdminOrders ? <AdminOrdersStackNavigator /> : <OrdersStackNavigator />;
      case 'Cart':
        return <CartStackNavigator />;
      case 'Profile':
        return <ProfileStackNavigator />;
      default:
        return <HomeStackNavigator />;
    }
  };

  return (
    <View style={styles.container}>
      {renderActiveScreen()}
      <ModernBottomBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSearch={handleSearch}
        cartItemCount={cartItemCount}
        isAdmin={canAccessAdminOrders}
      />
    </View>
  );
};

export const MainTabs: React.FC = () => {
  return (
    <TabProvider>
      <MainTabsContent />
    </TabProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

