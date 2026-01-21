/**
 * Guild/Club System - Team clubs and communities
 */

export interface GuildMember {
  memberId: string;
  joinDate: number;
  role: 'owner' | 'admin' | 'officer' | 'member';
  contributions: number;
  reputation: number;
}

export interface Guild {
  guildId: string;
  name: string;
  owner: string;
  description: string;
  createdDate: number;
  members: Map<string, GuildMember>;
  treasury: number;
  level: number; // 1-10
  benefits: string[];
}

export class GuildSystem {
  private guilds: Map<string, Guild> = new Map();
  private memberGuilds: Map<string, string> = new Map(); // member -> guild

  createGuild(owner: string, name: string, description: string): Guild {
    const ownerMember: GuildMember = {
      memberId: owner,
      joinDate: Date.now(),
      role: 'owner',
      contributions: 0,
      reputation: 100,
    };

    const membersMap: Map<string, GuildMember> = new Map();
    membersMap.set(owner, ownerMember);

    const guild: Guild = {
      guildId: `guild_${Date.now()}`,
      name,
      owner,
      description,
      createdDate: Date.now(),
      members: membersMap,
      treasury: 1000,
      level: 1,
      benefits: ['5% XP Bonus'],
    };

    this.guilds.set(guild.guildId, guild);
    this.memberGuilds.set(owner, guild.guildId);

    return guild;
  }

  joinGuild(memberId: string, guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || this.memberGuilds.has(memberId)) {
      return false;
    }

    const newMember: GuildMember = {
      memberId,
      joinDate: Date.now(),
      role: 'member',
      contributions: 0,
      reputation: 0,
    };

    guild.members.set(memberId, newMember);
    this.memberGuilds.set(memberId, guildId);
    return true;
  }

  leaveGuild(memberId: string): boolean {
    const guildId = this.memberGuilds.get(memberId);
    if (!guildId) return false;

    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    // Can't leave if owner
    const member = guild.members.get(memberId);
    if (member && member.role === 'owner') {
      return false;
    }

    guild.members.delete(memberId);
    this.memberGuilds.delete(memberId);
    return true;
  }

  contributeToGuildTreasury(memberId: string, amount: number): boolean {
    const guildId = this.memberGuilds.get(memberId);
    if (!guildId) return false;

    const guild = this.guilds.get(guildId);
    if (!guild) return false;

    guild.treasury += amount;

    const member = guild.members.get(memberId);
    if (member) {
      member.contributions += amount;
      member.reputation = Math.min(100, member.reputation + Math.floor(amount / 100));
    }

    return true;
  }

  upgradGuild(guildId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.level >= 10) return false;

    const upgradeCost = guild.level * 5000;
    if (guild.treasury < upgradeCost) return false;

    guild.treasury -= upgradeCost;
    guild.level++;
    guild.benefits.push(`Level ${guild.level} Benefit`);

    return true;
  }

  getGuildMembers(guildId: string): GuildMember[] {
    const guild = this.guilds.get(guildId);
    return guild ? Array.from(guild.members.values()) : [];
  }

  getPlayerGuild(memberId: string): Guild | undefined {
    const guildId = this.memberGuilds.get(memberId);
    return guildId ? this.guilds.get(guildId) : undefined;
  }

  disbandGuild(guildId: string, ownerId: string): boolean {
    const guild = this.guilds.get(guildId);
    if (!guild || guild.owner !== ownerId) return false;

    for (const member of guild.members.keys()) {
      this.memberGuilds.delete(member);
    }

    this.guilds.delete(guildId);
    return true;
  }

  getTopGuilds(limit: number = 10): Guild[] {
    return Array.from(this.guilds.values())
      .sort((a, b) => b.level - a.level || b.treasury - a.treasury)
      .slice(0, limit);
  }
}
