/**
 * Advanced Analytics Service
 * Provides heatmaps, player behavior analysis, and prediction models
 */

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-100
  timestamp: number;
  playerId: string;
  eventType: 'pass' | 'shot' | 'tackle' | 'run' | 'dribble';
}

export interface Heatmap {
  id: string;
  playerId: string;
  matchId: string;
  eventType: 'pass' | 'shot' | 'tackle' | 'run' | 'dribble';
  points: HeatmapPoint[];
  gridSize: 10 | 20; // 10x10 or 20x20 grid
  createdAt: number;
  updatedAt: number;
}

export interface PlayerBehavior {
  playerId: string;
  matchId: string;
  passAccuracy: number; // 0-100
  shotAccuracy: number;
  dribbleSucRate: number;
  avgPassLength: number; // meters
  avgRunDistance: number; // meters per match
  pressureResistance: number; // 0-100 (handling pressure)
  creativeIndex: number; // 0-100 (passing variety)
  defensivePresence: number; // 0-100 (tackle/interception rate)
  positioningScore: number; // 0-100 (space awareness)
  consistency: number; // 0-100 (performance variance)
  recordedAt: number;
}

export interface BehaviorPattern {
  id: string;
  playerId: string;
  pattern: 'aggressive' | 'defensive' | 'creative' | 'balanced' | 'unpredictable';
  confidence: number; // 0-100
  triggers: string[]; // conditions that activate pattern
  effectiveness: number; // 0-100
  frequency: number; // times observed
  lastSeen: number;
}

export interface PredictionModel {
  id: string;
  modelType: 'performance' | 'injury_risk' | 'match_outcome' | 'player_rating';
  version: number;
  accuracy: number; // 0-100 historical accuracy
  trainingSamples: number;
  lastTrained: number;
  features: string[];
}

export interface Prediction {
  id: string;
  modelId: string;
  subject: string; // player ID, team ID, or match ID
  prediction: string; // outcome
  confidence: number; // 0-100
  probability: number; // 0-1
  reasoning: string[];
  createdAt: number;
  expiresAt: number;
  verified?: boolean;
  actual?: string;
}

export interface PredictionMetric {
  modelId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number; // 0-100
  calibration: number; // how well confidence aligns with actual results
  lastUpdated: number;
}

export class AdvancedAnalyticsService {
  private heatmaps = new Map<string, Heatmap>();
  private behaviors = new Map<string, PlayerBehavior>();
  private patterns = new Map<string, BehaviorPattern>();
  private models = new Map<string, PredictionModel>();
  private predictions = new Map<string, Prediction>();
  private predictionMetrics = new Map<string, PredictionMetric>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('advancedAnalytics:global');
      if (stored) {
        const data = JSON.parse(stored);
        data.heatmaps?.forEach((h: Heatmap) => this.heatmaps.set(h.id, h));
        data.behaviors?.forEach((b: PlayerBehavior) =>
          this.behaviors.set(`${b.playerId}:${b.matchId}`, b)
        );
        data.patterns?.forEach((p: BehaviorPattern) => this.patterns.set(p.id, p));
        data.models?.forEach((m: PredictionModel) => this.models.set(m.id, m));
        data.predictions?.forEach((p: Prediction) => this.predictions.set(p.id, p));
        data.metrics?.forEach((m: PredictionMetric) =>
          this.predictionMetrics.set(m.modelId, m)
        );
      }
    } catch (error) {
      console.error('Failed to load advanced analytics from storage:', error);
    }
  }

  private saveToStorage() {
    try {
      const data = {
        heatmaps: Array.from(this.heatmaps.values()),
        behaviors: Array.from(this.behaviors.values()),
        patterns: Array.from(this.patterns.values()),
        models: Array.from(this.models.values()),
        predictions: Array.from(this.predictions.values()),
        metrics: Array.from(this.predictionMetrics.values())
      };
      localStorage.setItem('advancedAnalytics:global', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save advanced analytics to storage:', error);
    }
  }

  // ==================== HEATMAP METHODS ====================

  createHeatmap(
    playerId: string,
    matchId: string,
    eventType: Heatmap['eventType'],
    gridSize: 10 | 20 = 10
  ): Heatmap {
    const heatmap: Heatmap = {
      id: `hm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      playerId,
      matchId,
      eventType,
      points: [],
      gridSize,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.heatmaps.set(heatmap.id, heatmap);
    this.saveToStorage();
    return heatmap;
  }

  addHeatmapPoint(heatmapId: string, point: Omit<HeatmapPoint, 'timestamp'>): void {
    const heatmap = this.heatmaps.get(heatmapId);
    if (!heatmap) return;

    const newPoint: HeatmapPoint = {
      ...point,
      timestamp: Date.now()
    };

    heatmap.points.push(newPoint);
    heatmap.updatedAt = Date.now();
    this.saveToStorage();
  }

  getHeatmap(heatmapId: string): Heatmap | undefined {
    return this.heatmaps.get(heatmapId);
  }

  getPlayerHeatmaps(playerId: string, matchId?: string): Heatmap[] {
    return Array.from(this.heatmaps.values()).filter(h => {
      if (h.playerId !== playerId) return false;
      if (matchId && h.matchId !== matchId) return false;
      return true;
    });
  }

  calculateHeatmapIntensity(
    heatmap: Heatmap,
    gridX: number,
    gridY: number
  ): number {
    // Use gaussian distribution for intensity calculation
    let totalIntensity = 0;
    const bandwidth = 2; // gaussian bandwidth

    heatmap.points.forEach(point => {
      const dx = point.x - gridX;
      const dy = point.y - gridY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const gaussian = Math.exp(-(distance * distance) / (2 * bandwidth * bandwidth));
      totalIntensity += gaussian * (point.intensity / 100);
    });

    return Math.min(100, totalIntensity * 100);
  }

  getHeatmapGrid(
    heatmap: Heatmap
  ): number[][] {
    const grid: number[][] = Array(heatmap.gridSize)
      .fill(null)
      .map(() => Array(heatmap.gridSize).fill(0));

    for (let x = 0; x < heatmap.gridSize; x++) {
      for (let y = 0; y < heatmap.gridSize; y++) {
        grid[x][y] = this.calculateHeatmapIntensity(
          heatmap,
          (x / heatmap.gridSize) * 100,
          (y / heatmap.gridSize) * 100
        );
      }
    }

    return grid;
  }

  deleteHeatmap(heatmapId: string): boolean {
    const deleted = this.heatmaps.delete(heatmapId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // ==================== PLAYER BEHAVIOR METHODS ====================

  recordBehavior(
    playerId: string,
    matchId: string,
    behavior: Omit<PlayerBehavior, 'playerId' | 'matchId' | 'recordedAt'>
  ): PlayerBehavior {
    const key = `${playerId}:${matchId}`;
    const playerBehavior: PlayerBehavior = {
      playerId,
      matchId,
      ...behavior,
      recordedAt: Date.now()
    };

    this.behaviors.set(key, playerBehavior);
    this.analyzePatterns(playerBehavior);
    this.saveToStorage();
    return playerBehavior;
  }

  getBehavior(playerId: string, matchId: string): PlayerBehavior | undefined {
    return this.behaviors.get(`${playerId}:${matchId}`);
  }

  getPlayerBehaviorHistory(playerId: string, limit: number = 10): PlayerBehavior[] {
    return Array.from(this.behaviors.values())
      .filter(b => b.playerId === playerId)
      .sort((a, b) => b.recordedAt - a.recordedAt)
      .slice(0, limit);
  }

  getAverageBehavior(playerId: string): Partial<PlayerBehavior> {
    const behaviors = this.getPlayerBehaviorHistory(playerId, 100);
    if (behaviors.length === 0) return {};

    const avg = {
      passAccuracy: behaviors.reduce((sum, b) => sum + b.passAccuracy, 0) / behaviors.length,
      shotAccuracy: behaviors.reduce((sum, b) => sum + b.shotAccuracy, 0) / behaviors.length,
      dribbleSucRate: behaviors.reduce((sum, b) => sum + b.dribbleSucRate, 0) / behaviors.length,
      avgPassLength: behaviors.reduce((sum, b) => sum + b.avgPassLength, 0) / behaviors.length,
      avgRunDistance: behaviors.reduce((sum, b) => sum + b.avgRunDistance, 0) / behaviors.length,
      pressureResistance: behaviors.reduce((sum, b) => sum + b.pressureResistance, 0) / behaviors.length,
      creativeIndex: behaviors.reduce((sum, b) => sum + b.creativeIndex, 0) / behaviors.length,
      defensivePresence: behaviors.reduce((sum, b) => sum + b.defensivePresence, 0) / behaviors.length,
      positioningScore: behaviors.reduce((sum, b) => sum + b.positioningScore, 0) / behaviors.length,
      consistency: behaviors.reduce((sum, b) => sum + b.consistency, 0) / behaviors.length
    };

    return avg;
  }

  // ==================== BEHAVIOR PATTERN METHODS ====================

  private analyzePatterns(behavior: PlayerBehavior): void {
    // Determine primary pattern based on behavior metrics
    let pattern: BehaviorPattern['pattern'];
    let score = 0;

    const aggression = (behavior.dribbleSucRate + behavior.creativeIndex) / 2;
    const defense = (behavior.defensivePresence + (100 - behavior.pressureResistance)) / 2;
    const creativity = behavior.creativeIndex;
    const balance = 50;

    if (aggression > 70) {
      pattern = 'aggressive';
      score = aggression;
    } else if (defense > 70) {
      pattern = 'defensive';
      score = defense;
    } else if (creativity > 70) {
      pattern = 'creative';
      score = creativity;
    } else if (
      Math.abs(aggression - balance) < 10 &&
      Math.abs(defense - balance) < 10
    ) {
      pattern = 'balanced';
      score = 75;
    } else {
      pattern = 'unpredictable';
      score = 50;
    }

    const patternId = `pat_${behavior.playerId}_${behavior.matchId}_${Date.now()}`;
    const newPattern: BehaviorPattern = {
      id: patternId,
      playerId: behavior.playerId,
      pattern,
      confidence: Math.min(100, score),
      triggers: this.identifyTriggers(behavior),
      effectiveness: this.calculateEffectiveness(behavior),
      frequency: 1,
      lastSeen: Date.now()
    };

    // Check if similar pattern exists
    const existingPattern = Array.from(this.patterns.values()).find(
      p => p.playerId === behavior.playerId && p.pattern === pattern
    );

    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.lastSeen = Date.now();
      existingPattern.confidence = Math.min(100, existingPattern.confidence + 5);
    } else {
      this.patterns.set(patternId, newPattern);
    }

    this.saveToStorage();
  }

  private identifyTriggers(behavior: PlayerBehavior): string[] {
    const triggers: string[] = [];

    if (behavior.passAccuracy > 80) triggers.push('high_passing_accuracy');
    if (behavior.pressureResistance < 30) triggers.push('pressure_vulnerable');
    if (behavior.dribbleSucRate > 70) triggers.push('dribbling_threat');
    if (behavior.defensivePresence > 80) triggers.push('defensive_strength');
    if (behavior.consistency < 40) triggers.push('inconsistent_form');
    if (behavior.positioningScore > 80) triggers.push('excellent_positioning');

    return triggers;
  }

  private calculateEffectiveness(behavior: PlayerBehavior): number {
    const weights = {
      passAccuracy: 0.25,
      shotAccuracy: 0.20,
      dribbleSucRate: 0.15,
      defensivePresence: 0.15,
      positioningScore: 0.15,
      creativeIndex: 0.10
    };

    const effectiveness =
      behavior.passAccuracy * weights.passAccuracy +
      behavior.shotAccuracy * weights.shotAccuracy +
      behavior.dribbleSucRate * weights.dribbleSucRate +
      behavior.defensivePresence * weights.defensivePresence +
      behavior.positioningScore * weights.positioningScore +
      behavior.creativeIndex * weights.creativeIndex;

    return Math.round(effectiveness);
  }

  getPattern(patternId: string): BehaviorPattern | undefined {
    return this.patterns.get(patternId);
  }

  getPlayerPatterns(playerId: string): BehaviorPattern[] {
    return Array.from(this.patterns.values()).filter(p => p.playerId === playerId);
  }

  deletePattern(patternId: string): boolean {
    const deleted = this.patterns.delete(patternId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // ==================== PREDICTION MODEL METHODS ====================

  createModel(
    modelType: PredictionModel['modelType'],
    features: string[]
  ): PredictionModel {
    const model: PredictionModel = {
      id: `mdl_${modelType}_${Date.now()}`,
      modelType,
      version: 1,
      accuracy: 0,
      trainingSamples: 0,
      lastTrained: Date.now(),
      features
    };

    this.models.set(model.id, model);
    this.predictionMetrics.set(model.id, {
      modelId: model.id,
      totalPredictions: 0,
      correctPredictions: 0,
      accuracy: 0,
      calibration: 0,
      lastUpdated: Date.now()
    });
    this.saveToStorage();
    return model;
  }

  makePrediction(
    modelId: string,
    subject: string,
    prediction: string,
    confidence: number
  ): Prediction {
    const model = this.models.get(modelId);
    if (!model) throw new Error(`Model ${modelId} not found`);

    const predictionObj: Prediction = {
      id: `pred_${modelId}_${subject}_${Date.now()}`,
      modelId,
      subject,
      prediction,
      confidence: Math.min(100, Math.max(0, confidence)),
      probability: Math.min(1, Math.max(0, confidence / 100)),
      reasoning: [
        `Model version: ${model.version}`,
        `Historical accuracy: ${model.accuracy}%`,
        `Training samples: ${model.trainingSamples}`
      ],
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    this.predictions.set(predictionObj.id, predictionObj);

    // Update model metrics
    const metrics = this.predictionMetrics.get(modelId);
    if (metrics) {
      metrics.totalPredictions++;
      metrics.lastUpdated = Date.now();
    }

    this.saveToStorage();
    return predictionObj;
  }

  verifyPrediction(predictionId: string, actual: string): boolean {
    const prediction = this.predictions.get(predictionId);
    if (!prediction) return false;

    prediction.verified = true;
    prediction.actual = actual;

    const metrics = this.predictionMetrics.get(prediction.modelId);
    if (metrics) {
      metrics.totalPredictions = Math.max(0, metrics.totalPredictions - 1); // Remove from pending
      if (actual === prediction.prediction) {
        metrics.correctPredictions++;
      }
      metrics.accuracy =
        metrics.totalPredictions > 0
          ? Math.round((metrics.correctPredictions / (metrics.correctPredictions + (metrics.totalPredictions - metrics.correctPredictions))) * 100)
          : 0;
      metrics.calibration = this.calculateCalibration(prediction.modelId);
      metrics.lastUpdated = Date.now();
    }

    // Update model accuracy
    const model = this.models.get(prediction.modelId);
    if (model) {
      model.accuracy = metrics?.accuracy ?? 0;
      model.trainingSamples = (metrics?.correctPredictions ?? 0) + (metrics?.totalPredictions ?? 0);
    }

    this.saveToStorage();
    return true;
  }

  private calculateCalibration(modelId: string): number {
    const predictions = Array.from(this.predictions.values()).filter(
      p => p.modelId === modelId && p.verified
    );

    if (predictions.length === 0) return 0;

    let calibrationError = 0;
    predictions.forEach(p => {
      const expected = p.probability;
      const actual = p.actual === p.prediction ? 1 : 0;
      calibrationError += Math.abs(expected - actual);
    });

    return Math.round(100 - (calibrationError / predictions.length) * 100);
  }

  getPrediction(predictionId: string): Prediction | undefined {
    return this.predictions.get(predictionId);
  }

  getModelPredictions(modelId: string, verified: boolean = false): Prediction[] {
    return Array.from(this.predictions.values()).filter(
      p => p.modelId === modelId && (verified ? p.verified : !p.verified)
    );
  }

  getSubjectPredictions(subject: string): Prediction[] {
    return Array.from(this.predictions.values())
      .filter(p => p.subject === subject && !p.verified)
      .filter(p => p.expiresAt > Date.now());
  }

  deletePrediction(predictionId: string): boolean {
    const deleted = this.predictions.delete(predictionId);
    if (deleted) this.saveToStorage();
    return deleted;
  }

  // ==================== MODEL METRICS METHODS ====================

  getModelMetrics(modelId: string): PredictionMetric | undefined {
    return this.predictionMetrics.get(modelId);
  }

  getAllModelMetrics(): PredictionMetric[] {
    return Array.from(this.predictionMetrics.values());
  }

  // ==================== UTILITY METHODS ====================

  getAnalyticsSummary(
    matchId: string
  ): {
    heatmaps: number;
    behaviors: number;
    patterns: number;
    predictions: number;
  } {
    return {
      heatmaps: Array.from(this.heatmaps.values()).filter(h => h.matchId === matchId).length,
      behaviors: Array.from(this.behaviors.values()).filter(b => b.matchId === matchId).length,
      patterns: Array.from(this.patterns.values()).length,
      predictions: Array.from(this.predictions.values()).filter(p => p.expiresAt > Date.now())
        .length
    };
  }

  clearExpiredPredictions(): number {
    const now = Date.now();
    let deleted = 0;

    Array.from(this.predictions.entries()).forEach(([id, pred]) => {
      if (pred.expiresAt < now && pred.verified) {
        this.predictions.delete(id);
        deleted++;
      }
    });

    if (deleted > 0) this.saveToStorage();
    return deleted;
  }

  exportAnalytics(
    matchId: string
  ): {
    heatmaps: Heatmap[];
    behaviors: PlayerBehavior[];
    patterns: BehaviorPattern[];
    predictions: Prediction[];
  } {
    return {
      heatmaps: Array.from(this.heatmaps.values()).filter(h => h.matchId === matchId),
      behaviors: Array.from(this.behaviors.values()).filter(b => b.matchId === matchId),
      patterns: Array.from(this.patterns.values()),
      predictions: Array.from(this.predictions.values())
    };
  }
}

export const advancedAnalytics = new AdvancedAnalyticsService();
