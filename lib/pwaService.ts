/**
 * PWA Service - Progressive Web App Support
 * Offline capabilities, caching strategies, background sync, push notifications
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CacheStrategy = 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only' | 'cache-only';

export interface PWAConfig {
  swPath: string;
  cacheName: string;
  cacheVersion: string;
  enableOffline: boolean;
  enablePushNotifications: boolean;
  enableBackgroundSync: boolean;
  cachableRoutes: string[];
  noncachableRoutes: string[];
}

export interface CacheRule {
  pattern: RegExp;
  strategy: CacheStrategy;
  maxAge?: number; // milliseconds
  maxEntries?: number;
}

export interface PWAStatus {
  isSupported: boolean;
  isOnline: boolean;
  isInstalled: boolean;
  isInstallable: boolean;
  hasServiceWorker: boolean;
  cacheSize: number;
}

export interface SyncTask {
  id: string;
  tag: string;
  data: Record<string, unknown>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface OfflineEvent {
  type: 'online' | 'offline';
  timestamp: number;
  isOnline: boolean;
}


// ============================================================================
// PWA SERVICE CLASS
// ============================================================================

class PWAService {
  private config: PWAConfig;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private cacheRules: CacheRule[] = [];
  private syncTasks: Map<string, SyncTask> = new Map();
  private listeners: Set<(event: OfflineEvent) => void> = new Set();
  private deferredPrompt: any = null;
  private readonly CACHE_PREFIX = 'bb-cache';
  private readonly SYNC_STORAGE_KEY = 'bb-sync-tasks';
  private readonly INSTALL_KEY = 'bb-pwa-installed';

  constructor(config: Partial<PWAConfig> = {}) {
    this.config = {
      swPath: '/sw.js',
      cacheName: `${this.CACHE_PREFIX}:main`,
      cacheVersion: '1.0.0',
      enableOffline: true,
      enablePushNotifications: true,
      enableBackgroundSync: true,
      cachableRoutes: [
        '/',
        '/index.html',
        '/manifest.json',
        '/.*\\.css$/',
        '/.*\\.js$/',
        '/.*\\.json$/'
      ],
      noncachableRoutes: [
        '/api/.*',
        '/admin/.*'
      ],
      ...config
    };

    this.initializeCacheRules();
    this.setupEventListeners();
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  /**
   * Initialize PWA service - main entry point
   */
  async initialize(): Promise<void> {
    if (!this.isServiceWorkerSupported()) {
      console.warn('Service Workers not supported');
      return;
    }

    try {
      // Register service worker
      await this.registerServiceWorker();

      // Restore sync tasks
      this.restoreSyncTasks();

      // Request notification permission
      if (this.config.enablePushNotifications) {
        this.requestNotificationPermission();
      }

      console.log('PWA Service initialized successfully');
    } catch (error) {
      console.error('PWA Service initialization failed:', error);
    }
  }

  private initializeCacheRules(): void {
    this.cacheRules = [
      // HTML - network first for quick updates
      {
        pattern: /\.html$/,
        strategy: 'network-first',
        maxAge: 3600000 // 1 hour
      },
      // CSS/JS - cache first, long lifetime
      {
        pattern: /\.(css|js)$/,
        strategy: 'cache-first',
        maxAge: 604800000 // 7 days
      },
      // Images - cache first, generate cache dynamically
      {
        pattern: /\.(png|jpg|jpeg|svg|webp|gif)$/i,
        strategy: 'cache-first',
        maxAge: 2592000000, // 30 days
        maxEntries: 100
      },
      // JSON - stale while revalidate
      {
        pattern: /\.json$/,
        strategy: 'stale-while-revalidate',
        maxAge: 86400000 // 1 day
      },
      // Fonts - cache first, long lifetime
      {
        pattern: /\.(woff2|woff|ttf|eot)$/,
        strategy: 'cache-first',
        maxAge: 2592000000 // 30 days
      },
      // API calls - network first
      {
        pattern: /^https:\/\/api\./,
        strategy: 'network-first',
        maxAge: 300000 // 5 minutes
      }
    ];
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.markAsInstalled();
    });

    // Listen for online/offline changes
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  // ========================================================================
  // SERVICE WORKER MANAGEMENT
  // ========================================================================

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isServiceWorkerSupported()) {
      throw new Error('Service Workers not supported');
    }

    try {
      const registration = await navigator.serviceWorker.register(
        this.config.swPath,
        {
          scope: '/',
          updateViaCache: 'none'
        }
      );

      this.swRegistration = registration;

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            // New service worker is active, notify user
            this.notifyUpdate();
          }
        });
      });

      // Check for updates periodically
      this.startUpdateCheck();

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Unregister service worker
   */
  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      return await this.swRegistration.unregister();
    } catch (error) {
      console.error('Failed to unregister Service Worker:', error);
      return false;
    }
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.swRegistration) return false;

    try {
      await this.swRegistration.update();
      // Check if there's an installing or waiting worker (indicates update)
      return this.swRegistration.installing !== null || this.swRegistration.waiting !== null;
    } catch (error) {
      console.error('Failed to check for updates:', error);
      return false;
    }
  }

  private startUpdateCheck(): void {
    // Check for updates every hour
    setInterval(() => {
      this.checkForUpdates().catch(console.error);
    }, 3600000);
  }

  // ========================================================================
  // CACHING STRATEGIES
  // ========================================================================

  /**
   * Cache a resource with specified strategy
   */
  async cacheResource(
    url: string,
    strategy: CacheStrategy = 'cache-first',
    response?: Response
  ): Promise<Response | null> {
    if (!this.config.enableOffline) return null;

    try {
      const cache = await caches.open(this.config.cacheName);

      if (!response) {
        response = await fetch(url);
      }

      if (response && response.status === 200) {
        // Clone before caching (response can only be used once)
        cache.put(url, response.clone());
      }

      return response;
    } catch (error) {
      console.error('Failed to cache resource:', error);
      return null;
    }
  }

  /**
   * Execute request with caching strategy
   */
  async fetchWithStrategy(
    url: string,
    strategy?: CacheStrategy,
    options?: RequestInit
  ): Promise<Response> {
    const appliedStrategy = strategy || this.getStrategyForUrl(url);

    switch (appliedStrategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(url, options);
      case 'network-first':
        return this.networkFirstStrategy(url, options);
      case 'stale-while-revalidate':
        return this.staleWhileRevalidateStrategy(url, options);
      case 'network-only':
        return fetch(url, options);
      case 'cache-only':
        return this.cacheOnlyStrategy(url);
      default:
        return fetch(url, options);
    }
  }

  private async cacheFirstStrategy(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const cache = await caches.open(this.config.cacheName);
    const cached = await cache.match(url);

    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(url, options);
      if (response && response.status === 200) {
        cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline - Resource not available', { status: 503 });
    }
  }

  private async networkFirstStrategy(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    try {
      const response = await fetch(url, options);
      if (response && response.status === 200) {
        const cache = await caches.open(this.config.cacheName);
        cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      const cache = await caches.open(this.config.cacheName);
      const cached = await cache.match(url);
      if (cached) {
        return cached;
      }
      return new Response('Offline - Network unavailable', { status: 503 });
    }
  }

  private async staleWhileRevalidateStrategy(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const cache = await caches.open(this.config.cacheName);
    const cached = await cache.match(url);

    // Return cached immediately if available
    if (cached) {
      // Fetch in background to update cache
      fetch(url, options).then((response) => {
        if (response && response.status === 200) {
          cache.put(url, response);
        }
      }).catch(() => {
        // Ignore fetch errors during background update
      });

      return cached;
    }

    // No cached version, fetch from network
    try {
      const response = await fetch(url, options);
      if (response && response.status === 200) {
        cache.put(url, response.clone());
      }
      return response;
    } catch (error) {
      return new Response('Offline - No cached version available', { status: 503 });
    }
  }

  private async cacheOnlyStrategy(url: string): Promise<Response> {
    const cache = await caches.open(this.config.cacheName);
    const cached = await cache.match(url);

    if (cached) {
      return cached;
    }

    return new Response('Offline - Not in cache', { status: 503 });
  }

  private getStrategyForUrl(url: string): CacheStrategy {
    for (const rule of this.cacheRules) {
      if (rule.pattern.test(url)) {
        return rule.strategy;
      }
    }
    return 'network-first';
  }

  // ========================================================================
  // CACHE MANAGEMENT
  // ========================================================================

  /**
   * Clear all caches
   */
  async clearCache(): Promise<boolean> {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Clear specific cache
   */
  async clearCacheByName(name: string): Promise<boolean> {
    try {
      return await caches.delete(name);
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Get cache size in bytes
   */
  async getCacheSize(): Promise<number> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.usage || 0;
    } catch (error) {
      console.error('Failed to get cache size:', error);
      return 0;
    }
  }

  /**
   * Get cache quota
   */
  async getCacheQuota(): Promise<number> {
    if (!('storage' in navigator) || !('estimate' in navigator.storage)) {
      return 0;
    }

    try {
      const estimate = await navigator.storage.estimate();
      return estimate.quota || 0;
    } catch (error) {
      console.error('Failed to get cache quota:', error);
      return 0;
    }
  }

  /**
   * Request persistent storage
   */
  async requestPersistentStorage(): Promise<boolean> {
    if (!('storage' in navigator) || !('persist' in navigator.storage)) {
      return false;
    }

    try {
      return await navigator.storage.persist();
    } catch (error) {
      console.error('Failed to request persistent storage:', error);
      return false;
    }
  }

  // ========================================================================
  // BACKGROUND SYNC
  // ========================================================================

  /**
   * Register background sync task
   */
  async registerSyncTask(
    tag: string,
    data: Record<string, unknown> = {},
    maxRetries: number = 3
  ): Promise<void> {
    if (!this.config.enableBackgroundSync) return;

    const task: SyncTask = {
      id: `${tag}-${Date.now()}`,
      tag,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.syncTasks.set(task.id, task);
    this.persistSyncTasks();

    // Try to sync if online
    if (this.isOnline) {
      await this.processSyncTask(task);
    }
  }

  private async processSyncTask(task: SyncTask): Promise<boolean> {
    try {
      // Send task to backend or process locally
      if (this.swRegistration && 'sync' in this.swRegistration) {
        await (this.swRegistration.sync as any).register(task.tag);
      }

      this.syncTasks.delete(task.id);
      this.persistSyncTasks();
      return true;
    } catch (error) {
      console.error('Failed to process sync task:', error);

      if (task.retryCount < task.maxRetries) {
        task.retryCount++;
        this.persistSyncTasks();
        return false;
      }

      this.syncTasks.delete(task.id);
      this.persistSyncTasks();
      return false;
    }
  }

  private persistSyncTasks(): void {
    try {
      const tasks = Array.from(this.syncTasks.values());
      localStorage.setItem(this.SYNC_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to persist sync tasks:', error);
    }
  }

  private restoreSyncTasks(): void {
    try {
      const stored = localStorage.getItem(this.SYNC_STORAGE_KEY);
      if (stored) {
        const tasks: SyncTask[] = JSON.parse(stored);
        tasks.forEach((task) => {
          this.syncTasks.set(task.id, task);
        });
      }
    } catch (error) {
      console.error('Failed to restore sync tasks:', error);
    }
  }

  async getSyncTasks(): Promise<SyncTask[]> {
    return Array.from(this.syncTasks.values());
  }

  // ========================================================================
  // PUSH NOTIFICATIONS
  // ========================================================================

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission !== 'default') {
      return Notification.permission;
    }

    return await Notification.requestPermission();
  }

  /**
   * Send push notification
   */
  async sendNotification(options: PushNotificationOptions): Promise<void> {
    if (Notification.permission !== 'granted') {
      await this.requestNotificationPermission();
    }

    if (Notification.permission === 'granted' && this.swRegistration) {
      try {
        await this.swRegistration.showNotification(
          options.title,
          options.options
        );
      } catch (error) {
        console.error('Failed to send notification:', error);
      }
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidKey: string): Promise<PushSubscription | null> {
    if (!this.swRegistration) return null;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey) as BufferSource
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // ========================================================================
  // INSTALLATION MANAGEMENT
  // ========================================================================

  /**
   * Check if app is installable
   */
  isInstallable(): boolean {
    return this.deferredPrompt !== null;
  }

  /**
   * Trigger install prompt
   */
  async installApp(): Promise<void> {
    if (!this.deferredPrompt) {
      console.warn('Installation not available');
      return;
    }

    this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      this.markAsInstalled();
    }

    this.deferredPrompt = null;
  }

  /**
   * Check if app is installed
   */
  isAppInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true ||
           localStorage.getItem(this.INSTALL_KEY) === 'true';
  }

  private markAsInstalled(): void {
    localStorage.setItem(this.INSTALL_KEY, 'true');
  }

  // ========================================================================
  // ONLINE/OFFLINE HANDLING
  // ========================================================================

  private handleOnline(): void {
    this.isOnline = true;
    this.notifyListeners({ type: 'online', timestamp: Date.now(), isOnline: true });

    // Process pending sync tasks
    this.syncTasks.forEach((task) => {
      this.processSyncTask(task).catch(console.error);
    });
  }

  private handleOffline(): void {
    this.isOnline = false;
    this.notifyListeners({ type: 'offline', timestamp: Date.now(), isOnline: false });
  }

  /**
   * Listen for online/offline changes
   */
  onOfflineStatusChange(callback: (event: OfflineEvent) => void): () => void {
    this.listeners.add(callback);

    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: OfflineEvent): void {
    this.listeners.forEach((callback) => callback(event));
  }

  // ========================================================================
  // STATUS & INFORMATION
  // ========================================================================

  /**
   * Get PWA status
   */
  async getStatus(): Promise<PWAStatus> {
    return {
      isSupported: this.isServiceWorkerSupported(),
      isOnline: this.isOnline,
      isInstalled: this.isAppInstalled(),
      isInstallable: this.isInstallable(),
      hasServiceWorker: this.swRegistration !== null,
      cacheSize: await this.getCacheSize()
    };
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ size: number; quota: number; usage: number }> {
    const size = await this.getCacheSize();
    const quota = await this.getCacheQuota();

    return {
      size,
      quota,
      usage: quota > 0 ? (size / quota) * 100 : 0
    };
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // ========================================================================
  // UTILITIES
  // ========================================================================

  private isServiceWorkerSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  private setupInstallPrompt(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as any;
    });
  }

  private notifyUpdate(): void {
    this.sendNotification({
      title: 'App Updated',
      options: {
        body: 'A new version of the app is available. Refresh to update.',
        tag: 'app-update',
        badge: '/icons/badge-192x192.png'
      }
    }).catch(console.error);
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const pwaService = new PWAService();

export default pwaService;
