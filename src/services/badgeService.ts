// Badge service
export interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: Record<string, any>;
}

export class BadgeService {
  private badges: Map<string, BadgeData> = new Map();
  private userBadges: Map<string, Set<string>> = new Map();

  createBadge(badge: BadgeData): void {
    this.badges.set(badge.id, badge);
  }

  getBadge(id: string): BadgeData | null {
    return this.badges.get(id) || null;
  }

  awardBadge(userId: string, badgeId: string): void {
    if (!this.userBadges.has(userId)) {
      this.userBadges.set(userId, new Set());
    }
    this.userBadges.get(userId)!.add(badgeId);
  }

  getUserBadges(userId: string): BadgeData[] {
    const badgeIds = this.userBadges.get(userId) || new Set();
    return Array.from(badgeIds)
      .map(id => this.badges.get(id))
      .filter((b): b is BadgeData => b !== null);
  }

  getAllBadges(): BadgeData[] {
    return Array.from(this.badges.values());
  }
}

export const badgeService = new BadgeService();
