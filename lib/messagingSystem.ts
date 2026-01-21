/**
 * Advanced Messaging System
 * Direct messages, group chats, team communication
 * @version 1.0.0
 */

export type MessageType = 'direct' | 'group' | 'team' | 'system' | 'announcement';
export type ChatStatus = 'online' | 'offline' | 'away' | 'in_match';

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId?: string; // For direct messages
  chatId?: string; // For group/team chats
  type: MessageType;
  content: string;
  timestamp: Date;
  edited?: Date;
  deleted?: boolean;
  reactions: { emoji: string; userIds: string[] }[];
  attachments: MessageAttachment[];
  mentions: string[]; // User IDs mentioned
  isRead: boolean;
  readAt?: Date;
}

export interface MessageAttachment {
  id: string;
  url: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'file' | 'clip';
}

export interface DirectMessageThread {
  id: string;
  participants: string[];
  messages: Message[];
  lastMessage?: Message;
  lastMessageTime: Date;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
  blockedBy?: string[]; // Users blocking this thread
}

export interface GroupChat {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  createdBy: string;
  members: string[];
  maxMembers: number;
  messages: Message[];
  settings: {
    isPrivate: boolean;
    allowInvites: boolean;
    allowReactions: boolean;
    approvalRequired: boolean;
  };
  joinRequests: { userId: string; requestedAt: Date }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamChat extends GroupChat {
  teamId: string;
  channels: TeamChannel[];
  roles: TeamRole[];
  permissions: TeamPermission[];
}

export interface TeamChannel {
  id: string;
  name: string;
  description: string;
  topic: string;
  isPrivate: boolean;
  messages: Message[];
  createdAt: Date;
}

export interface TeamRole {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  priority: number;
}

export interface TeamPermission {
  roleId: string;
  action: 'send_message' | 'delete_message' | 'manage_members' | 'manage_channels' | 'manage_roles';
  allowed: boolean;
}

export interface UserPresence {
  userId: string;
  status: ChatStatus;
  lastSeen: Date;
  currentMatch?: string;
}

export interface ChatNotification {
  id: string;
  userId: string;
  type: 'new_message' | 'mention' | 'invite' | 'joined' | 'left' | 'removed';
  from: string;
  chatId: string;
  message?: string;
  read: boolean;
  createdAt: Date;
}

export interface MessageStats {
  totalMessages: number;
  directThreads: number;
  groupChats: number;
  teamChats: number;
  activeChats: number;
  unreadMessages: number;
  lastMessageTime: Date;
}

/**
 * Messaging System
 * Core messaging functionality
 */
export const messagingSystem = {
  // Storage key
  _storageKey: 'messagingSystem',

  // Initialize system
  initialize(userId: string): void {
    const existing = this.getUserData(userId);
    if (!existing) {
      const data = {
        userId,
        directThreads: {},
        groupChats: [],
        teamChats: [],
        notifications: [],
        blockedUsers: [],
        mutedChats: [],
        presence: { status: 'online' as ChatStatus, lastSeen: new Date() },
        createdAt: new Date(),
      };
      localStorage.setItem(`${this._storageKey}:${userId}`, JSON.stringify(data));
    }
  },

  // Get user messaging data
  getUserData(userId: string) {
    const data = localStorage.getItem(`${this._storageKey}:${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // Save user data
  _saveUserData(userId: string, data: any): void {
    localStorage.setItem(`${this._storageKey}:${userId}`, JSON.stringify(data));
  },

  /**
   * Direct Messaging
   */

  // Create or get direct message thread
  createDirectThread(userId: string, otherId: string): DirectMessageThread {
    this.initialize(userId);
    const userData = this.getUserData(userId);

    const threadKey = [userId, otherId].sort().join(':');
    if (userData.directThreads[threadKey]) {
      return userData.directThreads[threadKey];
    }

    const thread: DirectMessageThread = {
      id: `dm_${threadKey}`,
      participants: [userId, otherId],
      messages: [],
      lastMessageTime: new Date(),
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    };

    userData.directThreads[threadKey] = thread;
    this._saveUserData(userId, userData);
    return thread;
  },

  // Send direct message
  sendDirectMessage(
    senderId: string,
    recipientId: string,
    content: string,
    attachments: MessageAttachment[] = [],
    mentions: string[] = []
  ): Message {
    const thread = this.createDirectThread(senderId, recipientId);
    const userData = this.getUserData(senderId);

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: `User ${senderId.slice(0, 8)}`,
      recipientId,
      type: 'direct',
      content,
      timestamp: new Date(),
      reactions: [],
      attachments,
      mentions,
      isRead: false,
    };

    thread.messages.push(message);
    thread.lastMessage = message;
    thread.lastMessageTime = new Date();

    const threadKey = [senderId, recipientId].sort().join(':');
    userData.directThreads[threadKey] = thread;
    this._saveUserData(senderId, userData);

    // Increment unread count for recipient
    const recipientData = this.getUserData(recipientId);
    if (recipientData) {
      const recipientThread = recipientData.directThreads[threadKey];
      if (recipientThread) {
        recipientThread.unreadCount++;
        this._saveUserData(recipientId, recipientData);
      }
    }

    return message;
  },

  // Read direct message
  readDirectMessage(userId: string, messageId: string, threadId: string): void {
    const userData = this.getUserData(userId);
    if (!userData) return;

    for (const thread of Object.values(userData.directThreads) as DirectMessageThread[]) {
      const msg = thread.messages.find((m) => m.id === messageId);
      if (msg) {
        msg.isRead = true;
        msg.readAt = new Date();
        thread.unreadCount = Math.max(0, thread.unreadCount - 1);
        this._saveUserData(userId, userData);
        return;
      }
    }
  },

  // Get direct threads
  getDirectThreads(userId: string): DirectMessageThread[] {
    this.initialize(userId);
    const userData = this.getUserData(userId);
    return Object.values(userData.directThreads as { [key: string]: DirectMessageThread }).sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  },

  // Block user
  blockUser(userId: string, blockedId: string): void {
    const userData = this.getUserData(userId);
    if (!userData.blockedUsers.includes(blockedId)) {
      userData.blockedUsers.push(blockedId);
      this._saveUserData(userId, userData);
    }
  },

  // Unblock user
  unblockUser(userId: string, blockedId: string): void {
    const userData = this.getUserData(userId);
    userData.blockedUsers = userData.blockedUsers.filter((id: string) => id !== blockedId);
    this._saveUserData(userId, userData);
  },

  /**
   * Group Chats
   */

  // Create group chat
  createGroupChat(
    userId: string,
    name: string,
    description: string = '',
    isPrivate: boolean = false
  ): GroupChat {
    this.initialize(userId);
    const userData = this.getUserData(userId);

    const chat: GroupChat = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdBy: userId,
      members: [userId],
      maxMembers: 200,
      messages: [],
      settings: {
        isPrivate,
        allowInvites: true,
        allowReactions: true,
        approvalRequired: isPrivate,
      },
      joinRequests: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userData.groupChats.push(chat);
    this._saveUserData(userId, userData);
    return chat;
  },

  // Send group message
  sendGroupMessage(
    senderId: string,
    chatId: string,
    content: string,
    attachments: MessageAttachment[] = [],
    mentions: string[] = []
  ): Message | null {
    const userData = this.getUserData(senderId);
    const chat = userData.groupChats.find((c: GroupChat) => c.id === chatId);

    if (!chat || !chat.members.includes(senderId)) {
      return null;
    }

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: `User ${senderId.slice(0, 8)}`,
      chatId,
      type: 'group',
      content,
      timestamp: new Date(),
      reactions: [],
      attachments,
      mentions,
      isRead: true,
    };

    chat.messages.push(message);
    chat.updatedAt = new Date();
    this._saveUserData(senderId, userData);

    return message;
  },

  // Join group chat
  joinGroupChat(userId: string, chatId: string): boolean {
    const userData = this.getUserData(userId);
    const chat = userData.groupChats.find((c: GroupChat) => c.id === chatId);

    if (!chat) return false;

    if (chat.members.includes(userId)) return true; // Already member

    if (chat.settings.approvalRequired && !chat.settings.isPrivate === false) {
      chat.joinRequests.push({ userId, requestedAt: new Date() });
    } else {
      chat.members.push(userId);
    }

    chat.updatedAt = new Date();
    this._saveUserData(userId, userData);
    return true;
  },

  // Approve join request
  approveJoinRequest(userId: string, chatId: string, requesterId: string): boolean {
    const userData = this.getUserData(userId);
    const chat = userData.groupChats.find((c: GroupChat) => c.id === chatId);

    if (!chat || chat.createdBy !== userId) return false;

    const requestIndex = chat.joinRequests.findIndex((r) => r.userId === requesterId);
    if (requestIndex === -1) return false;

    chat.joinRequests.splice(requestIndex, 1);
    if (!chat.members.includes(requesterId)) {
      chat.members.push(requesterId);
    }

    chat.updatedAt = new Date();
    this._saveUserData(userId, userData);
    return true;
  },

  // Get group chats
  getGroupChats(userId: string): GroupChat[] {
    this.initialize(userId);
    const userData = this.getUserData(userId);
    return userData.groupChats.filter((c: GroupChat) => c.members.includes(userId));
  },

  /**
   * Team Chats
   */

  // Create team chat
  createTeamChat(
    userId: string,
    teamId: string,
    teamName: string,
    memberIds: string[]
  ): TeamChat {
    this.initialize(userId);
    const userData = this.getUserData(userId);

    const teamChat: TeamChat = {
      id: `team_${teamId}_${Date.now()}`,
      teamId,
      name: teamName,
      description: `Team chat for ${teamName}`,
      createdBy: userId,
      members: memberIds,
      maxMembers: 50,
      messages: [],
      settings: {
        isPrivate: true,
        allowInvites: false,
        allowReactions: true,
        approvalRequired: false,
      },
      joinRequests: [],
      channels: [
        {
          id: `channel_general`,
          name: 'general',
          description: 'General team discussion',
          topic: '',
          isPrivate: false,
          messages: [],
          createdAt: new Date(),
        },
        {
          id: `channel_strategy`,
          name: 'strategy',
          description: 'Team strategy discussion',
          topic: '',
          isPrivate: false,
          messages: [],
          createdAt: new Date(),
        },
      ],
      roles: [
        {
          id: 'role_owner',
          name: 'Owner',
          color: '#FF6B6B',
          permissions: ['send_message', 'delete_message', 'manage_members', 'manage_channels', 'manage_roles'],
          priority: 3,
        },
        {
          id: 'role_admin',
          name: 'Admin',
          color: '#4ECDC4',
          permissions: ['send_message', 'delete_message', 'manage_members', 'manage_channels'],
          priority: 2,
        },
        {
          id: 'role_member',
          name: 'Member',
          color: '#95E1D3',
          permissions: ['send_message'],
          priority: 1,
        },
      ],
      permissions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userData.teamChats.push(teamChat);
    this._saveUserData(userId, userData);
    return teamChat;
  },

  // Send team message
  sendTeamMessage(
    senderId: string,
    teamChatId: string,
    channelId: string,
    content: string,
    attachments: MessageAttachment[] = []
  ): Message | null {
    const userData = this.getUserData(senderId);
    const teamChat = userData.teamChats.find((t: TeamChat) => t.id === teamChatId);

    if (!teamChat || !teamChat.members.includes(senderId)) {
      return null;
    }

    const channel = teamChat.channels.find((ch) => ch.id === channelId);
    if (!channel) return null;

    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      senderId,
      senderName: `User ${senderId.slice(0, 8)}`,
      chatId: teamChatId,
      type: 'team',
      content,
      timestamp: new Date(),
      reactions: [],
      attachments,
      mentions: [],
      isRead: true,
    };

    channel.messages.push(message);
    teamChat.updatedAt = new Date();
    this._saveUserData(senderId, userData);

    return message;
  },

  // Get team chats
  getTeamChats(userId: string): TeamChat[] {
    this.initialize(userId);
    const userData = this.getUserData(userId);
    return userData.teamChats.filter((t: TeamChat) => t.members.includes(userId));
  },

  /**
   * Reactions
   */

  // Add reaction to message
  addReaction(userId: string, messageId: string, emoji: string, chatId: string): void {
    const userData = this.getUserData(userId);

    const findAndReact = (messages: Message[]) => {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) {
        const reaction = msg.reactions.find((r) => r.emoji === emoji);
        if (reaction) {
          if (!reaction.userIds.includes(userId)) {
            reaction.userIds.push(userId);
          }
        } else {
          msg.reactions.push({ emoji, userIds: [userId] });
        }
      }
    };

    // Search in group chats
    for (const chat of userData.groupChats) {
      if (chat.id === chatId) {
        findAndReact(chat.messages);
        this._saveUserData(userId, userData);
        return;
      }
    }

    // Search in team chats
    for (const teamChat of userData.teamChats) {
      if (teamChat.id === chatId) {
        for (const channel of teamChat.channels) {
          findAndReact(channel.messages);
        }
        this._saveUserData(userId, userData);
        return;
      }
    }

    // Search in direct threads
    for (const thread of Object.values(userData.directThreads) as DirectMessageThread[]) {
      findAndReact(thread.messages);
    }

    this._saveUserData(userId, userData);
  },

  /**
   * Notifications
   */

  // Add notification
  addNotification(
    userId: string,
    type: 'new_message' | 'mention' | 'invite' | 'joined' | 'left' | 'removed',
    from: string,
    chatId: string,
    message?: string
  ): ChatNotification {
    this.initialize(userId);
    const userData = this.getUserData(userId);

    const notification: ChatNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      from,
      chatId,
      message,
      read: false,
      createdAt: new Date(),
    };

    userData.notifications.push(notification);
    this._saveUserData(userId, userData);
    return notification;
  },

  // Get unread notifications
  getUnreadNotifications(userId: string): ChatNotification[] {
    this.initialize(userId);
    const userData = this.getUserData(userId);
    return userData.notifications.filter((n: ChatNotification) => !n.read);
  },

  /**
   * Presence
   */

  // Update user presence
  updatePresence(userId: string, status: ChatStatus, currentMatch?: string): void {
    this.initialize(userId);
    const userData = this.getUserData(userId);
    userData.presence = {
      status,
      lastSeen: new Date(),
      currentMatch,
    };
    this._saveUserData(userId, userData);
  },

  /**
   * Statistics
   */

  // Get messaging stats
  getStats(userId: string): MessageStats {
    this.initialize(userId);
    const userData = this.getUserData(userId);

    const directThreads = Object.values(userData.directThreads as { [key: string]: DirectMessageThread });
    const totalDirect = directThreads.reduce((sum, t) => sum + t.messages.length, 0);
    const totalGroup = userData.groupChats.reduce((sum: number, c: GroupChat) => sum + c.messages.length, 0);
    const totalTeam = userData.teamChats.reduce((sum: number, t: TeamChat) => sum + t.channels.reduce((s, ch) => s + ch.messages.length, 0), 0);

    return {
      totalMessages: totalDirect + totalGroup + totalTeam,
      directThreads: directThreads.length,
      groupChats: userData.groupChats.length,
      teamChats: userData.teamChats.length,
      activeChats: (directThreads.filter((t) => !t.isMuted).length +
        userData.groupChats.filter((c: GroupChat) => !userData.mutedChats.includes(c.id)).length +
        userData.teamChats.filter((t: TeamChat) => !userData.mutedChats.includes(t.id)).length) as number,
      unreadMessages: directThreads.reduce((sum, t) => sum + t.unreadCount, 0) as number,
      lastMessageTime: directThreads[0]?.lastMessageTime || new Date(),
    };
  },
};
