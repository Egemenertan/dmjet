/**
 * OfflineNotice Component
 * 
 * Shows a banner when device is offline or has slow connection
 */

import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Wifi, WifiOff } from 'iconoir-react-native';
import { colors, spacing, fontSize, fontWeight } from '@/core/constants';
import { useNetworkStatus } from '@/core/hooks/useNetworkStatus';

export const OfflineNotice: React.FC = () => {
  const { isConnected, isSlowConnection } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-100));

  React.useEffect(() => {
    if (!isConnected || isSlowConnection) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: -100,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [isConnected, isSlowConnection, slideAnim]);

  if (isConnected && !isSlowConnection) {
    return null;
  }

  return (
    <Animated.View
        style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: !isConnected ? colors.error : colors.warning,
        },
      ]}
    >
      <View style={styles.content}>
        {!isConnected ? (
          <WifiOff width={20} height={20} color={colors.white} strokeWidth={2} />
        ) : (
          <Wifi width={20} height={20} color={colors.white} strokeWidth={2} />
        )}
        <Text style={styles.text}>
          {!isConnected
            ? 'İnternet bağlantısı yok'
            : 'Yavaş internet bağlantısı'}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
});

