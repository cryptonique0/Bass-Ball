/**
 * Career Path System - Player career progression, positions, roles evolution
 */

export type PlayerPosition = 'GK' | 'CB' | 'LB' | 'RB' | 'DM' | 'CM' | 'AM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface CareerMilestone {
  age: number;
  achievement: string;
  salaryIncrease: number;
  stat: string;
  statValue: number;
}

export interface CareerPhase {
  name: string;
  ageRange: [number, number];
  potentialMultiplier: number;
  recoveryMultiplier: number;
  injuryRisk: number;
}

export interface PlayerCareer {
  playerId: string;
  startAge: number;
  currentPhase: CareerPhase;
  positions: PlayerPosition[];
  milestones: CareerMilestone[];
  peakAge: number;
  retirementAge: number;
}

export class CareerPathSystem {
  private careerPhases: CareerPhase[] = [
    { name: 'youth', ageRange: [16, 22], potentialMultiplier: 1.5, recoveryMultiplier: 0.8, injuryRisk: 0.15 },
    { name: 'prime', ageRange: [23, 30], potentialMultiplier: 0.5, recoveryMultiplier: 1.0, injuryRisk: 0.1 },
    { name: 'veteran', ageRange: [31, 35], potentialMultiplier: 0.2, recoveryMultiplier: 0.8, injuryRisk: 0.2 },
    { name: 'decline', ageRange: [36, 100], potentialMultiplier: -0.5, recoveryMultiplier: 0.6, injuryRisk: 0.3 },
  ];

  getCareerPhase(age: number): CareerPhase {
    return this.careerPhases.find((p) => age >= p.ageRange[0] && age <= p.ageRange[1]) || this.careerPhases[2];
  }

  calculatePeakAge(primaryPosition: PlayerPosition): number {
    const peakAges: Record<PlayerPosition, number> = {
      GK: 32,
      CB: 30,
      LB: 28,
      RB: 28,
      DM: 29,
      CM: 28,
      AM: 27,
      LW: 27,
      RW: 27,
      ST: 28,
      CF: 29,
    };
    return peakAges[primaryPosition];
  }

  getPositionTransitionChance(currentPosition: PlayerPosition, targetPosition: PlayerPosition, years: number): number {
    // Calculate compatibility between positions
    const compatibility: Record<PlayerPosition, PlayerPosition[]> = {
      GK: [],
      CB: ['LB', 'RB'],
      LB: ['CB', 'LW', 'CM'],
      RB: ['CB', 'RW', 'CM'],
      DM: ['CM'],
      CM: ['DM', 'AM', 'LB', 'RB'],
      AM: ['CM', 'LW', 'RW'],
      LW: ['AM', 'LB', 'ST'],
      RW: ['AM', 'RB', 'ST'],
      ST: ['CF', 'LW', 'RW'],
      CF: ['ST'],
    };

    const compatible = compatibility[currentPosition]?.includes(targetPosition) || false;
    const chance = compatible ? 0.7 - years * 0.1 : 0.2 - years * 0.05;

    return Math.max(0, Math.min(1, chance));
  }

  addMilestone(career: PlayerCareer, milestone: CareerMilestone): void {
    career.milestones.push(milestone);
    career.milestones.sort((a, b) => a.age - b.age);
  }

  getCareerHighlight(career: PlayerCareer): CareerMilestone | undefined {
    return career.milestones.reduce((best, current) =>
      current.stat === 'goals' && current.statValue > (best?.statValue || 0) ? current : best
    );
  }

  predictRetirementAge(position: PlayerPosition, playingStyle: 'aggressive' | 'conservative' | 'balanced'): number {
    const baseRetirement: Record<PlayerPosition, number> = {
      GK: 40,
      CB: 37,
      LB: 35,
      RB: 35,
      DM: 35,
      CM: 34,
      AM: 33,
      LW: 32,
      RW: 32,
      ST: 33,
      CF: 33,
    };

    const styleModifier = {
      aggressive: -1,
      conservative: 1,
      balanced: 0,
    }[playingStyle];

    return baseRetirement[position] + styleModifier;
  }

  getCareerProgression(career: PlayerCareer, currentAge: number): {
    phase: string;
    potential: number;
    form: number;
    yearsRemaining: number;
  } {
    const phase = this.getCareerPhase(currentAge);
    const yearsRemaining = career.retirementAge - currentAge;

    // Potential decreases as player ages past peak
    const peakAge = career.peakAge;
    let potential = 1.0;
    if (currentAge > peakAge) {
      potential = Math.max(0, 1 - (currentAge - peakAge) * 0.05);
    } else {
      potential = 0.8 + (Math.min(currentAge - 20, 5) / 5) * 0.2;
    }

    return {
      phase: phase.name,
      potential,
      form: Math.random(),
      yearsRemaining: Math.max(0, yearsRemaining),
    };
  }
}
