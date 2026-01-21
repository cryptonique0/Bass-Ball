import { useEffect, useState, useCallback } from 'react';
import pwaService, { PWAStatus, PushNotificationOptions } from '@/lib/pwaService';

export interface UsePWAState extends PWAStatus {
  updatesAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<UsePWAState>({
    isSupported: false,
    isOnline: true,
    isInstalled: false,
    isInstallable: false,
    hasServiceWorker: false,
    cacheSize: 0,
    updatesAvailable: false,
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;

    pwaService.initialize().then(async () => {
      const status = await pwaService.getStatus();
      setState((s) => ({ ...s, ...status }));

      unsub = pwaService.onOfflineStatusChange(async () => {
        const updated = await pwaService.getStatus();
        setState((s) => ({ ...s, ...updated }));
      });
    }).catch(() => {});

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const checkUpdates = useCallback(async () => {
    const hasUpdate = await pwaService.checkForUpdates();
    setState((s) => ({ ...s, updatesAvailable: hasUpdate }));
    return hasUpdate;
  }, []);

  const installApp = useCallback(async () => {
    await pwaService.installApp();
    const status = await pwaService.getStatus();
    setState((s) => ({ ...s, ...status }));
  }, []);

  const clearCache = useCallback(async () => {
    await pwaService.clearCache();
    const status = await pwaService.getStatus();
    setState((s) => ({ ...s, ...status }));
  }, []);

  const sendNotification = useCallback(async (options: PushNotificationOptions) => {
    await pwaService.sendNotification(options);
  }, []);

  const subscribeToPush = useCallback(async (vapidKey: string) => {
    return await pwaService.subscribeToPush(vapidKey);
  }, []);

  const registerSyncTask = useCallback(async (tag: string, data: Record<string, unknown> = {}) => {
    await pwaService.registerSyncTask(tag, data);
  }, []);

  return {
    state,
    isOnline: state.isOnline,
    isInstalled: state.isInstalled,
    isInstallable: state.isInstallable,
    updatesAvailable: state.updatesAvailable,
    checkUpdates,
    installApp,
    clearCache,
    sendNotification,
    subscribeToPush,
    registerSyncTask,
  };
}

export default usePWA;
