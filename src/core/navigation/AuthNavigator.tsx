/**
 * Auth Navigator
 * Authentication flow screens
 */

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthStackParamList} from './types';
import {
  WelcomeScreen,
  LoginScreen,
  RegisterScreen,
} from '@features/auth/screens';

// Placeholder for ForgotPassword - will be implemented later
const ForgotPasswordScreen = () => null;

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

