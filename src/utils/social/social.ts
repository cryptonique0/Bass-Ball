/**
 * Social Features - Notifications, friends, clans
 */

export interface Notification {
  notificationId: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  timestamp: number;
  actionUrl?: string;
}

export interface FriendRequest {
  requestId: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  timestamp: number;
}

export class SocialSystem {
  private notifications: Map<string, Notification[]> = new Map();
  private friendships: Map<string, Set<string>> = new Map();
  private friendRequests: Map<string, FriendRequest> = new Map();
  private blocks: Map<string, Set<string>> = new Map();

  sendNotification(userId: string, type: string, message: string, actionUrl?: string): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }

    const notification: Notification = {
      notificationId: `notif_${Date.now()}`,
      userId,
      type,
      message,
      read: false,
      timestamp: Date.now(),
      actionUrl,
    };

    const userNotifications = this.notifications.get(userId);
    if (userNotifications) {
      userNotifications.push(notification);
    }
  }

  getUnreadNotifications(userId: string): Notification[] {
    return (this.notifications.get(userId) || []).filter((n) => !n.read);
  }

  markNotificationRead(notificationId: string, userId: string): void {
    const notifs = this.notifications.get(userId);
    if (notifs) {
      const notif = notifs.find((n) => n.notificationId === notificationId);
      if (notif) notif.read = true;
    }
  }

  sendFriendRequest(fromUserId: string, toUserId: string): boolean {
    if (this.isBlocked(fromUserId, toUserId)) return false;
    if (this.areFriends(fromUserId, toUserId)) return false;

    const request: FriendRequest = {
      requestId: `freq_${Date.now()}`,
      fromUserId,
      toUserId,
      status: 'pending',
      timestamp: Date.now(),
    };

    this.friendRequests.set(request.requestId, request);
    this.sendNotification(toUserId, 'friend_request', `${fromUserId} sent you a friend request`);
    return true;
  }

  acceptFriendRequest(requestId: string): boolean {
    const request = this.friendRequests.get(requestId);
    if (!request) return false;

    request.status = 'accepted';

    if (!this.friendships.has(request.fromUserId)) {
      this.friendships.set(request.fromUserId, new Set());
    }
    if (!this.friendships.has(request.toUserId)) {
      this.friendships.set(request.toUserId, new Set());
    }

    this.friendships.get(request.fromUserId)!.add(request.toUserId);
    this.friendships.get(request.toUserId)!.add(request.fromUserId);

    return true;
  }

  rejectFriendRequest(requestId: string): boolean {
    const request = this.friendRequests.get(requestId);
    if (!request) return false;

    request.status = 'rejected';
    return true;
  }

  areFriends(userId1: string, userId2: string): boolean {
    const friends = this.friendships.get(userId1);
    return friends ? friends.has(userId2) : false;
  }

  blockUser(userId: string, blockedId: string): void {
    if (!this.blocks.has(userId)) {
      this.blocks.set(userId, new Set());
    }
    this.blocks.get(userId)!.add(blockedId);
  }

  unblockUser(userId: string, unblockedId: string): void {
    this.blocks.get(userId)?.delete(unblockedId);
  }

  isBlocked(userId: string, otherUserId: string): boolean {
    return this.blocks.get(userId)?.has(otherUserId) || false;
  }

  getFriendsList(userId: string): string[] {
    return Array.from(this.friendships.get(userId) || new Set());
  }

  getPendingFriendRequests(userId: string): FriendRequest[] {
    return Array.from(this.friendRequests.values()).filter((r) => r.toUserId === userId && r.status === 'pending');
  }
}
