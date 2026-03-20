/**
 * Network status hook — NetInfo → Zustand store + React Query onlineManager
 */
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { useUIStore } from '@/store/ui.store';

export function useNetworkStatus() {
  const setIsOnline = useUIStore((s) => s.setIsOnline);
  const isOnline = useUIStore((s) => s.isOnline);

  useEffect(() => {
    // Sync React Query's online manager with NetInfo
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
      onlineManager.setOnline(online);
    });

    return () => unsubscribe();
  }, [setIsOnline]);

  return isOnline;
}
