'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import WebSocketService, { EventType, WebSocketEvent } from '@/services/websocket-service';
import { NotificationService, Notification, NotificationStats } from '@/services/notifications';

/**
 * Hook for WebSocket connection
 */
export const useWebSocket = (autoConnect: boolean = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    if (!autoConnect) return;

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleError = (event: WebSocketEvent) => {
      setError(event.data?.error || 'Connection error');
    };

    const handleReconnect = (event: WebSocketEvent) => {
      setIsConnecting(true);
    };

    wsService.current.on('connection:ready', handleConnect);
    wsService.current.on('connection:error', handleError);
    wsService.current.on('connection:reconnect', handleReconnect);

    wsService.current.connect().catch((err) => {
      setError(err.message);
      setIsConnecting(false);
    });

    return () => {
      // Cleanup would go here
    };
  }, [autoConnect]);

  return {
    isConnected,
    isConnecting,
    error,
    service: wsService.current,
  };
};

/**
 * Hook for listening to WebSocket events
 */
export const useWebSocketEvent = (eventType: EventType, callback?: (event: WebSocketEvent) => void) => {
  const [lastEvent, setLastEvent] = useState<WebSocketEvent | null>(null);
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    const handleEvent = (event: WebSocketEvent) => {
      setLastEvent(event);
      callback?.(event);
    };

    const unsubscribe = wsService.current.on(eventType, handleEvent);
    return unsubscribe;
  }, [eventType, callback]);

  return lastEvent;
};

/**
 * Hook for channel subscription
 */
export const useWebSocketChannel = (channel: string) => {
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    wsService.current.subscribe(channel);

    return () => {
      wsService.current.unsubscribe(channel);
    };
  }, [channel]);

  return wsService.current;
};

/**
 * Hook for real-time notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    byType: {} as any,
    byPriority: {} as any,
  });
  const notificationService = useRef(NotificationService);

  useEffect(() => {
    // Load initial notifications
    const initial = notificationService.current.getNotifications({ limit: 50 });
    setNotifications(initial);

    const stats = notificationService.current.getStats();
    setStats(stats);

    // Subscribe to new notifications
    const unsubscribe = notificationService.current.onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      const updatedStats = notificationService.current.getStats();
      setStats(updatedStats);
    });

    // Subscribe to stats changes
    const unsubscribeStats = notificationService.current.onStatsChange((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubscribe();
      unsubscribeStats();
    };
  }, []);

  const addNotification = useCallback(
    (type: any, title: string, message: string, options?: any) => {
      return notificationService.current.addNotification(type, title, message, options);
    },
    []
  );

  const markAsRead = useCallback((notificationId: string) => {
    notificationService.current.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.current.markAllAsRead();
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    notificationService.current.deleteNotification(notificationId);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.current.clearAll();
  }, []);

  return {
    notifications,
    stats,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
};

/**
 * Hook for live match updates
 */
export const useLiveMatch = (matchId: string) => {
  const [matchData, setMatchData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    const channel = `match:${matchId}`;
    wsService.current.subscribe(channel);

    const unsubscribe = wsService.current.on('match:update', (event) => {
      setMatchData(event.data);
    });

    const unsubscribeGoal = wsService.current.on('match:goal', (event) => {
      setEvents((prev) => [{ type: 'goal', ...event.data }, ...prev]);
    });

    const unsubscribeCard = wsService.current.on('match:card', (event) => {
      setEvents((prev) => [{ type: 'card', ...event.data }, ...prev]);
    });

    const unsubscribeSub = wsService.current.on('match:substitution', (event) => {
      setEvents((prev) => [{ type: 'substitution', ...event.data }, ...prev]);
    });

    return () => {
      wsService.current.unsubscribe(channel);
      unsubscribe();
      unsubscribeGoal();
      unsubscribeCard();
      unsubscribeSub();
    };
  }, [matchId]);

  return { matchData, events };
};

/**
 * Hook for live matchmaking queue
 */
export const useLiveQueue = () => {
  const [queueStatus, setQueueStatus] = useState<any>(null);
  const [matchFound, setMatchFound] = useState(false);
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    wsService.current.subscribe('matchmaking:queue');

    const unsubscribeStatus = wsService.current.on('queue:status', (event) => {
      setQueueStatus(event.data);
    });

    const unsubscribeFound = wsService.current.on('queue:match_found', (event) => {
      setMatchFound(true);
      setQueueStatus(event.data);
    });

    return () => {
      wsService.current.unsubscribe('matchmaking:queue');
      unsubscribeStatus();
      unsubscribeFound();
    };
  }, []);

  return { queueStatus, matchFound };
};

/**
 * Hook for activity feed
 */
export const useActivityFeed = (limit: number = 20) => {
  const [activities, setActivities] = useState<any[]>([]);
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    wsService.current.subscribe('activity:feed');

    const unsubscribe = wsService.current.on('activity:new', (event) => {
      setActivities((prev) => [event.data, ...prev.slice(0, limit - 1)]);
    });

    return () => {
      wsService.current.unsubscribe('activity:feed');
      unsubscribe();
    };
  }, [limit]);

  return activities;
};

/**
 * Hook for player status changes
 */
export const usePlayerStatus = () => {
  const [onlinePlayers, setOnlinePlayers] = useState<Set<string>>(new Set());
  const wsService = useRef(WebSocketService);

  useEffect(() => {
    wsService.current.subscribe('players:status');

    const unsubscribe = wsService.current.on('player:status', (event) => {
      const { playerId, status } = event.data;

      setOnlinePlayers((prev) => {
        const updated = new Set(prev);
        if (status === 'online') {
          updated.add(playerId);
        } else {
          updated.delete(playerId);
        }
        return updated;
      });
    });

    return () => {
      wsService.current.unsubscribe('players:status');
      unsubscribe();
    };
  }, []);

  return { onlinePlayers };
};

export default {
  useWebSocket,
  useWebSocketEvent,
  useWebSocketChannel,
  useNotifications,
  useLiveMatch,
  useLiveQueue,
  useActivityFeed,
  usePlayerStatus,
};
