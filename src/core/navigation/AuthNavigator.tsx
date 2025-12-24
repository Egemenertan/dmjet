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
  ForgotPasswordScreen,
  ResetPasswordScreen,
} from '@features/auth/screens';

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

