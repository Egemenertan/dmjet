/**
 * Main Navigator
 * Main app screens after authentication
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {MainStackParamList} from './types';
import {MainTabs} from './MainTabs';
import {CartScreen} from '@features/cart/screens/CartScreen';
import {CheckoutScreen} from '@features/cart/screens/CheckoutScreen';
import {MapSelectionScreen, LegalScreen} from '@features/profile/screens';
import {SearchResultsScreen} from '@features/search/screens';
import {ProductDetailScreen, CategoryProductsScreen} from '@features/products/screens';
import {TabProvider} from './TabContext';

// Placeholder screens - will be implemented in features
const OrderDetailScreen = () => null;

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <TabProvider>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="MapSelection" component={MapSelectionScreen} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
        <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
        <Stack.Screen name="SearchResults" component={SearchResultsScreen} />
        <Stack.Screen name="Legal" component={LegalScreen} />
      </Stack.Navigator>
    </TabProvider>
  );
};

