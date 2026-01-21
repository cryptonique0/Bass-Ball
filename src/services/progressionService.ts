/**
 * Player progression and experience system
 */

export interface PlayerLevel {
  level: number;
  experience: number;
  experienceRequired: number;
  skillPoints: number;
}

export interface PlayerProgression {
  playerId: string;
  level: number;
  totalExperience: number;
  skillPoints: number;
  skillsUnlocked: string[];
  lastLevelUp?: number;
}

export class ProgressionService {
  private progressions: Map<string, PlayerProgression> = new Map();

  constructor() {
    // Setup experience curve (exponential)
  }

  /**
   * Get experience required for next level
   */
  getExperienceRequired(level: number): number {
    return Math.floor(100 * Math.pow(1.1, level - 1));
  }

  /**
   * Initialize player progression
   */
  initializePlayer(playerId: string): PlayerProgression {
    const progression: PlayerProgression = {
      playerId,
      level: 1,
      totalExperience: 0,
      skillPoints: 0,
      skillsUnlocked: [],
    };

    this.progressions.set(playerId, progression);
    return progression;
  }

  /**
   * Add experience to player
   */
  addExperience(playerId: string, amount: number): number {
    let prog = this.progressions.get(playerId);

    if (!prog) {
      prog = this.initializePlayer(playerId);
    }

    let levelsGained = 0;
    prog.totalExperience += amount;

    while (true) {
      const required = this.getExperienceRequired(prog.level);
      if (prog.totalExperience >= required) {
        prog.level++;
        prog.skillPoints += 2;
        prog.totalExperience -= required;
        prog.lastLevelUp = Date.now();
        levelsGained++;
      } else {
        break;
      }
    }

    return levelsGained;
  }

  /**
   * Get player progression
   */
  getProgression(playerId: string): PlayerProgression | undefined {
    return this.progressions.get(playerId);
  }

  /**
   * Unlock skill
   */
  unlockSkill(playerId: string, skillId: string, cost: number = 1): boolean {
    const prog = this.progressions.get(playerId);

    if (!prog || prog.skillPoints < cost || prog.skillsUnlocked.includes(skillId)) {
      return false;
    }

    prog.skillPoints -= cost;
    prog.skillsUnlocked.push(skillId);
    return true;
  }

  /**
   * Get available skills
   */
  getAvailableSkills(playerId: string): string[] {
    const prog = this.progressions.get(playerId);
    if (!prog) return [];

    // All skills - locked skills
    const allSkills = ['sprint', 'accuracy', 'defense', 'header', 'curve', 'sprint_boost'];
    return allSkills.filter((s) => !prog.skillsUnlocked.includes(s));
  }

  /**
   * Get current level info
   */
  getCurrentLevelInfo(playerId: string): PlayerLevel | null {
    const prog = this.progressions.get(playerId);
    if (!prog) return null;

    const expRequired = this.getExperienceRequired(prog.level);
    const nextExpRequired = this.getExperienceRequired(prog.level + 1);

    return {
      level: prog.level,
      experience: prog.totalExperience,
      experienceRequired: expRequired - prog.totalExperience,
      skillPoints: prog.skillPoints,
    };
  }

  /**
   * Reset player progression
   */
  resetProgression(playerId: string): void {
    const prog = this.progressions.get(playerId);
    if (prog) {
      prog.level = 1;
      prog.totalExperience = 0;
      prog.skillPoints = 0;
      prog.skillsUnlocked = [];
    }
  }

  /**
   * Export all progressions
   */
  export() {
    return Array.from(this.progressions.values());
  }
}
