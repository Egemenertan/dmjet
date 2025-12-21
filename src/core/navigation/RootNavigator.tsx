/**
 * Root Navigator
 * Main navigation container
 * Ana sayfa herkese açık, auth ekranları modal olarak gösteriliyor
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from './types';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {/* Ana navigator her zaman gösteriliyor - login zorunlu değil */}
        <Stack.Screen name="Main" component={MainNavigator} />
        {/* Auth ekranları modal olarak gösteriliyor */}
        <Stack.Screen 
          name="Auth" 
          component={AuthNavigator}
          options={{
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

