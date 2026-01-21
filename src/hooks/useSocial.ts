/**
 * React Hooks for Social Features
 * Integration hooks for messaging, social graphing, and tournaments
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { messagingSystem, DirectMessageThread, GroupChat, TeamChat, Message } from '@/lib/messagingSystem';
import { socialGraphingSystem, Friend, SocialStats, SocialProfile } from '@/lib/socialGraphingSystem';
import { bracketSystem, Tournament, Bracket, BracketMatch, TournamentStats } from '@/lib/bracketSystem';

/**
 * useMessaging Hook
 * Direct messages, group chats, team communication
 */
export function useMessaging(userId?: string) {
  const [threads, setThreads] = useState<DirectMessageThread[]>([]);
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [teamChats, setTeamChats] = useState<TeamChat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const currentUserId = userId || 'current_user';

  useEffect(() => {
    messagingSystem.initialize(currentUserId);
    updateMessages();
  }, [currentUserId]);

  const updateMessages = useCallback(() => {
    const threads = messagingSystem.getDirectThreads(currentUserId);
    const groups = messagingSystem.getGroupChats(currentUserId);
    const teams = messagingSystem.getTeamChats(currentUserId);
    const stats = messagingSystem.getStats(currentUserId);

    setThreads(threads);
    setGroupChats(groups);
    setTeamChats(teams);
    setUnreadCount(stats.unreadMessages);
  }, [currentUserId]);

  const sendDirectMessage = useCallback(
    (recipientId: string, content: string) => {
      const message = messagingSystem.sendDirectMessage(currentUserId, recipientId, content, [], []);
      updateMessages();
      return message;
    },
    [currentUserId, updateMessages]
  );

  const createGroupChat = useCallback(
    (name: string, description: string) => {
      const chat = messagingSystem.createGroupChat(currentUserId, name, description);
      updateMessages();
      return chat;
    },
    [currentUserId, updateMessages]
  );

  const sendGroupMessage = useCallback(
    (chatId: string, content: string) => {
      const message = messagingSystem.sendGroupMessage(currentUserId, chatId, content);
      updateMessages();
      return message;
    },
    [currentUserId, updateMessages]
  );

  const joinGroupChat = useCallback(
    (chatId: string) => {
      const result = messagingSystem.joinGroupChat(currentUserId, chatId);
      updateMessages();
      return result;
    },
    [currentUserId, updateMessages]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string, chatId: string) => {
      messagingSystem.addReaction(currentUserId, messageId, emoji, chatId);
      updateMessages();
    },
    [currentUserId, updateMessages]
  );

  const blockUser = useCallback(
    (blockedId: string) => {
      messagingSystem.blockUser(currentUserId, blockedId);
      updateMessages();
    },
    [currentUserId, updateMessages]
  );

  return {
    threads,
    groupChats,
    teamChats,
    unreadCount,
    sendDirectMessage,
    createGroupChat,
    sendGroupMessage,
    joinGroupChat,
    addReaction,
    blockUser,
  };
}

/**
 * useSocialGraph Hook
 * Friends, followers, social relationships
 */
export function useSocialGraph(userId?: string) {
  const [profile, setProfile] = useState<SocialProfile | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [stats, setStats] = useState<SocialStats | null>(null);
  const [suggestedFriends, setSuggestedFriends] = useState<Friend[]>([]);

  const currentUserId = userId || 'current_user';

  useEffect(() => {
    socialGraphingSystem.initializeProfile(currentUserId, `User ${currentUserId.slice(0, 8)}`);
    updateSocialData();
  }, [currentUserId]);

  const updateSocialData = useCallback(() => {
    const profile = socialGraphingSystem.getProfile(currentUserId);
    const friends = socialGraphingSystem.getFriends(currentUserId);
    const stats = socialGraphingSystem.getStats(currentUserId);

    setProfile(profile);
    setFriends(friends);
    setStats(stats);
    setSuggestedFriends(stats?.suggestedFriends || []);
  }, [currentUserId]);

  const sendFriendRequest = useCallback(
    (toId: string, message: string = '') => {
      socialGraphingSystem.sendFriendRequest(currentUserId, toId, message);
      updateSocialData();
    },
    [currentUserId, updateSocialData]
  );

  const acceptFriendRequest = useCallback(
    (requestId: string) => {
      const result = socialGraphingSystem.acceptFriendRequest(currentUserId, requestId);
      updateSocialData();
      return result;
    },
    [currentUserId, updateSocialData]
  );

  const removeFriend = useCallback(
    (friendId: string) => {
      const result = socialGraphingSystem.removeFriend(currentUserId, friendId);
      updateSocialData();
      return result;
    },
    [currentUserId, updateSocialData]
  );

  const followUser = useCallback(
    (targetId: string) => {
      const result = socialGraphingSystem.followUser(currentUserId, targetId);
      updateSocialData();
      return result;
    },
    [currentUserId, updateSocialData]
  );

  const blockUser = useCallback(
    (blockedId: string) => {
      const result = socialGraphingSystem.blockUser(currentUserId, blockedId);
      updateSocialData();
      return result;
    },
    [currentUserId, updateSocialData]
  );

  const addFavorite = useCallback(
    (favoriteId: string) => {
      const result = socialGraphingSystem.addFavorite(currentUserId, favoriteId);
      updateSocialData();
      return result;
    },
    [currentUserId, updateSocialData]
  );

  const updateProfile = useCallback(
    (updates: Partial<SocialProfile>) => {
      const updated = socialGraphingSystem.updateProfile(currentUserId, updates);
      setProfile(updated);
      return updated;
    },
    [currentUserId]
  );

  return {
    profile,
    friends,
    stats,
    suggestedFriends,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    followUser,
    blockUser,
    addFavorite,
    updateProfile,
  };
}

/**
 * useTournaments Hook
 * Tournament creation and bracket management
 */
export function useTournaments(userId?: string) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [userTournaments, setUserTournaments] = useState<Tournament[]>([]);
  const [currentBracket, setCurrentBracket] = useState<Bracket | null>(null);
  const [stats, setStats] = useState<TournamentStats | null>(null);

  const currentUserId = userId || 'current_user';

  useEffect(() => {
    updateTournaments();
  }, [currentUserId]);

  const updateTournaments = useCallback(() => {
    const all = bracketSystem.getTournaments();
    const user = bracketSystem.getUserTournaments(currentUserId);
    const userStats = bracketSystem.getUserTournamentStats(currentUserId);

    setTournaments(all);
    setUserTournaments(user);
    setStats(userStats);
  }, [currentUserId]);

  const createTournament = useCallback(
    (name: string, format: any = 'single_elimination', maxParticipants: number = 64) => {
      const tournament = bracketSystem.createTournament(
        currentUserId,
        name,
        format,
        maxParticipants,
        1000
      );
      updateTournaments();
      return tournament;
    },
    [currentUserId, updateTournaments]
  );

  const joinTournament = useCallback(
    (tournamentId: string) => {
      const result = bracketSystem.joinTournament(tournamentId, currentUserId);
      updateTournaments();
      return result;
    },
    [currentUserId, updateTournaments]
  );

  const generateBracket = useCallback(
    (tournamentId: string) => {
      const bracket = bracketSystem.generateBracket(tournamentId);
      if (bracket) {
        setCurrentBracket(bracket);
      }
      updateTournaments();
      return bracket;
    },
    [updateTournaments]
  );

  const updateMatch = useCallback(
    (bracketId: string, matchId: string, score1: number, score2: number, winner: string) => {
      const match = bracketSystem.updateMatch(bracketId, matchId, score1, score2, winner);
      updateTournaments();
      return match;
    },
    [updateTournaments]
  );

  const getTournamentStandings = useCallback((tournamentId: string) => {
    return bracketSystem.getTournamentStandings(tournamentId);
  }, []);

  const getBracketMatches = useCallback((bracketId: string, roundNumber: number) => {
    return bracketSystem.getRoundMatches(bracketId, roundNumber);
  }, []);

  return {
    tournaments,
    userTournaments,
    currentBracket,
    stats,
    createTournament,
    joinTournament,
    generateBracket,
    updateMatch,
    getTournamentStandings,
    getBracketMatches,
  };
}

/**
 * useSocial Hook
 * Combined social features
 */
export function useSocial(userId?: string) {
  const messaging = useMessaging(userId);
  const socialGraph = useSocialGraph(userId);
  const tournaments = useTournaments(userId);

  return {
    messaging,
    socialGraph,
    tournaments,
  };
}
