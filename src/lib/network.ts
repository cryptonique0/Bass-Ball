/**
 * Network connectivity and synchronization
 */

export interface NetworkState {
  connected: boolean;
  latency: number;
  lastSync: number;
  syncedData: string[];
}

export interface SyncData {
  type: string;
  data: Record<string, any>;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export class NetworkManager {
  private state: NetworkState = {
    connected: false,
    latency: 0,
    lastSync: 0,
    syncedData: [],
  };

  private syncQueue: SyncData[] = [];
  private maxQueueSize: number = 1000;
  private syncInterval: number = 5000; // 5 seconds
  private lastPingTime: number = 0;

  /**
   * Connect to network
   */
  connect(): void {
    this.state.connected = true;
    this.state.lastSync = Date.now();
    this.startSyncTimer();
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
    this.state.connected = false;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.state.connected;
  }

  /**
   * Ping server and measure latency
   */
  ping(): number {
    const now = Date.now();
    this.lastPingTime = now;

    // Simulate network latency (in production, this would be actual network call)
    const latency = Math.random() * 100 + 10; // 10-110ms
    this.state.latency = Math.round(latency);

    return this.state.latency;
  }

  /**
   * Get current latency
   */
  getLatency(): number {
    return this.state.latency;
  }

  /**
   * Queue data for synchronization
   */
  queueSync(syncData: SyncData): boolean {
    if (this.syncQueue.length >= this.maxQueueSize) {
      return false;
    }

    this.syncQueue.push(syncData);
    
    // Sort by priority
    this.syncQueue.sort((a, b) => {
      const priorityMap = { critical: 0, high: 1, normal: 2, low: 3 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    return true;
  }

  /**
   * Process sync queue
   */
  private processSyncQueue(): void {
    if (!this.state.connected || this.syncQueue.length === 0) {
      return;
    }

    // Process up to 10 items per sync cycle
    const toProcess = Math.min(10, this.syncQueue.length);

    for (let i = 0; i < toProcess; i++) {
      const data = this.syncQueue.shift();
      if (data) {
        this.state.syncedData.push(data.type);
        this.state.lastSync = Date.now();
      }
    }

    // Keep only last 100 synced items
    if (this.state.syncedData.length > 100) {
      this.state.syncedData = this.state.syncedData.slice(-100);
    }
  }

  /**
   * Start sync timer
   */
  private startSyncTimer(): void {
    setInterval(() => {
      if (this.state.connected) {
        this.processSyncQueue();
        this.ping();
      }
    }, this.syncInterval);
  }

  /**
   * Get network state
   */
  getNetworkState(): NetworkState {
    return { ...this.state };
  }

  /**
   * Get sync queue size
   */
  getSyncQueueSize(): number {
    return this.syncQueue.length;
  }

  /**
   * Clear sync queue
   */
  clearSyncQueue(): void {
    this.syncQueue = [];
  }

  /**
   * Get network statistics
   */
  getStatistics() {
    return {
      connected: this.state.connected,
      latency: this.state.latency,
      queueSize: this.syncQueue.length,
      maxQueueSize: this.maxQueueSize,
      syncedItems: this.state.syncedData.length,
      lastSync: this.state.lastSync,
      syncInterval: this.syncInterval,
    };
  }

  /**
   * Simulate network issue
   */
  simulateNetworkIssue(durationMs: number): void {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, durationMs);
  }
}
