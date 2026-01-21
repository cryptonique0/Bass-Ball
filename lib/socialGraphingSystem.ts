/**
 * Social Graphing System
 * Friends, followers, social relationships
 * @version 1.0.0
 */

export type RelationshipStatus = 'none' | 'pending' | 'friends' | 'blocked' | 'muted';
export type SocialActivity = 'match_played' | 'achievement_unlocked' | 'level_up' | 'joined_team' | 'won_tournament';

export interface SocialProfile {
  userId: string;
  username: string;
  avatar?: string;
  bio: string;
  level: number;
  totalMatches: number;
  winRate: number;
  favoriteTeam?: string;
  joinedAt: Date;
  lastActive: Date;
  isPublic: boolean;
}

export interface Friend {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  status: 'online' | 'offline' | 'away' | 'in_match';
  lastSeen: Date;
  friendsSince: Date;
  isFavorite: boolean;
  mutualFriends: number;
}

export interface Follower {
  userId: string;
  username: string;
  avatar?: string;
  level: number;
  followedAt: Date;
}

export interface SocialRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  type: 'friend_request' | 'follow_request' | 'team_invite' | 'tournament_invite';
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

export interface SocialActivity {
  id: string;
  userId: string;
  username: string;
  type: SocialActivity;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  isPublic: boolean;
}

export interface SocialStats {
  totalFriends: number;
  totalFollowers: number;
  totalFollowing: number;
  friendRequests: number;
  recentActivity: SocialActivity[];
  mutualConnections: Map<string, number>;
  suggestedFriends: Friend[];
}

export interface SocialConnection {
  userId: string;
  friendIds: string[];
  followerIds: string[];
  followingIds: string[];
  blockedIds: string[];
  mutedIds: string[];
  favoriteIds: string[];
  relationships: Map<string, RelationshipStatus>;
}

export interface UserSocialData {
  profile: SocialProfile;
  connections: SocialConnection;
  requests: SocialRequest[];
  activities: SocialActivity[];
  privacy: {
    allowFriendRequests: boolean;
    allowMessages: boolean;
    showOnlineStatus: boolean;
    showActivity: boolean;
    showFriendsList: boolean;
  };
}

/**
 * Social Graphing System
 * Manages social relationships and networking
 */
export const socialGraphingSystem = {
  // Storage key
  _storageKey: 'socialGraphingSystem',

  // Initialize user social profile
  initializeProfile(userId: string, username: string): SocialProfile {
    const existing = this.getProfile(userId);
    if (existing) return existing;

    const profile: SocialProfile = {
      userId,
      username,
      bio: '',
      level: 1,
      totalMatches: 0,
      winRate: 0,
      joinedAt: new Date(),
      lastActive: new Date(),
      isPublic: true,
    };

    const socialData: UserSocialData = {
      profile,
      connections: {
        userId,
        friendIds: [],
        followerIds: [],
        followingIds: [],
        blockedIds: [],
        mutedIds: [],
        favoriteIds: [],
        relationships: new Map(),
      },
      requests: [],
      activities: [],
      privacy: {
        allowFriendRequests: true,
        allowMessages: true,
        showOnlineStatus: true,
        showActivity: true,
        showFriendsList: true,
      },
    };

    localStorage.setItem(`${this._storageKey}:${userId}`, JSON.stringify(socialData));
    return profile;
  },

  // Get user social data
  getUserSocialData(userId: string): UserSocialData | null {
    const data = localStorage.getItem(`${this._storageKey}:${userId}`);
    return data ? JSON.parse(data) : null;
  },

  // Save user social data
  _saveSocialData(userId: string, data: UserSocialData): void {
    localStorage.setItem(`${this._storageKey}:${userId}`, JSON.stringify(data));
  },

  /**
   * Profile Management
   */

  // Get user profile
  getProfile(userId: string): SocialProfile | null {
    const data = this.getUserSocialData(userId);
    return data?.profile || null;
  },

  // Update profile
  updateProfile(userId: string, updates: Partial<SocialProfile>): SocialProfile {
    const data = this.getUserSocialData(userId);
    if (!data) {
      return this.initializeProfile(userId, 'Unknown User');
    }

    data.profile = { ...data.profile, ...updates };
    this._saveSocialData(userId, data);
    return data.profile;
  },

  /**
   * Friend Management
   */

  // Send friend request
  sendFriendRequest(fromId: string, toId: string, message: string = ''): SocialRequest {
    const fromData = this.getUserSocialData(fromId);
    const toData = this.getUserSocialData(toId);

    if (!fromData) this.initializeProfile(fromId, 'Unknown User');
    if (!toData) this.initializeProfile(toId, 'Unknown User');

    const fromProfile = this.getProfile(fromId)!;
    const request: SocialRequest = {
      id: `freq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromId,
      fromName: fromProfile.username,
      toId,
      type: 'friend_request',
      message,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      status: 'pending',
    };

    const toDataUpdated = this.getUserSocialData(toId)!;
    toDataUpdated.requests.push(request);
    this._saveSocialData(toId, toDataUpdated);

    return request;
  },

  // Accept friend request
  acceptFriendRequest(userId: string, requestId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const request = userData.requests.find((r) => r.id === requestId);
    if (!request || request.type !== 'friend_request') return false;

    request.status = 'accepted';

    // Add mutual friendship
    userData.connections.friendIds.push(request.fromId);
    userData.connections.relationships.set(request.fromId, 'friends');
    this._saveSocialData(userId, userData);

    // Update requester's data
    const fromData = this.getUserSocialData(request.fromId);
    if (fromData) {
      if (!fromData.connections.friendIds.includes(userId)) {
        fromData.connections.friendIds.push(userId);
      }
      fromData.connections.relationships.set(userId, 'friends');
      this._saveSocialData(request.fromId, fromData);
    }

    return true;
  },

  // Decline friend request
  declineFriendRequest(userId: string, requestId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const request = userData.requests.find((r) => r.id === requestId);
    if (!request || request.type !== 'friend_request') return false;

    request.status = 'declined';
    this._saveSocialData(userId, userData);
    return true;
  },

  // Get friends
  getFriends(userId: string): Friend[] {
    const userData = this.getUserSocialData(userId);
    if (!userData) return [];

    return userData.connections.friendIds.map((friendId) => {
      const friendProfile = this.getProfile(friendId);
      return {
        userId: friendId,
        username: friendProfile?.username || 'Unknown',
        avatar: friendProfile?.avatar,
        level: friendProfile?.level || 1,
        status: 'offline' as const,
        lastSeen: new Date(),
        friendsSince: new Date(),
        isFavorite: userData.connections.favoriteIds.includes(friendId),
        mutualFriends: this.getMutualFriends(userId, friendId).length,
      };
    });
  },

  // Remove friend
  removeFriend(userId: string, friendId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const index = userData.connections.friendIds.indexOf(friendId);
    if (index === -1) return false;

    userData.connections.friendIds.splice(index, 1);
    userData.connections.relationships.delete(friendId);
    this._saveSocialData(userId, userData);

    // Remove mutual friendship
    const friendData = this.getUserSocialData(friendId);
    if (friendData) {
      const friendIndex = friendData.connections.friendIds.indexOf(userId);
      if (friendIndex !== -1) {
        friendData.connections.friendIds.splice(friendIndex, 1);
        friendData.connections.relationships.delete(userId);
        this._saveSocialData(friendId, friendData);
      }
    }

    return true;
  },

  /**
   * Follow Management
   */

  // Follow user
  followUser(userId: string, targetId: string): boolean {
    const userData = this.getUserSocialData(userId);
    const targetData = this.getUserSocialData(targetId);

    if (!userData || !targetData) return false;

    if (!userData.connections.followingIds.includes(targetId)) {
      userData.connections.followingIds.push(targetId);
      userData.connections.relationships.set(targetId, 'pending');
    }

    if (!targetData.connections.followerIds.includes(userId)) {
      targetData.connections.followerIds.push(userId);
    }

    this._saveSocialData(userId, userData);
    this._saveSocialData(targetId, targetData);
    return true;
  },

  // Unfollow user
  unfollowUser(userId: string, targetId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const index = userData.connections.followingIds.indexOf(targetId);
    if (index === -1) return false;

    userData.connections.followingIds.splice(index, 1);
    this._saveSocialData(userId, userData);

    // Remove from target's followers
    const targetData = this.getUserSocialData(targetId);
    if (targetData) {
      const targetIndex = targetData.connections.followerIds.indexOf(userId);
      if (targetIndex !== -1) {
        targetData.connections.followerIds.splice(targetIndex, 1);
        this._saveSocialData(targetId, targetData);
      }
    }

    return true;
  },

  // Get followers
  getFollowers(userId: string): Follower[] {
    const userData = this.getUserSocialData(userId);
    if (!userData) return [];

    return userData.connections.followerIds.map((followerId) => {
      const followerProfile = this.getProfile(followerId);
      return {
        userId: followerId,
        username: followerProfile?.username || 'Unknown',
        avatar: followerProfile?.avatar,
        level: followerProfile?.level || 1,
        followedAt: new Date(),
      };
    });
  },

  /**
   * Blocking & Muting
   */

  // Block user
  blockUser(userId: string, blockedId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    if (!userData.connections.blockedIds.includes(blockedId)) {
      userData.connections.blockedIds.push(blockedId);
      userData.connections.relationships.set(blockedId, 'blocked');

      // Remove friend relationship if exists
      const friendIndex = userData.connections.friendIds.indexOf(blockedId);
      if (friendIndex !== -1) {
        userData.connections.friendIds.splice(friendIndex, 1);
      }
    }

    this._saveSocialData(userId, userData);
    return true;
  },

  // Unblock user
  unblockUser(userId: string, blockedId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const index = userData.connections.blockedIds.indexOf(blockedId);
    if (index === -1) return false;

    userData.connections.blockedIds.splice(index, 1);
    userData.connections.relationships.delete(blockedId);
    this._saveSocialData(userId, userData);
    return true;
  },

  // Mute user
  muteUser(userId: string, mutedId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    if (!userData.connections.mutedIds.includes(mutedId)) {
      userData.connections.mutedIds.push(mutedId);
      userData.connections.relationships.set(mutedId, 'muted');
    }

    this._saveSocialData(userId, userData);
    return true;
  },

  /**
   * Favorites
   */

  // Add favorite
  addFavorite(userId: string, favoriteId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    if (!userData.connections.favoriteIds.includes(favoriteId)) {
      userData.connections.favoriteIds.push(favoriteId);
    }

    this._saveSocialData(userId, userData);
    return true;
  },

  // Remove favorite
  removeFavorite(userId: string, favoriteId: string): boolean {
    const userData = this.getUserSocialData(userId);
    if (!userData) return false;

    const index = userData.connections.favoriteIds.indexOf(favoriteId);
    if (index === -1) return false;

    userData.connections.favoriteIds.splice(index, 1);
    this._saveSocialData(userId, userData);
    return true;
  },

  /**
   * Activity & Social Feed
   */

  // Log activity
  logActivity(userId: string, type: SocialActivity, description: string, metadata: Record<string, any> = {}): void {
    const userData = this.getUserSocialData(userId);
    if (!userData) return;

    const activity: SocialActivity = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      username: userData.profile.username,
      type,
      description,
      metadata,
      timestamp: new Date(),
      isPublic: userData.privacy.showActivity,
    };

    userData.activities.push(activity);
    // Keep only last 100 activities
    if (userData.activities.length > 100) {
      userData.activities.shift();
    }

    this._saveSocialData(userId, userData);
  },

  // Get recent activity
  getRecentActivity(userId: string, limit: number = 10): SocialActivity[] {
    const userData = this.getUserSocialData(userId);
    if (!userData) return [];

    return userData.activities.slice(-limit).reverse();
  },

  /**
   * Social Graph Analysis
   */

  // Get mutual friends
  getMutualFriends(userId: string, otherId: string): string[] {
    const userData = this.getUserSocialData(userId);
    const otherData = this.getUserSocialData(otherId);

    if (!userData || !otherData) return [];

    return userData.connections.friendIds.filter((id) => otherData.connections.friendIds.includes(id));
  },

  // Get suggested friends
  getSuggestedFriends(userId: string, limit: number = 5): Friend[] {
    const userData = this.getUserSocialData(userId);
    if (!userData) return [];

    const existingConnections = new Set([
      ...userData.connections.friendIds,
      ...userData.connections.blockedIds,
      userId,
    ]);

    // Find friends of friends
    const suggestedMap = new Map<string, number>();

    userData.connections.friendIds.forEach((friendId) => {
      const friendData = this.getUserSocialData(friendId);
      if (friendData) {
        friendData.connections.friendIds.forEach((mutualFriendId) => {
          if (!existingConnections.has(mutualFriendId)) {
            suggestedMap.set(mutualFriendId, (suggestedMap.get(mutualFriendId) || 0) + 1);
          }
        });
      }
    });

    // Sort by connection strength
    const suggested = Array.from(suggestedMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([friendId]) => {
        const profile = this.getProfile(friendId);
        return {
          userId: friendId,
          username: profile?.username || 'Unknown',
          avatar: profile?.avatar,
          level: profile?.level || 1,
          status: 'offline' as const,
          lastSeen: new Date(),
          friendsSince: new Date(),
          isFavorite: false,
          mutualFriends: this.getMutualFriends(userId, friendId).length,
        };
      });

    return suggested;
  },

  /**
   * Statistics
   */

  // Get social stats
  getStats(userId: string): SocialStats {
    const userData = this.getUserSocialData(userId);
    if (!userData) {
      return {
        totalFriends: 0,
        totalFollowers: 0,
        totalFollowing: 0,
        friendRequests: 0,
        recentActivity: [],
        mutualConnections: new Map(),
        suggestedFriends: [],
      };
    }

    const pendingRequests = userData.requests.filter((r) => r.status === 'pending' && r.type === 'friend_request');

    return {
      totalFriends: userData.connections.friendIds.length,
      totalFollowers: userData.connections.followerIds.length,
      totalFollowing: userData.connections.followingIds.length,
      friendRequests: pendingRequests.length,
      recentActivity: userData.activities.slice(-5).reverse(),
      mutualConnections: new Map(),
      suggestedFriends: this.getSuggestedFriends(userId),
    };
  },

  // Get relationship status
  getRelationshipStatus(userId: string, otherId: string): RelationshipStatus {
    const userData = this.getUserSocialData(userId);
    if (!userData) return 'none';

    if (userData.connections.blockedIds.includes(otherId)) return 'blocked';
    if (userData.connections.friendIds.includes(otherId)) return 'friends';
    if (userData.connections.mutedIds.includes(otherId)) return 'muted';

    // Check for pending request
    const pendingRequest = userData.requests.find(
      (r) => (r.fromId === otherId || r.toId === otherId) && r.status === 'pending'
    );
    if (pendingRequest) return 'pending';

    return 'none';
  },
};
