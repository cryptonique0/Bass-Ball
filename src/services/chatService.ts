/**
 * Team chat and communication system
 */

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  teamId: string;
  message: string;
  timestamp: number;
  edited: boolean;
  editsCount: number;
  pinned: boolean;
}

export interface TeamChat {
  teamId: string;
  messages: ChatMessage[];
  pinnedMessages: Set<string>;
  muteList: Set<string>;
}

export class ChatService {
  private chats: Map<string, TeamChat> = new Map();
  private messageNotifications: Map<string, ChatMessage[]> = new Map();

  /**
   * Create team chat
   */
  createTeamChat(teamId: string): TeamChat {
    const chatObj: TeamChat = {
      teamId,
      messages: [],
      pinnedMessages: new Set(),
      muteList: new Set(),
    };

    this.chats.set(teamId, chatObj);
    return chatObj;
  }

  /**
   * Send message
   */
  sendMessage(
    teamId: string,
    userId: string,
    userName: string,
    message: string
  ): ChatMessage {
    let chat = this.chats.get(teamId);
    if (!chat) {
      chat = this.createTeamChat(teamId);
    }

    const chatMessage: ChatMessage = {
      id: `msg-${teamId}-${Date.now()}`,
      userId,
      userName,
      teamId,
      message,
      timestamp: Date.now(),
      edited: false,
      editsCount: 0,
      pinned: false,
    };

    chat.messages.push(chatMessage);

    // Notify other users
    if (!this.messageNotifications.has(teamId)) {
      this.messageNotifications.set(teamId, []);
    }
    this.messageNotifications.get(teamId)!.push(chatMessage);

    // Keep only last 1000 messages
    if (chat.messages.length > 1000) {
      chat.messages.shift();
    }

    return chatMessage;
  }

  /**
   * Edit message
   */
  editMessage(teamId: string, messageId: string, newMessage: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    const message = chat.messages.find((m) => m.id === messageId);
    if (!message) return false;

    message.message = newMessage;
    message.edited = true;
    message.editsCount++;
    return true;
  }

  /**
   * Delete message
   */
  deleteMessage(teamId: string, messageId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    const index = chat.messages.findIndex((m) => m.id === messageId);
    if (index === -1) return false;

    chat.messages.splice(index, 1);
    return true;
  }

  /**
   * Pin message
   */
  pinMessage(teamId: string, messageId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    const message = chat.messages.find((m) => m.id === messageId);
    if (!message) return false;

    message.pinned = true;
    chat.pinnedMessages.add(messageId);
    return true;
  }

  /**
   * Unpin message
   */
  unpinMessage(teamId: string, messageId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    const message = chat.messages.find((m) => m.id === messageId);
    if (message) {
      message.pinned = false;
    }

    return chat.pinnedMessages.delete(messageId);
  }

  /**
   * Get chat history
   */
  getChatHistory(teamId: string, limit: number = 100): ChatMessage[] {
    const chat = this.chats.get(teamId);
    if (!chat) return [];

    return chat.messages.slice(-limit);
  }

  /**
   * Get pinned messages
   */
  getPinnedMessages(teamId: string): ChatMessage[] {
    const chat = this.chats.get(teamId);
    if (!chat) return [];

    return chat.messages.filter((m) => m.pinned);
  }

  /**
   * Mute user
   */
  muteUser(teamId: string, userId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    chat.muteList.add(userId);
    return true;
  }

  /**
   * Unmute user
   */
  unmuteUser(teamId: string, userId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    return chat.muteList.delete(userId);
  }

  /**
   * Check if user is muted
   */
  isUserMuted(teamId: string, userId: string): boolean {
    const chat = this.chats.get(teamId);
    return chat?.muteList.has(userId) || false;
  }

  /**
   * Clear chat history
   */
  clearChatHistory(teamId: string): boolean {
    const chat = this.chats.get(teamId);
    if (!chat) return false;

    chat.messages = [];
    chat.pinnedMessages.clear();
    return true;
  }

  /**
   * Get chat statistics
   */
  getStatistics(teamId: string) {
    const chat = this.chats.get(teamId);
    if (!chat) return null;

    return {
      teamId,
      totalMessages: chat.messages.length,
      pinnedMessages: chat.pinnedMessages.size,
      mutedUsers: chat.muteList.size,
      uniqueUsers: new Set(chat.messages.map((m) => m.userId)).size,
    };
  }
}
