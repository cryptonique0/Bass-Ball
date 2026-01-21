'use client';

import React, { useState } from 'react';
import { useNotifications } from '@/hooks/useRealTime';
import { Notification, NotificationType } from '@/services/notifications';
import styles from './NotificationCenter.module.css';

export interface NotificationCenterProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  position = 'top-right',
  maxVisible = 3,
}) => {
  const { notifications, stats, markAsRead, deleteNotification, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = stats.unread;
  const visibleNotifications = notifications.slice(0, maxVisible);

  const getNotificationIcon = (type: NotificationType): string => {
    const icons: Record<string, string> = {
      match_goal: '⚽',
      match_card: '🟨',
      match_substitution: '🔄',
      match_start: '🎬',
      match_end: '🏁',
      queue_found: '✅',
      friend_online: '👋',
      friend_invitation: '📩',
      tournament_start: '🏆',
      tournament_end: '🎊',
      ranking_change: '📈',
      achievement_unlocked: '🏅',
      reward_received: '💰',
      system_alert: '⚠️',
      chat_message: '💬',
      club_announcement: '📣',
    };
    return icons[type] || '📢';
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return '#ff4757';
      case 'high':
        return '#ffa502';
      case 'normal':
        return '#1e90ff';
      case 'low':
        return '#95a5a6';
      default:
        return '#1e90ff';
    }
  };

  return (
    <div className={`${styles.container} ${styles[`position_${position}`]}`}>
      {/* Toast Notifications */}
      <div className={styles.toastContainer}>
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`${styles.toast} ${styles[`priority_${notification.priority}`]}`}
            style={{
              borderLeftColor: getPriorityColor(notification.priority),
            }}
          >
            <div className={styles.toastIcon}>
              {getNotificationIcon(notification.type)}
            </div>
            <div className={styles.toastContent}>
              <p className={styles.toastTitle}>{notification.title}</p>
              <p className={styles.toastMessage}>{notification.message}</p>
            </div>
            <button
              className={styles.toastClose}
              onClick={() => deleteNotification(notification.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Notification Bell */}
      <button
        className={`${styles.bellButton} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.bellIcon}>🔔</span>
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Notifications ({unreadCount} unread)</h3>
            {unreadCount > 0 && (
              <button className={styles.markAllRead} onClick={clearAll}>
                Mark all as read
              </button>
            )}
          </div>

          <div className={styles.panelList}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    !notification.read ? styles.unread : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification.id);
                    }
                  }}
                >
                  <div className={styles.notifIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notifContent}>
                    <p className={styles.notifTitle}>{notification.title}</p>
                    <p className={styles.notifMessage}>{notification.message}</p>
                    <p className={styles.notifTime}>
                      {new Date(notification.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    className={styles.notifDelete}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.panelFooter}>
            <p>{stats.total} total notifications</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
