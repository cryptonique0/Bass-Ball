/**
 * Streaming Integration System
 * 
 * Handles live streaming to Twitch/YouTube, stream management,
 * viewer tracking, chat integration, and creator monetization.
 */

// Types
export interface StreamPlatform {
  id: 'twitch' | 'youtube' | 'custom';
  name: string;
  baseUrl: string;
  oauthUrl: string;
}

export interface StreamAccount {
  id: string;
  userId: string;
  platform: StreamPlatform['id'];
  accessToken: string;
  refreshToken: string;
  channelId: string;
  channelName: string;
  isConnected: boolean;
  connectedAt: number;
  followerCount: number;
  subscriberCount: number;
}

export interface LiveStream {
  id: string;
  userId: string;
  account: StreamAccount;
  title: string;
  description: string;
  game: string;
  status: 'offline' | 'live' | 'scheduled' | 'ended';
  startTime: number;
  endTime?: number;
  viewers: number;
  peakViewers: number;
  streamUrl: string;
  thumbnailUrl: string;
  duration: number;
  bitrate: number;
  resolution: string;
  fps: number;
  tags: string[];
  mature: boolean;
  language: string;
}

export interface StreamViewer {
  id: string;
  username: string;
  userId: string;
  joinedAt: number;
  watchDuration: number;
  isFollower: boolean;
  isSubscriber: boolean;
  isModerator: boolean;
  messageCount: number;
  lastSeen: number;
}

export interface StreamChat {
  id: string;
  streamId: string;
  messages: StreamMessage[];
  moderators: string[];
  bannedUsers: string[];
  slowMode: number;
  emoteOnly: boolean;
  followersOnly: boolean;
  subscribersOnly: boolean;
}

export interface StreamMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  color?: string;
  emotes: string[];
  badges: string[];
  highlighted: boolean;
  isPinned: boolean;
  userLevel: 'viewer' | 'mod' | 'subscriber' | 'broadcaster';
}

export interface StreamEvent {
  id: string;
  streamId: string;
  type: 'follow' | 'subscribe' | 'donation' | 'host' | 'raid' | 'cheer' | 'achievement' | 'milestone';
  userId: string;
  username: string;
  data: Record<string, any>;
  timestamp: number;
  displayAlert: boolean;
}

export interface StreamAnalytics {
  streamId: string;
  startTime: number;
  endTime?: number;
  totalViewers: number;
  peakViewers: number;
  averageViewers: number;
  totalWatchTime: number;
  uniqueViewers: number;
  newFollowers: number;
  newSubscribers: number;
  totalDonations: number;
  totalEngagement: number;
  avgChatMessagesPerMinute: number;
  topCountries: Array<{ country: string; viewers: number }>;
  topDevices: Array<{ device: string; viewers: number }>;
  retention: number[];
}

export interface StreamSettings {
  userId: string;
  streamTitle: string;
  streamGame: string;
  streamLanguage: string;
  mature: boolean;
  autoHost: boolean;
  autoRaid: boolean;
  slowMode: number;
  emoteOnly: boolean;
  followersOnly: boolean;
  subscribersOnly: boolean;
  moderators: string[];
  bannedWords: string[];
  allowedCommands: string[];
}

export interface StreamNotification {
  id: string;
  streamId: string;
  type: 'stream_start' | 'stream_end' | 'milestone' | 'event' | 'alert';
  title: string;
  message: string;
  timestamp: number;
  isRead: boolean;
  actions?: Array<{ label: string; action: string }>;
}

// Streaming Integration Service
export class StreamingIntegrationService {
  private accounts: Map<string, StreamAccount> = new Map();
  private liveStreams: Map<string, LiveStream> = new Map();
  private viewers: Map<string, Map<string, StreamViewer>> = new Map();
  private chats: Map<string, StreamChat> = new Map();
  private events: Map<string, StreamEvent[]> = new Map();
  private analytics: Map<string, StreamAnalytics> = new Map();
  private settings: Map<string, StreamSettings> = new Map();
  private notifications: Map<string, StreamNotification[]> = new Map();

  // Platform configurations
  private platforms: Map<string, StreamPlatform> = new Map([
    ['twitch', {
      id: 'twitch',
      name: 'Twitch',
      baseUrl: 'https://twitch.tv',
      oauthUrl: 'https://id.twitch.tv/oauth2/authorize'
    }],
    ['youtube', {
      id: 'youtube',
      name: 'YouTube',
      baseUrl: 'https://youtube.com',
      oauthUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
    }]
  ]);

  constructor() {
    this.loadFromStorage();
  }

  // Account Management
  connectAccount(userId: string, platform: StreamPlatform['id'], accessToken: string, channelData: any): StreamAccount {
    const account: StreamAccount = {
      id: `account_${userId}_${platform}_${Date.now()}`,
      userId,
      platform,
      accessToken,
      refreshToken: '',
      channelId: channelData.channelId,
      channelName: channelData.channelName,
      isConnected: true,
      connectedAt: Date.now(),
      followerCount: channelData.followerCount || 0,
      subscriberCount: channelData.subscriberCount || 0
    };

    this.accounts.set(account.id, account);
    this.saveToStorage();
    return account;
  }

  getAccounts(userId: string): StreamAccount[] {
    return Array.from(this.accounts.values()).filter(a => a.userId === userId);
  }

  getAccount(accountId: string): StreamAccount | undefined {
    return this.accounts.get(accountId);
  }

  disconnectAccount(accountId: string): boolean {
    return this.accounts.delete(accountId);
  }

  updateAccountStats(accountId: string, followerCount: number, subscriberCount: number): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.followerCount = followerCount;
      account.subscriberCount = subscriberCount;
      this.saveToStorage();
    }
  }

  // Stream Management
  startStream(userId: string, accountId: string, streamData: Partial<LiveStream>): LiveStream {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error('Account not found');

    const stream: LiveStream = {
      id: `stream_${userId}_${Date.now()}`,
      userId,
      account,
      title: streamData.title || 'Bass Ball Gameplay',
      description: streamData.description || '',
      game: streamData.game || 'Bass Ball',
      status: 'live',
      startTime: Date.now(),
      viewers: 0,
      peakViewers: 0,
      streamUrl: `${account.platform === 'twitch' ? 'https://twitch.tv' : 'https://youtube.com'}/${account.channelName}`,
      thumbnailUrl: '',
      duration: 0,
      bitrate: streamData.bitrate || 6000,
      resolution: streamData.resolution || '1080p',
      fps: streamData.fps || 60,
      tags: streamData.tags || ['gaming', 'esports', 'bassball'],
      mature: streamData.mature || false,
      language: streamData.language || 'en'
    };

    this.liveStreams.set(stream.id, stream);
    this.viewers.set(stream.id, new Map());
    this.chats.set(stream.id, {
      id: `chat_${stream.id}`,
      streamId: stream.id,
      messages: [],
      moderators: [userId],
      bannedUsers: [],
      slowMode: 0,
      emoteOnly: false,
      followersOnly: false,
      subscribersOnly: false
    });
    this.events.set(stream.id, []);
    this.analytics.set(stream.id, {
      streamId: stream.id,
      startTime: stream.startTime,
      totalViewers: 0,
      peakViewers: 0,
      averageViewers: 0,
      totalWatchTime: 0,
      uniqueViewers: 0,
      newFollowers: 0,
      newSubscribers: 0,
      totalDonations: 0,
      totalEngagement: 0,
      avgChatMessagesPerMinute: 0,
      topCountries: [],
      topDevices: [],
      retention: []
    });

    this.addNotification(userId, {
      type: 'stream_start',
      title: `${stream.title}`,
      message: `You are now live on ${account.platform}!`
    });

    this.saveToStorage();
    return stream;
  }

  endStream(streamId: string): LiveStream | undefined {
    const stream = this.liveStreams.get(streamId);
    if (!stream) return undefined;

    stream.status = 'ended';
    stream.endTime = Date.now();
    stream.duration = Math.floor((stream.endTime - stream.startTime) / 1000);

    const analytics = this.analytics.get(streamId);
    if (analytics) {
      analytics.endTime = stream.endTime;
    }

    this.addNotification(stream.userId, {
      type: 'stream_end',
      title: `Stream ended`,
      message: `You streamed for ${Math.floor(stream.duration / 60)} minutes`
    });

    this.saveToStorage();
    return stream;
  }

  getStream(streamId: string): LiveStream | undefined {
    return this.liveStreams.get(streamId);
  }

  getLiveStreams(userId: string): LiveStream[] {
    return Array.from(this.liveStreams.values()).filter(s => s.userId === userId && s.status === 'live');
  }

  getAllStreams(userId: string): LiveStream[] {
    return Array.from(this.liveStreams.values()).filter(s => s.userId === userId);
  }

  updateStreamViewers(streamId: string, viewers: number): void {
    const stream = this.liveStreams.get(streamId);
    if (stream) {
      stream.viewers = viewers;
      stream.peakViewers = Math.max(stream.peakViewers, viewers);

      const analytics = this.analytics.get(streamId);
      if (analytics) {
        analytics.peakViewers = Math.max(analytics.peakViewers, viewers);
        analytics.totalViewers += viewers;
        analytics.averageViewers = analytics.totalViewers / Math.max(1, Date.now() - stream.startTime);
      }

      this.saveToStorage();
    }
  }

  // Viewer Management
  addViewer(streamId: string, viewerData: Partial<StreamViewer>): StreamViewer {
    const streamViewers = this.viewers.get(streamId) || new Map();
    
    const viewer: StreamViewer = {
      id: viewerData.id || `viewer_${streamId}_${Date.now()}`,
      username: viewerData.username || 'Anonymous',
      userId: viewerData.userId || '',
      joinedAt: Date.now(),
      watchDuration: 0,
      isFollower: viewerData.isFollower || false,
      isSubscriber: viewerData.isSubscriber || false,
      isModerator: viewerData.isModerator || false,
      messageCount: 0,
      lastSeen: Date.now()
    };

    streamViewers.set(viewer.id, viewer);
    this.viewers.set(streamId, streamViewers);

    const stream = this.liveStreams.get(streamId);
    if (stream) {
      stream.viewers++;
    }

    this.saveToStorage();
    return viewer;
  }

  removeViewer(streamId: string, viewerId: string): boolean {
    const streamViewers = this.viewers.get(streamId);
    if (streamViewers) {
      const removed = streamViewers.delete(viewerId);
      const stream = this.liveStreams.get(streamId);
      if (stream && removed) {
        stream.viewers = Math.max(0, stream.viewers - 1);
        this.saveToStorage();
      }
      return removed;
    }
    return false;
  }

  getViewers(streamId: string): StreamViewer[] {
    return Array.from(this.viewers.get(streamId)?.values() || []);
  }

  getViewerCount(streamId: string): number {
    const stream = this.liveStreams.get(streamId);
    return stream?.viewers || 0;
  }

  // Chat Management
  sendChatMessage(streamId: string, message: StreamMessage): void {
    const chat = this.chats.get(streamId);
    if (chat) {
      chat.messages.push(message);
      // Keep last 1000 messages
      if (chat.messages.length > 1000) {
        chat.messages = chat.messages.slice(-1000);
      }

      const analytics = this.analytics.get(streamId);
      if (analytics) {
        analytics.avgChatMessagesPerMinute = chat.messages.length / Math.max(1, (Date.now() - this.liveStreams.get(streamId)!.startTime) / 60000);
      }

      this.saveToStorage();
    }
  }

  getChatMessages(streamId: string, limit: number = 50): StreamMessage[] {
    const chat = this.chats.get(streamId);
    if (!chat) return [];
    return chat.messages.slice(-limit);
  }

  banUser(streamId: string, userId: string): void {
    const chat = this.chats.get(streamId);
    if (chat && !chat.bannedUsers.includes(userId)) {
      chat.bannedUsers.push(userId);
      this.saveToStorage();
    }
  }

  unbanUser(streamId: string, userId: string): void {
    const chat = this.chats.get(streamId);
    if (chat) {
      chat.bannedUsers = chat.bannedUsers.filter(id => id !== userId);
      this.saveToStorage();
    }
  }

  updateChatSettings(streamId: string, settings: Partial<StreamChat>): void {
    const chat = this.chats.get(streamId);
    if (chat) {
      Object.assign(chat, settings);
      this.saveToStorage();
    }
  }

  // Stream Events
  addEvent(streamId: string, eventData: Partial<StreamEvent>): StreamEvent {
    const event: StreamEvent = {
      id: `event_${streamId}_${Date.now()}`,
      streamId,
      type: eventData.type || 'follow',
      userId: eventData.userId || '',
      username: eventData.username || 'User',
      data: eventData.data || {},
      timestamp: Date.now(),
      displayAlert: eventData.displayAlert !== false
    };

    const events = this.events.get(streamId) || [];
    events.push(event);
    this.events.set(streamId, events);

    // Update analytics based on event type
    const analytics = this.analytics.get(streamId);
    if (analytics) {
      if (event.type === 'follow') analytics.newFollowers++;
      if (event.type === 'subscribe') analytics.newSubscribers++;
      if (event.type === 'donation') analytics.totalDonations += event.data.amount || 0;
    }

    this.saveToStorage();
    return event;
  }

  getEvents(streamId: string): StreamEvent[] {
    return this.events.get(streamId) || [];
  }

  getEventsByType(streamId: string, type: StreamEvent['type']): StreamEvent[] {
    return (this.events.get(streamId) || []).filter(e => e.type === type);
  }

  // Analytics
  getAnalytics(streamId: string): StreamAnalytics | undefined {
    return this.analytics.get(streamId);
  }

  updateAnalytics(streamId: string, updates: Partial<StreamAnalytics>): void {
    const analytics = this.analytics.get(streamId);
    if (analytics) {
      Object.assign(analytics, updates);
      this.saveToStorage();
    }
  }

  // Settings
  updateStreamSettings(userId: string, settings: Partial<StreamSettings>): StreamSettings {
    let streamSettings = this.settings.get(userId) || {
      userId,
      streamTitle: 'Bass Ball Gameplay',
      streamGame: 'Bass Ball',
      streamLanguage: 'en',
      mature: false,
      autoHost: false,
      autoRaid: false,
      slowMode: 0,
      emoteOnly: false,
      followersOnly: false,
      subscribersOnly: false,
      moderators: [],
      bannedWords: [],
      allowedCommands: []
    };

    Object.assign(streamSettings, settings);
    this.settings.set(userId, streamSettings);
    this.saveToStorage();
    return streamSettings;
  }

  getStreamSettings(userId: string): StreamSettings {
    return this.settings.get(userId) || {
      userId,
      streamTitle: 'Bass Ball Gameplay',
      streamGame: 'Bass Ball',
      streamLanguage: 'en',
      mature: false,
      autoHost: false,
      autoRaid: false,
      slowMode: 0,
      emoteOnly: false,
      followersOnly: false,
      subscribersOnly: false,
      moderators: [],
      bannedWords: [],
      allowedCommands: []
    };
  }

  // Notifications
  addNotification(userId: string, notifData: Partial<StreamNotification>): StreamNotification {
    const notification: StreamNotification = {
      id: `notif_${userId}_${Date.now()}`,
      streamId: notifData.streamId || '',
      type: notifData.type || 'stream_start',
      title: notifData.title || '',
      message: notifData.message || '',
      timestamp: Date.now(),
      isRead: false,
      actions: notifData.actions
    };

    const notifications = this.notifications.get(userId) || [];
    notifications.push(notification);
    this.notifications.set(userId, notifications);
    this.saveToStorage();
    return notification;
  }

  getNotifications(userId: string): StreamNotification[] {
    return this.notifications.get(userId) || [];
  }

  markNotificationAsRead(userId: string, notificationId: string): void {
    const notifications = this.notifications.get(userId) || [];
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveToStorage();
    }
  }

  clearNotifications(userId: string): void {
    this.notifications.delete(userId);
    this.saveToStorage();
  }

  // Storage Management
  private saveToStorage(): void {
    try {
      const data = {
        accounts: Array.from(this.accounts.entries()),
        liveStreams: Array.from(this.liveStreams.entries()),
        viewers: Array.from(this.viewers.entries()).map(([k, v]) => [k, Array.from(v.entries())]),
        chats: Array.from(this.chats.entries()),
        events: Array.from(this.events.entries()),
        analytics: Array.from(this.analytics.entries()),
        settings: Array.from(this.settings.entries()),
        notifications: Array.from(this.notifications.entries())
      };
      localStorage.setItem('streamingSystem:global', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving streaming data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('streamingSystem:global') || '{}');
      if (data.accounts) this.accounts = new Map(data.accounts);
      if (data.liveStreams) this.liveStreams = new Map(data.liveStreams);
      if (data.viewers) {
        this.viewers = new Map(data.viewers.map((entry: any) => [entry[0], new Map(entry[1])]));
      }
      if (data.chats) this.chats = new Map(data.chats);
      if (data.events) this.events = new Map(data.events);
      if (data.analytics) this.analytics = new Map(data.analytics);
      if (data.settings) this.settings = new Map(data.settings);
      if (data.notifications) this.notifications = new Map(data.notifications);
    } catch (error) {
      console.error('Error loading streaming data:', error);
    }
  }

  // Helper Methods
  getStats(userId: string) {
    const userStreams = this.getAllStreams(userId);
    const totalViewTime = userStreams.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalViewers = userStreams.reduce((sum, s) => sum + s.viewers, 0);
    const avgViewers = userStreams.length > 0 ? Math.floor(totalViewers / userStreams.length) : 0;

    return {
      totalStreams: userStreams.length,
      liveStreams: this.getLiveStreams(userId).length,
      totalViewTime,
      totalViewers,
      avgViewers,
      accounts: this.getAccounts(userId).length
    };
  }

  getPlatforms(): StreamPlatform[] {
    return Array.from(this.platforms.values());
  }

  getPlatform(platformId: string): StreamPlatform | undefined {
    return this.platforms.get(platformId);
  }
}

// Export singleton instance
export const streamingService = new StreamingIntegrationService();
