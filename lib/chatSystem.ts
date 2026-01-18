/**
 * In-App Chat System
 * 
 * Real-time messaging with:
 * - Direct messages (P2P)
 * - Club/clan channels
 * - Group chat
 * - Message history
 * - Moderation
 */

export type MessageType = 'text' | 'image' | 'emoji' | 'sticker' | 'system';
export type ChannelType = 'direct' | 'clan' | 'group' | 'public';

export interface ChatMessage {
  messageId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: MessageType;
  timestamp: number;
  edited: boolean;
  editedAt?: number;
  reactions: Map<string, string[]>; // emoji -> [playerIds]
  isDeleted: boolean;
  isPinned: boolean;
}

export interface ChatChannel {
  channelId: string;
  name: string;
  type: ChannelType;
  description?: string;
  createdAt: number;
  createdBy: string;
  members: Map<string, {
    playerId: string;
    joinedAt: number;
    isMuted: boolean;
    role: 'admin' | 'moderator' | 'member';
  }>;
  messages: ChatMessage[];
  maxMessages: number; // Auto-delete old messages
  isPrivate: boolean;
  isPinned: boolean;
  metadata?: Record<string, any>;
}

export interface DirectMessage {
  dmId: string;
  participant1Id: string;
  participant1Name: string;
  participant2Id: string;
  participant2Name: string;
  createdAt: number;
  lastMessageAt?: number;
  messages: ChatMessage[];
  isBlocked: boolean;
  blockedBy?: string;
}

export interface MutedUser {
  userId: string;
  channelId: string;
  mutedAt: number;
  reason?: string;
}

/**
 * Chat Manager - Manage all in-app messaging
 * Singleton pattern
 */
export class ChatManager {
  private static instance: ChatManager;
  private channels: Map<string, ChatChannel> = new Map();
  private directMessages: Map<string, DirectMessage> = new Map();
  private userChannels: Map<string, string[]> = new Map(); // userId -> channelIds
  private userDMs: Map<string, string[]> = new Map(); // userId -> dmIds
  private mutedUsers: Map<string, MutedUser[]> = new Map(); // channelId -> mutedUsers
  private blockedUsers: Map<string, string[]> = new Map(); // userId -> blockedUserIds

  private constructor() {
    this.loadFromStorage();
    this.initializeDefaultChannels();
  }

  static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  /**
   * Initialize default global channels
   */
  private initializeDefaultChannels(): void {
    // Create global announcements channel if not exists
    if (!Array.from(this.channels.values()).find(c => c.name === 'Announcements')) {
      this.createChannel('Announcements', 'Global announcements', 'public', 'system', undefined, true);
    }

    // Create global chat channel if not exists
    if (!Array.from(this.channels.values()).find(c => c.name === 'Global Chat')) {
      this.createChannel('Global Chat', 'Global player chat', 'public', 'system');
    }
  }

  /**
   * Create a new channel
   */
  createChannel(
    name: string,
    description: string,
    type: ChannelType,
    createdBy: string,
    metadata?: Record<string, any>,
    isPinned: boolean = false
  ): ChatChannel {
    const channelId = `channel_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const channel: ChatChannel = {
      channelId,
      name,
      type,
      description,
      createdAt: Date.now(),
      createdBy,
      members: new Map(),
      messages: [],
      maxMessages: 1000,
      isPrivate: type === 'direct' || type === 'group',
      isPinned,
      metadata,
    };

    // Add creator as admin
    channel.members.set(createdBy, {
      playerId: createdBy,
      joinedAt: Date.now(),
      isMuted: false,
      role: 'admin',
    });

    if (!this.userChannels.has(createdBy)) {
      this.userChannels.set(createdBy, []);
    }
    this.userChannels.get(createdBy)!.push(channelId);

    this.channels.set(channelId, channel);

    this.saveToStorage();
    return channel;
  }

  /**
   * Send message to channel
   */
  sendMessage(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
    type: MessageType = 'text',
    senderAvatar?: string
  ): { success: boolean; message?: ChatMessage } {
    const channel = this.channels.get(channelId);
    if (!channel) {
      return { success: false };
    }

    const member = channel.members.get(senderId);
    if (!member || member.isMuted) {
      return { success: false };
    }

    const messageId = `msg_${channelId}_${Date.now()}`;
    const message: ChatMessage = {
      messageId,
      channelId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type,
      timestamp: Date.now(),
      edited: false,
      reactions: new Map(),
      isDeleted: false,
      isPinned: false,
    };

    channel.messages.push(message);

    // Keep only last maxMessages
    if (channel.messages.length > channel.maxMessages) {
      channel.messages.shift();
    }

    channel.lastMessageAt = Date.now();

    this.saveToStorage();
    return { success: true, message };
  }

  /**
   * Edit message
   */
  editMessage(messageId: string, channelId: string, senderId: string, newContent: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const message = channel.messages.find(m => m.messageId === messageId);
    if (!message || message.senderId !== senderId) return false;

    message.content = newContent;
    message.edited = true;
    message.editedAt = Date.now();

    this.saveToStorage();
    return true;
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string, channelId: string, senderId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const message = channel.messages.find(m => m.messageId === messageId);
    if (!message || (message.senderId !== senderId && channel.members.get(senderId)?.role !== 'admin')) {
      return false;
    }

    message.isDeleted = true;
    message.content = '[deleted]';

    this.saveToStorage();
    return true;
  }

  /**
   * Add reaction to message
   */
  addReaction(messageId: string, channelId: string, emoji: string, playerId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const message = channel.messages.find(m => m.messageId === messageId);
    if (!message) return false;

    if (!message.reactions.has(emoji)) {
      message.reactions.set(emoji, []);
    }

    const reactions = message.reactions.get(emoji)!;
    if (!reactions.includes(playerId)) {
      reactions.push(playerId);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Remove reaction from message
   */
  removeReaction(messageId: string, channelId: string, emoji: string, playerId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const message = channel.messages.find(m => m.messageId === messageId);
    if (!message) return false;

    const reactions = message.reactions.get(emoji) || [];
    const index = reactions.indexOf(playerId);
    if (index > -1) {
      reactions.splice(index, 1);
      if (reactions.length === 0) {
        message.reactions.delete(emoji);
      }
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Pin message
   */
  pinMessage(messageId: string, channelId: string, adminId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const admin = channel.members.get(adminId);
    if (!admin || admin.role === 'member') return false;

    const message = channel.messages.find(m => m.messageId === messageId);
    if (!message) return false;

    message.isPinned = true;

    this.saveToStorage();
    return true;
  }

  /**
   * Start direct message
   */
  startDirectMessage(userId1: string, userName1: string, userId2: string, userName2: string): DirectMessage {
    const dmId = `dm_${[userId1, userId2].sort().join('_')}`;

    // Check if DM already exists
    const existing = this.directMessages.get(dmId);
    if (existing) return existing;

    const dm: DirectMessage = {
      dmId,
      participant1Id: userId1,
      participant1Name: userName1,
      participant2Id: userId2,
      participant2Name: userName2,
      createdAt: Date.now(),
      messages: [],
      isBlocked: false,
    };

    this.directMessages.set(dmId, dm);

    [userId1, userId2].forEach(userId => {
      if (!this.userDMs.has(userId)) {
        this.userDMs.set(userId, []);
      }
      this.userDMs.get(userId)!.push(dmId);
    });

    this.saveToStorage();
    return dm;
  }

  /**
   * Send direct message
   */
  sendDirectMessage(
    dmId: string,
    senderId: string,
    senderName: string,
    content: string,
    senderAvatar?: string
  ): { success: boolean; message?: ChatMessage } {
    const dm = this.directMessages.get(dmId);
    if (!dm || dm.isBlocked) {
      return { success: false };
    }

    const messageId = `msg_${dmId}_${Date.now()}`;
    const message: ChatMessage = {
      messageId,
      channelId: dmId,
      senderId,
      senderName,
      senderAvatar,
      content,
      type: 'text',
      timestamp: Date.now(),
      edited: false,
      reactions: new Map(),
      isDeleted: false,
      isPinned: false,
    };

    dm.messages.push(message);
    if (dm.messages.length > 500) {
      dm.messages.shift();
    }
    dm.lastMessageAt = Date.now();

    this.saveToStorage();
    return { success: true, message };
  }

  /**
   * Block user
   */
  blockUser(userId: string, blockedUserId: string): void {
    if (!this.blockedUsers.has(userId)) {
      this.blockedUsers.set(userId, []);
    }
    const blocked = this.blockedUsers.get(userId)!;
    if (!blocked.includes(blockedUserId)) {
      blocked.push(blockedUserId);
    }
    this.saveToStorage();
  }

  /**
   * Unblock user
   */
  unblockUser(userId: string, blockedUserId: string): void {
    const blocked = this.blockedUsers.get(userId) || [];
    const index = blocked.indexOf(blockedUserId);
    if (index > -1) {
      blocked.splice(index, 1);
    }
    this.saveToStorage();
  }

  /**
   * Mute user in channel
   */
  muteUser(channelId: string, userId: string, adminId: string, reason?: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const admin = channel.members.get(adminId);
    if (!admin || admin.role === 'member') return false;

    const member = channel.members.get(userId);
    if (member) {
      member.isMuted = true;
    }

    if (!this.mutedUsers.has(channelId)) {
      this.mutedUsers.set(channelId, []);
    }

    this.mutedUsers.get(channelId)!.push({
      userId,
      channelId,
      mutedAt: Date.now(),
      reason,
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Unmute user in channel
   */
  unmuteUser(channelId: string, userId: string, adminId: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const admin = channel.members.get(adminId);
    if (!admin || admin.role === 'member') return false;

    const member = channel.members.get(userId);
    if (member) {
      member.isMuted = false;
    }

    const mutedList = this.mutedUsers.get(channelId) || [];
    const index = mutedList.findIndex(m => m.userId === userId);
    if (index > -1) {
      mutedList.splice(index, 1);
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Add member to channel
   */
  addMemberToChannel(channelId: string, memberId: string, memberName: string): boolean {
    const channel = this.channels.get(channelId);
    if (!channel || channel.members.has(memberId)) return false;

    channel.members.set(memberId, {
      playerId: memberId,
      joinedAt: Date.now(),
      isMuted: false,
      role: 'member',
    });

    if (!this.userChannels.has(memberId)) {
      this.userChannels.set(memberId, []);
    }
    this.userChannels.get(memberId)!.push(channelId);

    this.saveToStorage();
    return true;
  }

  /**
   * Get user's channels
   */
  getUserChannels(userId: string): ChatChannel[] {
    const channelIds = this.userChannels.get(userId) || [];
    return channelIds
      .map(id => this.channels.get(id))
      .filter((c): c is ChatChannel => !!c);
  }

  /**
   * Get user's direct messages
   */
  getUserDirectMessages(userId: string): DirectMessage[] {
    const dmIds = this.userDMs.get(userId) || [];
    return dmIds
      .map(id => this.directMessages.get(id))
      .filter((dm): dm is DirectMessage => !!dm)
      .sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
  }

  /**
   * Get channel messages
   */
  getChannelMessages(channelId: string, limit: number = 50): ChatMessage[] {
    const channel = this.channels.get(channelId);
    if (!channel) return [];

    return channel.messages.slice(Math.max(0, channel.messages.length - limit));
  }

  /**
   * Get public channels
   */
  getPublicChannels(): ChatChannel[] {
    return Array.from(this.channels.values())
      .filter(c => c.type === 'public')
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        channels: Array.from(this.channels.entries()).map(([id, ch]) => [
          id,
          { ...ch, members: Array.from(ch.members.entries()), reactions: Array.from(ch.messages.map(m => [m.messageId, Array.from(m.reactions.entries())])) },
        ]),
        directMessages: Array.from(this.directMessages.entries()),
        userChannels: Array.from(this.userChannels.entries()),
        userDMs: Array.from(this.userDMs.entries()),
        mutedUsers: Array.from(this.mutedUsers.entries()),
        blockedUsers: Array.from(this.blockedUsers.entries()),
      };
      localStorage.setItem('chat_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save chat data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('chat_system') || '{}');
      if (data.channels) {
        this.channels = new Map(
          data.channels.map((entry: any) => [
            entry[0],
            { ...entry[1], members: new Map(entry[1].members || []), reactions: new Map() },
          ])
        );
      }
      if (data.directMessages) this.directMessages = new Map(data.directMessages);
      if (data.userChannels) this.userChannels = new Map(data.userChannels);
      if (data.userDMs) this.userDMs = new Map(data.userDMs);
      if (data.mutedUsers) this.mutedUsers = new Map(data.mutedUsers);
      if (data.blockedUsers) this.blockedUsers = new Map(data.blockedUsers);
    } catch (e) {
      console.warn('Failed to load chat data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.channels.clear();
    this.directMessages.clear();
    this.userChannels.clear();
    this.userDMs.clear();
    this.mutedUsers.clear();
    this.blockedUsers.clear();
    this.saveToStorage();
  }
}
