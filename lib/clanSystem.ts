/**
 * Clan & Club Management System
 * 
 * Manage player clans/clubs with:
 * - Club creation and management
 * - Member roles and permissions
 * - Club treasury and funding
 * - Recruitment and invitations
 * - Club statistics
 */

export type MemberRole = 'owner' | 'leader' | 'officer' | 'member';
export type ClubStatus = 'active' | 'disbanded' | 'suspended';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface ClubMember {
  playerId: string;
  playerName: string;
  role: MemberRole;
  joinedAt: number;
  contributions: number; // Total contributions to club
  wins: number;
  losses: number;
  warParticipation: number;
}

export interface ClubInvite {
  inviteId: string;
  clubId: string;
  clubName: string;
  playerId: string;
  playerName: string;
  invitedBy: string;
  status: InviteStatus;
  createdAt: number;
  expiresAt: number;
  message?: string;
}

export interface ClubTreasury {
  softBalance: number;
  hardBalance: number;
  lockedBalance: number;
  history: Array<{
    type: 'deposit' | 'withdrawal' | 'war_fee' | 'reward';
    amount: number;
    currencyType: 'soft' | 'hard';
    description: string;
    timestamp: number;
    initiatedBy: string;
  }>;
}

export interface Club {
  clubId: string;
  name: string;
  description: string;
  owner: string;
  ownerName: string;
  members: Map<string, ClubMember>;
  treasury: ClubTreasury;
  status: ClubStatus;
  level: number; // 1-10, increases with wins
  experience: number;
  createdAt: number;
  logo?: string;
  banner?: string;
  website?: string;
  joinPolicy: 'open' | 'approval' | 'private'; // How to join
  maxMembers: number; // Increases with level
  stats: {
    totalWins: number;
    totalLosses: number;
    warParticipation: number;
    averageWinRate: number;
  };
  metadata?: Record<string, any>;
}

export interface ClubStats {
  totalClubs: number;
  activePlayers: number;
  totalWars: number;
  averageMembersPerClub: number;
  topClubsByWins: Club[];
  topClubsByMembers: Club[];
}

/**
 * Clan Manager - Manage clubs and memberships
 * Singleton pattern
 */
export class ClanManager {
  private static instance: ClanManager;
  private clubs: Map<string, Club> = new Map();
  private playerClubs: Map<string, string> = new Map(); // playerId -> clubId
  private invites: Map<string, ClubInvite> = new Map();
  private playerInvites: Map<string, string[]> = new Map(); // playerId -> inviteIds

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): ClanManager {
    if (!ClanManager.instance) {
      ClanManager.instance = new ClanManager();
    }
    return ClanManager.instance;
  }

  /**
   * Create a new club
   */
  createClub(
    ownerId: string,
    ownerName: string,
    name: string,
    description: string,
    joinPolicy: 'open' | 'approval' | 'private' = 'approval'
  ): Club {
    // Validate
    if (this.playerClubs.has(ownerId)) {
      throw new Error('Player already owns or is in a club');
    }

    const clubId = `club_${ownerId}_${Date.now()}`;
    const owner: ClubMember = {
      playerId: ownerId,
      playerName: ownerName,
      role: 'owner',
      joinedAt: Date.now(),
      contributions: 0,
      wins: 0,
      losses: 0,
      warParticipation: 0,
    };

    const club: Club = {
      clubId,
      name,
      description,
      owner: ownerId,
      ownerName,
      members: new Map([[ownerId, owner]]),
      treasury: {
        softBalance: 0,
        hardBalance: 0,
        lockedBalance: 0,
        history: [],
      },
      status: 'active',
      level: 1,
      experience: 0,
      createdAt: Date.now(),
      joinPolicy,
      maxMembers: 50, // Level 1 = 50 members
      stats: {
        totalWins: 0,
        totalLosses: 0,
        warParticipation: 0,
        averageWinRate: 0,
      },
    };

    this.clubs.set(clubId, club);
    this.playerClubs.set(ownerId, clubId);

    this.saveToStorage();
    return club;
  }

  /**
   * Invite player to club
   */
  invitePlayer(
    clubId: string,
    inviterId: string,
    playerId: string,
    playerName: string,
    message?: string
  ): { success: boolean; invite?: ClubInvite } {
    const club = this.clubs.get(clubId);
    if (!club) {
      return { success: false };
    }

    const inviter = club.members.get(inviterId);
    if (!inviter || (inviter.role !== 'owner' && inviter.role !== 'leader')) {
      return { success: false };
    }

    // Check if player already in club
    if (this.playerClubs.has(playerId)) {
      return { success: false };
    }

    // Check existing invites
    if (this.getPlayerInvites(playerId).some(i => i.clubId === clubId && i.status === 'pending')) {
      return { success: false };
    }

    const inviteId = `invite_${clubId}_${playerId}_${Date.now()}`;
    const invite: ClubInvite = {
      inviteId,
      clubId,
      clubName: club.name,
      playerId,
      playerName,
      invitedBy: inviterId,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      message,
    };

    this.invites.set(inviteId, invite);
    if (!this.playerInvites.has(playerId)) {
      this.playerInvites.set(playerId, []);
    }
    this.playerInvites.get(playerId)!.push(inviteId);

    this.saveToStorage();
    return { success: true, invite };
  }

  /**
   * Accept club invite
   */
  acceptInvite(inviteId: string, playerId: string, playerName: string): { success: boolean } {
    const invite = this.invites.get(inviteId);
    if (!invite || invite.status !== 'pending' || Date.now() > invite.expiresAt) {
      return { success: false };
    }

    const club = this.clubs.get(invite.clubId);
    if (!club || club.members.size >= club.maxMembers) {
      return { success: false };
    }

    // Add member
    const member: ClubMember = {
      playerId,
      playerName,
      role: 'member',
      joinedAt: Date.now(),
      contributions: 0,
      wins: 0,
      losses: 0,
      warParticipation: 0,
    };

    club.members.set(playerId, member);
    this.playerClubs.set(playerId, invite.clubId);
    invite.status = 'accepted';

    this.saveToStorage();
    return { success: true };
  }

  /**
   * Decline club invite
   */
  declineInvite(inviteId: string): boolean {
    const invite = this.invites.get(inviteId);
    if (!invite || invite.status !== 'pending') {
      return false;
    }

    invite.status = 'declined';
    this.saveToStorage();
    return true;
  }

  /**
   * Get club
   */
  getClub(clubId: string): Club | undefined {
    return this.clubs.get(clubId);
  }

  /**
   * Get player's club
   */
  getPlayerClub(playerId: string): Club | undefined {
    const clubId = this.playerClubs.get(playerId);
    return clubId ? this.clubs.get(clubId) : undefined;
  }

  /**
   * Get club members
   */
  getClubMembers(clubId: string): ClubMember[] {
    const club = this.clubs.get(clubId);
    return club ? Array.from(club.members.values()).sort((a, b) => {
      const roleOrder = { owner: 0, leader: 1, officer: 2, member: 3 };
      return roleOrder[a.role] - roleOrder[b.role];
    }) : [];
  }

  /**
   * Update member role
   */
  updateMemberRole(clubId: string, memberId: string, newRole: MemberRole, actorId: string): boolean {
    const club = this.clubs.get(clubId);
    if (!club) return false;

    const actor = club.members.get(actorId);
    if (!actor || actor.role !== 'owner') return false;

    const member = club.members.get(memberId);
    if (!member || member.role === 'owner') return false;

    member.role = newRole;
    this.saveToStorage();
    return true;
  }

  /**
   * Remove member from club
   */
  removeMember(clubId: string, memberId: string, actorId: string): boolean {
    const club = this.clubs.get(clubId);
    if (!club) return false;

    const actor = club.members.get(actorId);
    if (!actor || (actor.role !== 'owner' && actor.role !== 'leader')) return false;

    if (memberId === club.owner) return false; // Can't remove owner

    club.members.delete(memberId);
    this.playerClubs.delete(memberId);

    // Update stats
    const member = club.members.get(memberId);
    if (member) {
      club.stats.totalWins -= member.wins;
      club.stats.totalLosses -= member.losses;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Deposit to club treasury
   */
  depositToClubbTreasury(
    clubId: string,
    playerId: string,
    amount: number,
    currencyType: 'soft' | 'hard'
  ): boolean {
    const club = this.clubs.get(clubId);
    if (!club) return false;

    if (currencyType === 'soft') {
      club.treasury.softBalance += amount;
    } else {
      club.treasury.hardBalance += amount;
    }

    club.treasury.history.push({
      type: 'deposit',
      amount,
      currencyType,
      description: `Deposit by ${playerId}`,
      timestamp: Date.now(),
      initiatedBy: playerId,
    });

    // Add contribution tracking
    const member = club.members.get(playerId);
    if (member) {
      member.contributions += amount;
    }

    this.saveToStorage();
    return true;
  }

  /**
   * Withdraw from club treasury (owner only)
   */
  withdrawFromTreasury(
    clubId: string,
    ownerId: string,
    amount: number,
    currencyType: 'soft' | 'hard',
    description: string
  ): boolean {
    const club = this.clubs.get(clubId);
    if (!club || club.owner !== ownerId) return false;

    if (currencyType === 'soft') {
      if (club.treasury.softBalance < amount) return false;
      club.treasury.softBalance -= amount;
    } else {
      if (club.treasury.hardBalance < amount) return false;
      club.treasury.hardBalance -= amount;
    }

    club.treasury.history.push({
      type: 'withdrawal',
      amount,
      currencyType,
      description,
      timestamp: Date.now(),
      initiatedBy: ownerId,
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Get player's pending invites
   */
  getPlayerInvites(playerId: string): ClubInvite[] {
    const inviteIds = this.playerInvites.get(playerId) || [];
    return inviteIds
      .map(id => this.invites.get(id))
      .filter((i): i is ClubInvite => !!i)
      .filter(i => Date.now() <= i.expiresAt);
  }

  /**
   * Get all clubs
   */
  getAllClubs(limit: number = 100): Club[] {
    return Array.from(this.clubs.values())
      .filter(c => c.status === 'active')
      .sort((a, b) => b.stats.totalWins - a.stats.totalWins)
      .slice(0, limit);
  }

  /**
   * Search clubs
   */
  searchClubs(query: string): Club[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllClubs().filter(c =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.description.toLowerCase().includes(lowerQuery) ||
      c.ownerName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get club statistics
   */
  getGlobalStats(): ClubStats {
    const allClubs = this.getAllClubs(1000);
    const totalMembers = allClubs.reduce((sum, c) => sum + c.members.size, 0);

    return {
      totalClubs: allClubs.length,
      activePlayers: totalMembers,
      totalWars: allClubs.reduce((sum, c) => sum + c.stats.warParticipation, 0),
      averageMembersPerClub: allClubs.length > 0 ? totalMembers / allClubs.length : 0,
      topClubsByWins: allClubs.slice(0, 5),
      topClubsByMembers: [...allClubs].sort((a, b) => b.members.size - a.members.size).slice(0, 5),
    };
  }

  /**
   * Disband club (owner only)
   */
  disbandClub(clubId: string, ownerId: string): boolean {
    const club = this.clubs.get(clubId);
    if (!club || club.owner !== ownerId) return false;

    club.status = 'disbanded';

    // Remove all members
    club.members.forEach((_, memberId) => {
      this.playerClubs.delete(memberId);
    });
    club.members.clear();

    this.saveToStorage();
    return true;
  }

  /**
   * Persist to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        clubs: Array.from(this.clubs.entries()),
        playerClubs: Array.from(this.playerClubs.entries()),
        invites: Array.from(this.invites.entries()),
        playerInvites: Array.from(this.playerInvites.entries()),
      };
      localStorage.setItem('clan_system', JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save clan data:', e);
    }
  }

  /**
   * Load from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('clan_system') || '{}');
      if (data.clubs) this.clubs = new Map(data.clubs.map((entry: any) => [entry[0], { ...entry[1], members: new Map(entry[1].members || []) }]));
      if (data.playerClubs) this.playerClubs = new Map(data.playerClubs);
      if (data.invites) this.invites = new Map(data.invites);
      if (data.playerInvites) this.playerInvites = new Map(data.playerInvites);
    } catch (e) {
      console.warn('Failed to load clan data:', e);
    }
  }

  /**
   * Clear all data (development only)
   */
  clearAll(): void {
    this.clubs.clear();
    this.playerClubs.clear();
    this.invites.clear();
    this.playerInvites.clear();
    this.saveToStorage();
  }
}
