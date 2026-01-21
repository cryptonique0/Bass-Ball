// Skill tree for player progression
export interface SkillNode {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  unlocked: boolean;
  prerequisites: string[];
}

export class SkillTree {
  private skills: Map<string, SkillNode> = new Map();

  addSkill(node: SkillNode): void {
    this.skills.set(node.id, node);
  }

  canUnlock(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    
    return skill.prerequisites.every(reqId => {
      const req = this.skills.get(reqId);
      return req && req.unlocked;
    });
  }

  unlock(skillId: string): boolean {
    if (!this.canUnlock(skillId)) return false;
    const skill = this.skills.get(skillId);
    if (skill) {
      skill.unlocked = true;
      return true;
    }
    return false;
  }

  levelUp(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (skill && skill.unlocked && skill.level < skill.maxLevel) {
      skill.level++;
      return true;
    }
    return false;
  }

  getSkill(id: string): SkillNode | undefined {
    return this.skills.get(id);
  }

  getUnlockedSkills(): SkillNode[] {
    return Array.from(this.skills.values()).filter(s => s.unlocked);
  }
}
