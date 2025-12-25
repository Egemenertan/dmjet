/**
 * useNetworkStatus Hook
 *
 * Monitors network connectivity status
 *
 * Features:
 * - Real-time network status
 * - Connection type detection
 * - Automatic reconnection handling
 */

import {useState, useEffect} from 'react';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
  isSlowConnection: boolean;
}

/**
 * Hook to monitor network status
 *
 * @returns NetworkStatus object
 *
 * @example
 * const { isConnected, isSlowConnection } = useNetworkStatus();
 *
 * if (!isConnected) {
 *   return <OfflineScreen />;
 * }
 */
export const useNetworkStatus = (): NetworkStatus => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: null,
    isWifi: false,
    isCellular: false,
    isSlowConnection: false,
  });

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable;
      const type = state.type;

      // Determine connection type
      const isWifi = type === 'wifi';
      const isCellular = type === 'cellular';

      // Detect slow connection (2G, 3G)
      const isSlowConnection =
        (type === 'cellular' &&
          state.details &&
          'cellularGeneration' in state.details &&
          (state.details.cellularGeneration === '2g' ||
            state.details.cellularGeneration === '3g')) ||
        false;

      setNetworkStatus({
        isConnected,
        isInternetReachable,
        type,
        isWifi,
        isCellular,
        isSlowConnection,
      });
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, []);

  return networkStatus;
};

/**
 * Check if network is available
 * One-time check without subscription
 */
export const checkNetworkStatus = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};





