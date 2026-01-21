/**
 * WebSocket Service for Real-Time Features
 * 
 * Manages WebSocket connections for:
 * - Live match updates
 * - Real-time notifications
 * - Matchmaking queue status
 * - Activity feed updates
 * - Player status changes
 */

export type EventType =
  | 'match:start'
  | 'match:goal'
  | 'match:card'
  | 'match:substitution'
  | 'match:end'
  | 'match:update'
  | 'notification:new'
  | 'queue:status'
  | 'queue:match_found'
  | 'activity:new'
  | 'player:status'
  | 'chat:message'
  | 'tournament:update'
  | 'ranking:change'
  | 'connection:ready'
  | 'connection:error'
  | 'connection:reconnect';

export interface WebSocketEvent {
  type: EventType;
  data: any;
  timestamp: number;
  source?: string;
}

export interface WebSocketMessage {
  id: string;
  type: 'subscribe' | 'unsubscribe' | 'emit' | 'ping';
  channel?: string;
  event?: EventType;
  data?: any;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnectedTime: number | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}

/**
 * WebSocket Service
 * Singleton pattern for managing real-time connections
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<EventType, Set<(event: WebSocketEvent) => void>> = new Map();
  private channels: Set<string> = new Set();
  private messageQueue: WebSocketMessage[] = [];
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    lastConnectedTime: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
  };
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageId: number = 0;

  private constructor(url: string = this.getWSUrl()) {
    this.url = url;
  }

  static getInstance(url?: string): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(url);
    }
    return WebSocketService.instance;
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWSUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:8080';
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_URL || window.location.host;
    const path = process.env.NEXT_PUBLIC_WS_PATH || '/ws';

    return `${protocol}//${host}${path}`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState.isConnected) {
        resolve();
        return;
      }

      if (this.connectionState.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.connectionState.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.connectionState.isConnected = true;
          this.connectionState.isConnecting = false;
          this.connectionState.lastConnectedTime = Date.now();
          this.connectionState.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          // Start heartbeat
          this.startHeartbeat();

          // Process queued messages
          this.processMessageQueue();

          // Resubscribe to channels
          this.resubscribeToChannels();

          this.emit('connection:ready', { message: 'Connected to server' });

          console.log('[WebSocket] Connected to', this.url);
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          this.connectionState.isConnecting = false;
          console.error('[WebSocket] Error:', error);
          this.emit('connection:error', { error: error instanceof Error ? error.message : 'Unknown error' });
          reject(error);
        };

        this.ws.onclose = () => {
          this.connectionState.isConnected = false;
          this.connectionState.isConnecting = false;
          this.stopHeartbeat();

          console.log('[WebSocket] Disconnected');

          // Attempt reconnect
          this.attemptReconnect();
        };
      } catch (error) {
        this.connectionState.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState.isConnected = false;
    this.channels.clear();
  }

  /**
   * Subscribe to an event type
   */
  on(eventType: EventType, callback: (event: WebSocketEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  /**
   * Subscribe to channel
   */
  subscribe(channel: string): void {
    if (this.channels.has(channel)) return;

    this.channels.add(channel);

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'subscribe',
      channel,
    };

    this.send(message);
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel: string): void {
    this.channels.delete(channel);

    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'unsubscribe',
      channel,
    };

    this.send(message);
  }

  /**
   * Emit event to server
   */
  emit(eventType: EventType, data: any): void {
    const message: WebSocketMessage = {
      id: this.generateMessageId(),
      type: 'emit',
      event: eventType,
      data,
    };

    this.send(message);
  }

  /**
   * Send message to server
   */
  private send(message: WebSocketMessage): void {
    if (!this.connectionState.isConnected) {
      this.messageQueue.push(message);
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Send error:', error);
      this.messageQueue.push(message);
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const event: WebSocketEvent = JSON.parse(data);

      // Emit to listeners
      const listeners = this.listeners.get(event.type);
      if (listeners) {
        listeners.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error('[WebSocket] Listener error:', error);
          }
        });
      }
    } catch (error) {
      console.error('[WebSocket] Parse error:', error);
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.connectionState.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Resubscribe to all channels
   */
  private resubscribeToChannels(): void {
    this.channels.forEach((channel) => {
      const message: WebSocketMessage = {
        id: this.generateMessageId(),
        type: 'subscribe',
        channel,
      };
      this.send(message);
    });
  }

  /**
   * Attempt reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.connectionState.reconnectAttempts >= this.connectionState.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      this.emit('connection:error', { message: 'Failed to reconnect after max attempts' });
      return;
    }

    this.connectionState.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts - 1), this.maxReconnectDelay);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.connectionState.reconnectAttempts})`);

    this.emit('connection:reconnect', { attempt: this.connectionState.reconnectAttempts, delay });

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.connectionState.isConnected) {
        const message: WebSocketMessage = {
          id: this.generateMessageId(),
          type: 'ping',
        };
        this.send(message);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${++this.messageId}`;
  }

  /**
   * Get connection state
   */
  getState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get active channels
   */
  getChannels(): string[] {
    return Array.from(this.channels);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Get message queue size
   */
  getQueueSize(): number {
    return this.messageQueue.length;
  }

  /**
   * Reset service
   */
  reset(): void {
    this.disconnect();
    this.listeners.clear();
    this.channels.clear();
    this.messageQueue = [];
    this.connectionState.reconnectAttempts = 0;
  }
}

export default WebSocketService.getInstance();
