// Notification system
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private listeners: Set<(notifs: Notification[]) => void> = new Set();

  notify(type: NotificationType, message: string, duration?: number): string {
    const id = generateId();
    const notification: Notification = { id, type, message, duration };
    this.notifications.set(id, notification);
    this.broadcast();

    if (duration) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  dismiss(id: string): void {
    this.notifications.delete(id);
    this.broadcast();
  }

  subscribe(callback: (notifs: Notification[]) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private broadcast(): void {
    const notifs = Array.from(this.notifications.values());
    this.listeners.forEach(callback => callback(notifs));
  }
}

function generateId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const notificationManager = new NotificationManager();
