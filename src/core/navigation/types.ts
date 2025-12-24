/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import {NavigatorScreenParams} from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Welcome: undefined;
  Login: {returnTo?: keyof MainStackParamList} | undefined;
  Register: {returnTo?: keyof MainStackParamList} | undefined;
  ForgotPassword: undefined;
};

// Home Stack (nested in Home tab)
export type HomeStackParamList = {
  HomeMain: undefined;
};

// Main Stack (after authentication)
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  ProductDetail: {productId: string};
  CategoryProducts: {categoryId: string; categoryName: string};
  Checkout: undefined;
  OrderDetail: {orderId: string};
  MapSelection: undefined;
  Cart: undefined;
  SearchResults: {query: string};
  Legal: undefined;
};

// Bottom Tabs
export type MainTabsParamList = {
  Home: NavigatorScreenParams<HomeStackParamList>;
  Cart: undefined;
  Orders: undefined;
  Profile: undefined;
};

// Root Stack (combines Auth and Main)
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

