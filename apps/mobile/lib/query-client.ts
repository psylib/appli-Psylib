/**
 * React Query Client + MMKV Persistence
 * Cache persists across app restarts for instant startup.
 */
import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { mmkvStorage } from './mmkv';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 2, // 2 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24h in cache
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * MMKV-backed persister for React Query
 */
export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => mmkvStorage.getString(key) ?? null,
    setItem: (key: string, value: string) => mmkvStorage.set(key, value),
    removeItem: (key: string) => mmkvStorage.delete(key),
  },
  key: 'psylib-query-cache',
  throttleTime: 1000,
});
