/**
 * Scouting System - Identify and evaluate young talent
 */

export interface ScoutingReport {
  playerId: string;
  age: number;
  currentRating: number;
  potentialRating: number;
  strength: string[];
  weakness: string[];
  recommendedPosition: string;
  scoutingAccuracy: number; // 0-1
  costToSign: number;
}

export interface ScoutingData {
  regionCoverage: Map<string, number>; // region -> scout quality 0-1
  discoveredTalents: ScoutingReport[];
  scouted: Set<string>;
}

export class ScoutingSystem {
  private scoutingData: ScoutingData = {
    regionCoverage: new Map(),
    discoveredTalents: [],
    scouted: new Set(),
  };

  private scoutQualities: Array<{ name: string; quality: number }> = [
    { name: 'world_class', quality: 0.95 },
    { name: 'excellent', quality: 0.85 },
    { name: 'good', quality: 0.75 },
    { name: 'average', quality: 0.65 },
  ];

  setRegionCoverage(region: string, quality: number): void {
    this.scoutingData.regionCoverage.set(region, Math.max(0, Math.min(1, quality)));
  }

  generateScoutingReport(
    playerId: string,
    playerAge: number,
    currentAttributes: Record<string, number>,
    region: string
  ): ScoutingReport {
    const scoutQuality = this.scoutingData.regionCoverage.get(region) || 0.5;

    // Current rating based on attributes
    const attributeSum = Object.values(currentAttributes).reduce((a, b) => a + b, 0);
    const currentRating = (attributeSum / Object.keys(currentAttributes).length) * scoutQuality;

    // Potential rating estimation (higher for younger players)
    const ageMultiplier = Math.max(0, 1 - (playerAge - 16) * 0.05);
    const potentialRating = currentRating + (Math.random() * 30 * ageMultiplier);

    const strengths = Object.entries(currentAttributes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map((a) => a[0]);

    const weaknesses = Object.entries(currentAttributes)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map((a) => a[0]);

    const report: ScoutingReport = {
      playerId,
      age: playerAge,
      currentRating,
      potentialRating,
      strength: strengths,
      weakness: weaknesses,
      recommendedPosition: this.recommendPosition(currentAttributes),
      scoutingAccuracy: scoutQuality,
      costToSign: this.estimateTransferCost(currentRating, playerAge),
    };

    this.scoutingData.discoveredTalents.push(report);
    this.scoutingData.scouted.add(playerId);

    return report;
  }

  private recommendPosition(attributes: Record<string, number>): string {
    const positions = [
      { name: 'ST', key: 'shooting' },
      { name: 'CM', key: 'passing' },
      { name: 'CB', key: 'defense' },
      { name: 'RW', key: 'dribbling' },
      { name: 'GK', key: 'reflexes' },
    ];

    let bestPosition = positions[0];
    let maxAttribute = 0;

    for (const pos of positions) {
      const value = attributes[pos.key] || 0;
      if (value > maxAttribute) {
        maxAttribute = value;
        bestPosition = pos;
      }
    }

    return bestPosition.name;
  }

  private estimateTransferCost(rating: number, age: number): number {
    const basePrice = rating * 100000;
    const ageMultiplier = age < 23 ? 1.5 : age > 30 ? 0.5 : 1.0;
    return Math.floor(basePrice * ageMultiplier);
  }

  identifyTalent(minPotential: number = 75): ScoutingReport[] {
    return this.scoutingData.discoveredTalents
      .filter((r) => r.potentialRating >= minPotential)
      .sort((a, b) => b.potentialRating - a.potentialRating);
  }

  improveScoutingQuality(region: string, investment: number): void {
    const currentQuality = this.scoutingData.regionCoverage.get(region) || 0;
    const improvement = Math.min(1, investment / 100000);
    this.scoutingData.regionCoverage.set(region, currentQuality + improvement);
  }

  getDiscoveredTalents(): ScoutingReport[] {
    return [...this.scoutingData.discoveredTalents];
  }

  isScouted(playerId: string): boolean {
    return this.scoutingData.scouted.has(playerId);
  }

  getScoutingCoverage(): Record<string, number> {
    return Object.fromEntries(this.scoutingData.regionCoverage);
  }
}
