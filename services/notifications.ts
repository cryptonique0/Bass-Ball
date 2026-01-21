/**
 * Notifications Service
 * 
 * Manages real-time notifications for:
 * - Match events (goals, cards, substitutions)
 * - System notifications
 * - Friend notifications
 * - Tournament updates
 * - Ranking changes
 * - Chat messages
 */

export type NotificationType =
  | 'match_goal'
  | 'match_card'
  | 'match_substitution'
  | 'match_start'
  | 'match_end'
  | 'queue_found'
  | 'friend_online'
  | 'friend_invitation'
  | 'tournament_start'
  | 'tournament_end'
  | 'ranking_change'
  | 'achievement_unlocked'
  | 'reward_received'
  | 'system_alert'
  | 'chat_message'
  | 'club_announcement';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: string;
  sound?: boolean;
}

export interface NotificationFilter {
  types?: NotificationType[];
  priorities?: NotificationPriority[];
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

/**
 * Notifications Manager
 */
export class NotificationService {
  private static instance: NotificationService;
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notification: Notification) => void> = new Set();
  private statsListeners: Set<(stats: NotificationStats) => void> = new Set();
  private maxNotifications: number = 100;
  private audioContext: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private constructor() {
    this.loadFromStorage();
    this.initAudio();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Add notification
   */
  addNotification(
    type: NotificationType,
    title: string,
    message: string,
    options: {
      data?: Record<string, any>;
      priority?: NotificationPriority;
      actionUrl?: string;
      icon?: string;
      sound?: boolean;
    } = {}
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      data: options.data,
      priority: options.priority || 'normal',
      timestamp: Date.now(),
      read: false,
      actionUrl: options.actionUrl,
      icon: options.icon,
      sound: options.sound !== false,
    };

    this.notifications.set(notification.id, notification);

    // Maintain max notifications
    if (this.notifications.size > this.maxNotifications) {
      const oldestId = Array.from(this.notifications.values())
        .sort((a, b) => a.timestamp - b.timestamp)[0]?.id;
      if (oldestId) {
        this.notifications.delete(oldestId);
      }
    }

    // Persist
    this.saveToStorage();

    // Notify listeners
    this.notifyListeners(notification);

    // Play sound if enabled
    if (notification.sound && this.soundEnabled) {
      this.playNotificationSound(notification.priority);
    }

    // Browser notification if available
    this.showBrowserNotification(notification);

    // Update stats
    this.notifyStatsListeners();

    return notification;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.read = true;
    this.saveToStorage();
    this.notifyStatsListeners();
    return true;
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notifications.forEach((notification) => {
      notification.read = true;
    });
    this.saveToStorage();
    this.notifyStatsListeners();
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): boolean {
    const result = this.notifications.delete(notificationId);
    if (result) {
      this.saveToStorage();
      this.notifyStatsListeners();
    }
    return result;
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.saveToStorage();
    this.notifyStatsListeners();
  }

  /**
   * Get notifications with filtering
   */
  getNotifications(filter?: NotificationFilter): Notification[] {
    let notifications = Array.from(this.notifications.values());

    if (filter?.types && filter.types.length > 0) {
      notifications = notifications.filter((n) => filter.types!.includes(n.type));
    }

    if (filter?.priorities && filter.priorities.length > 0) {
      notifications = notifications.filter((n) => filter.priorities!.includes(n.priority));
    }

    if (filter?.unreadOnly) {
      notifications = notifications.filter((n) => !n.read);
    }

    // Sort by timestamp descending
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    if (filter?.offset) {
      notifications = notifications.slice(filter.offset);
    }

    if (filter?.limit) {
      notifications = notifications.slice(0, filter.limit);
    }

    return notifications;
  }

  /**
   * Get notification by ID
   */
  getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * Get statistics
   */
  getStats(): NotificationStats {
    const stats: NotificationStats = {
      total: this.notifications.size,
      unread: 0,
      byType: {} as Record<NotificationType, number>,
      byPriority: {} as Record<NotificationPriority, number>,
    };

    this.notifications.forEach((notification) => {
      if (!notification.read) stats.unread++;

      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
      stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
    });

    return stats;
  }

  /**
   * Subscribe to new notifications
   */
  onNotification(callback: (notification: Notification) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Subscribe to stats changes
   */
  onStatsChange(callback: (stats: NotificationStats) => void): () => void {
    this.statsListeners.add(callback);
    return () => this.statsListeners.delete(callback);
  }

  /**
   * Enable/disable sounds
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Generate notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Notify listeners of new notification
   */
  private notifyListeners(notification: Notification): void {
    this.listeners.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Notify stats listeners
   */
  private notifyStatsListeners(): void {
    const stats = this.getStats();
    this.statsListeners.forEach((callback) => {
      try {
        callback(stats);
      } catch (error) {
        console.error('Stats listener error:', error);
      }
    });
  }

  /**
   * Initialize audio context
   */
  private initAudio(): void {
    if (typeof window === 'undefined') return;

    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }

  /**
   * Play notification sound based on priority
   */
  private playNotificationSound(priority: NotificationPriority): void {
    if (!this.audioContext) return;

    try {
      const now = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      // Different tones for different priorities
      const frequencies: Record<NotificationPriority, number> = {
        low: 400,
        normal: 600,
        high: 800,
        critical: 1000,
      };

      const durations: Record<NotificationPriority, number> = {
        low: 0.1,
        normal: 0.15,
        high: 0.2,
        critical: 0.3,
      };

      osc.frequency.value = frequencies[priority];
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + durations[priority]);

      osc.start(now);
      osc.stop(now + durations[priority]);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const options: NotificationOptions = {
          body: notification.message,
          tag: notification.type,
          requireInteraction: notification.priority === 'critical',
        };

        if (notification.icon) {
          options.icon = notification.icon;
        }

        const browserNotif = new Notification(notification.title, options);

        if (notification.actionUrl) {
          browserNotif.onclick = () => {
            window.location.href = notification.actionUrl!;
            browserNotif.close();
          };
        }
      } catch (error) {
        console.error('Failed to show browser notification:', error);
      }
    }
  }

  /**
   * Request browser notification permission
   */
  static requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return Promise.resolve('denied');
    }

    if (Notification.permission !== 'default') {
      return Promise.resolve(Notification.permission);
    }

    return Notification.requestPermission();
  }

  /**
   * Save to localStorage
   */
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = Array.from(this.notifications.values());
      localStorage.setItem('bass_notifications', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = localStorage.getItem('bass_notifications');
      if (data) {
        const notifications = JSON.parse(data) as Notification[];
        notifications.forEach((notif) => {
          this.notifications.set(notif.id, notif);
        });
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
    }
  }
}

export default NotificationService.getInstance();
