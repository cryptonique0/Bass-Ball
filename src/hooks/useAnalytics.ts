'use client';

import { useCallback, useEffect, useState } from 'react';
import { advancedAnalytics, Heatmap, PlayerBehavior, BehaviorPattern, Prediction, PredictionMetric } from '@/services/analytics-advanced';
import { metaAnalytics, FormationStats, Strategy, MetaTrend, PlayerRole, RolePerformance } from '@/lib/metaAnalytics';

// Heatmap Hook
export function useHeatmaps(playerId?: string, matchId?: string) {
  const [heatmaps, setHeatmaps] = useState<Heatmap[]>([]);
  const [selectedHeatmap, setSelectedHeatmap] = useState<Heatmap | null>(null);
  const [heatmapGrid, setHeatmapGrid] = useState<number[][] | null>(null);

  useEffect(() => {
    if (playerId) {
      const playerHeatmaps = advancedAnalytics.getPlayerHeatmaps(playerId, matchId);
      setHeatmaps(playerHeatmaps);
    }
  }, [playerId, matchId]);

  const createHeatmap = useCallback((eventType: any) => {
    if (!playerId) return;
    const heatmap = advancedAnalytics.createHeatmap(playerId, matchId || '', eventType);
    setHeatmaps(prev => [...prev, heatmap]);
    return heatmap;
  }, [playerId, matchId]);

  const addPoint = useCallback((heatmapId: string, x: number, y: number, intensity: number, eventType: any) => {
    advancedAnalytics.addHeatmapPoint(heatmapId, {
      x,
      y,
      intensity,
      playerId: playerId || '',
      eventType
    });
    setHeatmaps(prev => prev.map(h => 
      h.id === heatmapId ? advancedAnalytics.getHeatmap(heatmapId) || h : h
    ).filter(Boolean) as Heatmap[]);
  }, [playerId]);

  const selectHeatmap = useCallback((heatmap: Heatmap) => {
    setSelectedHeatmap(heatmap);
    const grid = advancedAnalytics.getHeatmapGrid(heatmap);
    setHeatmapGrid(grid);
  }, []);

  const deleteHeatmap = useCallback((heatmapId: string) => {
    advancedAnalytics.deleteHeatmap(heatmapId);
    setHeatmaps(prev => prev.filter(h => h.id !== heatmapId));
    if (selectedHeatmap && selectedHeatmap.id === heatmapId) {
      setSelectedHeatmap(null);
      setHeatmapGrid(null);
    }
  }, [selectedHeatmap]);

  return {
    heatmaps,
    selectedHeatmap,
    heatmapGrid,
    createHeatmap,
    addPoint,
    selectHeatmap,
    deleteHeatmap
  };
}

// Player Behavior Hook
export function useBehaviorAnalytics(playerId: string) {
  const [currentBehavior, setCurrentBehavior] = useState<PlayerBehavior | null>(null);
  const [behaviorHistory, setBehaviorHistory] = useState<PlayerBehavior[]>([]);
  const [averageBehavior, setAverageBehavior] = useState<Partial<PlayerBehavior>>({});
  const [patterns, setPatterns] = useState<BehaviorPattern[]>([]);

  useEffect(() => {
    if (playerId) {
      setBehaviorHistory(advancedAnalytics.getPlayerBehaviorHistory(playerId));
      setAverageBehavior(advancedAnalytics.getAverageBehavior(playerId));
      setPatterns(advancedAnalytics.getPlayerPatterns(playerId));
    }
  }, [playerId]);

  const recordBehavior = useCallback((matchId: string, behavior: any) => {
    const recorded = advancedAnalytics.recordBehavior(playerId, matchId, behavior);
    setCurrentBehavior(recorded);
    setBehaviorHistory(advancedAnalytics.getPlayerBehaviorHistory(playerId));
    setAverageBehavior(advancedAnalytics.getAverageBehavior(playerId));
    setPatterns(advancedAnalytics.getPlayerPatterns(playerId));
    return recorded;
  }, [playerId]);

  const deletePattern = useCallback((patternId: string) => {
    advancedAnalytics.deletePattern(patternId);
    setPatterns(prev => prev.filter(p => p.id !== patternId));
  }, []);

  return {
    currentBehavior,
    behaviorHistory,
    averageBehavior,
    patterns,
    recordBehavior,
    deletePattern
  };
}

// Prediction Hook
export function usePredictions() {
  const [models, setModels] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [metrics, setMetrics] = useState<PredictionMetric[]>([]);

  useEffect(() => {
    setMetrics(advancedAnalytics.getAllModelMetrics());
  }, []);

  const createModel = useCallback((modelType: any, features: string[]) => {
    const model = advancedAnalytics.createModel(modelType, features);
    setModels(prev => [...prev, model]);
    setMetrics(advancedAnalytics.getAllModelMetrics());
    return model;
  }, []);

  const makePrediction = useCallback((modelId: string, subject: string, prediction: string, confidence: number) => {
    const pred = advancedAnalytics.makePrediction(modelId, subject, prediction, confidence);
    setPredictions(prev => [...prev, pred]);
    return pred;
  }, []);

  const verifyPrediction = useCallback((predictionId: string, actual: string) => {
    advancedAnalytics.verifyPrediction(predictionId, actual);
    setPredictions(prev => prev.filter(p => p.id !== predictionId));
    setMetrics(advancedAnalytics.getAllModelMetrics());
  }, []);

  const deletePrediction = useCallback((predictionId: string) => {
    advancedAnalytics.deletePrediction(predictionId);
    setPredictions(prev => prev.filter(p => p.id !== predictionId));
  }, []);

  const clearExpired = useCallback(() => {
    const count = advancedAnalytics.clearExpiredPredictions();
    setMetrics(advancedAnalytics.getAllModelMetrics());
    return count;
  }, []);

  return {
    models,
    predictions,
    metrics,
    createModel,
    makePrediction,
    verifyPrediction,
    deletePrediction,
    clearExpired
  };
}

// Meta-Game Hook
export function useMetaAnalytics() {
  const [formations, setFormations] = useState<FormationStats[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trends, setTrends] = useState<MetaTrend[]>([]);
  const [playerRoles, setPlayerRoles] = useState<PlayerRole[]>([]);
  const [metaSummary, setMetaSummary] = useState<any>(null);

  useEffect(() => {
    setFormations(metaAnalytics.getTopFormations(10));
    setStrategies(metaAnalytics.getAllStrategies());
    setTrends(metaAnalytics.getTrends());
    setPlayerRoles(metaAnalytics.getAllPlayerRoles());
    setMetaSummary(metaAnalytics.getMetaSummary());
  }, []);

  const recordFormationMatch = useCallback((formationId: string, result: any, stats: any) => {
    metaAnalytics.recordFormationMatch(formationId, result, stats);
    setFormations(metaAnalytics.getTopFormations(10));
    setMetaSummary(metaAnalytics.getMetaSummary());
  }, []);

  const createStrategy = useCallback((name: string, formationId: string, tactics: string[], strength: string, weakness: string) => {
    const strategy = metaAnalytics.createStrategy(name, formationId, tactics, strength, weakness);
    setStrategies(prev => [...prev, strategy]);
    return strategy;
  }, []);

  const recordTrend = useCallback((type: any, trend: string, popularity: number, successRate: number) => {
    metaAnalytics.recordTrend(type, trend, popularity, successRate);
    setTrends(metaAnalytics.getTrends());
    setMetaSummary(metaAnalytics.getMetaSummary());
  }, []);

  const createPlayerRole = useCallback((name: string, position: string, skills: string[], responsibilities: string[], offensive: number, defensive: number) => {
    const role = metaAnalytics.createPlayerRole(name, position, skills, responsibilities, offensive, defensive);
    setPlayerRoles(prev => [...prev, role]);
    return role;
  }, []);

  return {
    formations,
    strategies,
    trends,
    playerRoles,
    metaSummary,
    recordFormationMatch,
    createStrategy,
    recordTrend,
    createPlayerRole
  };
}

// Combined Analytics Hook
export function useAdvancedAnalytics(playerId?: string, matchId?: string) {
  const heatmaps = useHeatmaps(playerId, matchId);
  const behavior = useBehaviorAnalytics(playerId || '');
  const predictions = usePredictions();
  const meta = useMetaAnalytics();

  return {
    heatmaps,
    behavior,
    predictions,
    meta
  };
}
