'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications, useWebSocket, useLiveQueue, useActivityFeed } from '@/hooks/useRealTime';
import NotificationCenter from '@/components/NotificationCenter';
import styles from './page.module.css';

export default function RealTimeFeaturesPage() {
  const { notifications, stats, addNotification, markAllAsRead } = useNotifications();
  const { isConnected, isConnecting, error } = useWebSocket(false);
  const { queueStatus, matchFound } = useLiveQueue();
  const activities = useActivityFeed(10);

  const [testIndex, setTestIndex] = useState(0);

  const testNotifications = [
    {
      type: 'match_goal' as const,
      title: '⚽ GOAL!',
      message: 'Your team just scored! Amazing finish!',
    },
    {
      type: 'match_card' as const,
      title: '🟨 Yellow Card',
      message: 'Player received a yellow card for dangerous play',
    },
    {
      type: 'queue_found' as const,
      title: '✅ Match Found!',
      message: 'A match has been found. Loading game...',
    },
    {
      type: 'friend_online' as const,
      title: '👋 Friend Online',
      message: 'Your friend John just came online',
    },
    {
      type: 'ranking_change' as const,
      title: '📈 Ranking Updated',
      message: 'You moved up 2 positions in the rankings!',
    },
    {
      type: 'achievement_unlocked' as const,
      title: '🏅 Achievement',
      message: 'You unlocked "Hat-trick King" achievement!',
    },
    {
      type: 'reward_received' as const,
      title: '💰 Reward',
      message: 'You received 500 coins as a reward!',
    },
    {
      type: 'tournament_start' as const,
      title: '🏆 Tournament Starting',
      message: 'Your tournament starts in 10 minutes',
    },
  ];

  const handleSendNotification = () => {
    const notif = testNotifications[testIndex];
    addNotification(notif.type, notif.title, notif.message, {
      priority: testIndex % 4 === 0 ? 'critical' : testIndex % 3 === 0 ? 'high' : 'normal',
      sound: true,
    });
    setTestIndex((prev) => (prev + 1) % testNotifications.length);
  };

  return (
    <div className={styles.page}>
      <NotificationCenter position="top-right" maxVisible={3} />

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🚀 Real-Time Features Demo</h1>
          <p>WebSocket, Notifications, Live Updates & Activity Feed</p>
        </header>

        <div className={styles.grid}>
          {/* Connection Status */}
          <div className={styles.card}>
            <h2>🔌 Connection Status</h2>
            <div className={styles.statusBox}>
              <div className={`${styles.statusIndicator} ${isConnected ? styles.connected : ''}`} />
              <div>
                <p className={styles.statusText}>
                  {isConnecting ? '🔄 Connecting...' : isConnected ? '✅ Connected' : '❌ Disconnected'}
                </p>
                {error && <p className={styles.errorText}>{error}</p>}
              </div>
            </div>
            <div className={styles.details}>
              <p>
                <strong>Status:</strong> {isConnected ? 'Active' : isConnecting ? 'Reconnecting' : 'Offline'}
              </p>
              <p>
                <strong>Last Known:</strong> Just now
              </p>
            </div>
          </div>

          {/* Notification Stats */}
          <div className={styles.card}>
            <h2>📊 Notification Stats</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total</span>
                <span className={styles.statValue}>{stats.total}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Unread</span>
                <span className={styles.statValue}>{stats.unread}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Critical</span>
                <span className={styles.statValue}>{stats.byPriority?.critical || 0}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>High</span>
                <span className={styles.statValue}>{stats.byPriority?.high || 0}</span>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div className={styles.card}>
            <h2>⏳ Matchmaking Queue</h2>
            {queueStatus ? (
              <div className={styles.queueInfo}>
                <p>
                  <strong>Position:</strong> #{queueStatus.position || 'N/A'}
                </p>
                <p>
                  <strong>Wait Time:</strong> {queueStatus.waitTime || 'Calculating...'}
                </p>
                <p>
                  <strong>Players:</strong> {queueStatus.playersInQueue || 0}
                </p>
              </div>
            ) : (
              <p className={styles.emptyText}>Not in queue</p>
            )}
            {matchFound && <div className={styles.matchFoundAlert}>🎮 Match Found!</div>}
          </div>

          {/* Test Notifications */}
          <div className={styles.card}>
            <h2>🧪 Test Notifications</h2>
            <button className={styles.testButton} onClick={handleSendNotification}>
              Send Test Notification ({testIndex + 1}/{testNotifications.length})
            </button>
            <p className={styles.testInfo}>{testNotifications[testIndex].title}</p>
            <button className={styles.clearButton} onClick={markAllAsRead}>
              Mark All as Read
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        {activities.length > 0 && (
          <div className={styles.activitySection}>
            <h2>📰 Activity Feed</h2>
            <div className={styles.activityList}>
              {activities.map((activity, index) => (
                <div key={index} className={styles.activityItem}>
                  <span className={styles.activityIcon}>
                    {activity.type === 'match' ? '⚽' : activity.type === 'achievement' ? '🏅' : '📢'}
                  </span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityTitle}>{activity.title}</p>
                    <p className={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Notifications */}
        <div className={styles.recentSection}>
          <h2>📬 Recent Notifications</h2>
          {notifications.length === 0 ? (
            <p className={styles.emptyText}>No notifications yet. Send a test notification!</p>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  className={`${styles.notifItem} ${!notif.read ? styles.unread : ''}`}
                >
                  <div className={styles.notifLeft}>
                    <span className={styles.notifPriority}>{notif.priority.toUpperCase()}</span>
                    <div>
                      <p className={styles.notifItemTitle}>{notif.title}</p>
                      <p className={styles.notifItemMessage}>{notif.message}</p>
                    </div>
                  </div>
                  <p className={styles.notifTime}>
                    {new Date(notif.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Documentation */}
        <div className={styles.docsSection}>
          <h2>📚 Features Overview</h2>
          <div className={styles.featuresList}>
            <div className={styles.featureItem}>
              <h3>✅ WebSocket Service</h3>
              <p>Automatic connection management, reconnection with exponential backoff, message queuing</p>
            </div>
            <div className={styles.featureItem}>
              <h3>✅ Notifications</h3>
              <p>16+ notification types, priority levels, browser notifications, audio feedback, persistence</p>
            </div>
            <div className={styles.featureItem}>
              <h3>✅ Real-Time Events</h3>
              <p>Live match updates, queue status, activity feed, player status changes, rankings</p>
            </div>
            <div className={styles.featureItem}>
              <h3>✅ React Hooks</h3>
              <p>useWebSocket, useNotifications, useLiveMatch, useLiveQueue, useActivityFeed, usePlayerStatus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
