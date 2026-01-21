/**
 * Admin React Hooks
 * useInvestigation, useEconomicMonitoring, useFeatureFlags
 * Integration with admin services
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { economicMonitoringService } from '@/lib/economicMonitoring';
import { featureFlagService } from '@/lib/featureFlagSystem';

// ============================================================================
// useInvestigation HOOK
// ============================================================================

export function useInvestigation(playerId?: string) {
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [selectedInvestigation, setSelectedInvestigation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInvestigations = useCallback(async () => {
    setLoading(true);
    try {
      // Placeholder - would fetch from API
      setInvestigations([]);
    } catch (error) {
      console.error('Failed to fetch investigations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addViolation = useCallback(
    (playerId: string, violationData: any) => {
      setInvestigations((prev) =>
        prev.map((inv) =>
          inv.playerId === playerId
            ? { ...inv, violations: [...inv.violations, violationData] }
            : inv
        )
      );
    },
    []
  );

  const addNote = useCallback(
    (playerId: string, note: any) => {
      setInvestigations((prev) =>
        prev.map((inv) =>
          inv.playerId === playerId
            ? { ...inv, investigationNotes: [...inv.investigationNotes, note] }
            : inv
        )
      );
    },
    []
  );

  const updateInvestigationStatus = useCallback(
    (playerId: string, status: string) => {
      setInvestigations((prev) =>
        prev.map((inv) =>
          inv.playerId === playerId ? { ...inv, investigationStatus: status } : inv
        )
      );
    },
    []
  );

  const takeAction = useCallback(
    (playerId: string, action: any) => {
      setInvestigations((prev) =>
        prev.map((inv) =>
          inv.playerId === playerId
            ? {
                ...inv,
                violations: inv.violations.map((v: any) =>
                  v.id === action.violationId ? { ...v, resolution: action } : v
                ),
              }
            : inv
        )
      );
    },
    []
  );

  useEffect(() => {
    fetchInvestigations();
  }, [fetchInvestigations]);

  useEffect(() => {
    if (playerId) {
      const investigation = investigations.find((inv) => inv.playerId === playerId);
      setSelectedInvestigation(investigation);
    }
  }, [playerId, investigations]);

  return {
    investigations,
    selectedInvestigation,
    loading,
    fetchInvestigations,
    addViolation,
    addNote,
    updateInvestigationStatus,
    takeAction,
  };
}

// ============================================================================
// useEconomicMonitoring HOOK
// ============================================================================

export function useEconomicMonitoring() {
  const [playerProfiles, setPlayerProfiles] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [supply, setSupply] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPlayerProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const profiles = economicMonitoringService.getAllPlayerProfiles();
      setPlayerProfiles(profiles);
    } catch (error) {
      console.error('Failed to fetch player profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback((dayCount: number = 1) => {
    try {
      const metrics = economicMonitoringService.calculateRewardMetrics(dayCount);
      setMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  }, []);

  const fetchAnomalies = useCallback((reviewed?: boolean) => {
    try {
      const anomalies = economicMonitoringService.getAnomalies(reviewed);
      setAnomalies(anomalies);
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    }
  }, []);

  const fetchSupply = useCallback(() => {
    try {
      const supply = economicMonitoringService.getTokenSupply();
      setSupply(supply);
    } catch (error) {
      console.error('Failed to fetch supply:', error);
    }
  }, []);

  const generateReport = useCallback((period: 'daily' | 'weekly' | 'monthly') => {
    try {
      const report = economicMonitoringService.generateEconomicReport(period);
      setReport(report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }, []);

  const recordTransaction = useCallback(
    (playerId: string, type: any, amount: number, source: string, reason: string) => {
      try {
        const txId = economicMonitoringService.recordTransaction(
          playerId,
          type,
          amount,
          source,
          reason
        );
        return txId;
      } catch (error) {
        console.error('Failed to record transaction:', error);
        return null;
      }
    },
    []
  );

  const getSuspiciousPlayers = useCallback((threshold?: number) => {
    try {
      return economicMonitoringService.getSuspiciousPlayers(threshold);
    } catch (error) {
      console.error('Failed to get suspicious players:', error);
      return [];
    }
  }, []);

  const getInflationIndicators = useCallback(() => {
    try {
      return economicMonitoringService.getInflationIndicators();
    } catch (error) {
      console.error('Failed to get inflation indicators:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    fetchPlayerProfiles();
    fetchMetrics();
    fetchAnomalies();
    fetchSupply();
  }, [fetchPlayerProfiles, fetchMetrics, fetchAnomalies, fetchSupply]);

  return {
    playerProfiles,
    metrics,
    anomalies,
    supply,
    report,
    loading,
    fetchPlayerProfiles,
    fetchMetrics,
    fetchAnomalies,
    fetchSupply,
    generateReport,
    recordTransaction,
    getSuspiciousPlayers,
    getInflationIndicators,
  };
}

// ============================================================================
// useFeatureFlags HOOK
// ============================================================================

export function useFeatureFlags() {
  const [flags, setFlags] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [userConfig, setUserConfig] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const allFlags = featureFlagService.getAllFlags();
      setFlags(allFlags);
    } catch (error) {
      console.error('Failed to fetch flags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const allAnalytics = featureFlagService.getAllAnalytics();
      setAnalytics(allAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  }, []);

  const evaluateFlag = useCallback(
    (flagId: string, userId: string, context?: Record<string, unknown>) => {
      try {
        const config = featureFlagService.evaluateFlag(flagId, userId, context);
        setUserConfig(config);
        return config;
      } catch (error) {
        console.error('Failed to evaluate flag:', error);
        return null;
      }
    },
    []
  );

  const createFlag = useCallback(
    (id: string, name: string, description: string, options?: any) => {
      try {
        const flag = featureFlagService.createFlag(id, name, description, options);
        setFlags((prev) => [...prev, flag]);
        return flag;
      } catch (error) {
        console.error('Failed to create flag:', error);
        return null;
      }
    },
    []
  );

  const updateFlag = useCallback(
    (id: string, updates: any) => {
      try {
        const flag = featureFlagService.updateFlag(id, updates);
        if (flag) {
          setFlags((prev) => prev.map((f) => (f.id === id ? flag : f)));
        }
        return flag;
      } catch (error) {
        console.error('Failed to update flag:', error);
        return null;
      }
    },
    []
  );

  const deleteFlag = useCallback(
    (id: string) => {
      try {
        const success = featureFlagService.deleteFlag(id);
        if (success) {
          setFlags((prev) => prev.filter((f) => f.id !== id));
        }
        return success;
      } catch (error) {
        console.error('Failed to delete flag:', error);
        return false;
      }
    },
    []
  );

  const addRule = useCallback(
    (flagId: string, condition: string, value: boolean, priority?: number) => {
      try {
        const rule = featureFlagService.addRule(flagId, condition, value, priority);
        if (rule) {
          setFlags((prev) =>
            prev.map((f) => (f.id === flagId ? { ...f, rules: [...f.rules, rule] } : f))
          );
        }
        return rule;
      } catch (error) {
        console.error('Failed to add rule:', error);
        return null;
      }
    },
    []
  );

  const createProgressiveRollout = useCallback(
    (flagId: string, stages: any) => {
      try {
        const rollout = featureFlagService.createProgressiveRollout(flagId, stages);
        return rollout;
      } catch (error) {
        console.error('Failed to create progressive rollout:', error);
        return null;
      }
    },
    []
  );

  const createABTest = useCallback(
    (id: string, name: string, controlFlagId: string, treatmentFlagId: string, split?: number) => {
      try {
        const test = featureFlagService.createABTest(
          id,
          name,
          controlFlagId,
          treatmentFlagId,
          split
        );
        return test;
      } catch (error) {
        console.error('Failed to create A/B test:', error);
        return null;
      }
    },
    []
  );

  const fetchEvents = useCallback((flagId?: string, limit?: number) => {
    try {
      const allEvents = featureFlagService.getEvents(flagId, limit);
      setEvents(allEvents);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
    fetchAnalytics();
  }, [fetchFlags, fetchAnalytics]);

  return {
    flags,
    analytics,
    userConfig,
    events,
    loading,
    fetchFlags,
    fetchAnalytics,
    evaluateFlag,
    createFlag,
    updateFlag,
    deleteFlag,
    addRule,
    createProgressiveRollout,
    createABTest,
    fetchEvents,
  };
}

// ============================================================================
// Combined Hook - useAdmin
// ============================================================================

export function useAdmin() {
  const investigation = useInvestigation();
  const economicMonitoring = useEconomicMonitoring();
  const featureFlags = useFeatureFlags();

  return {
    investigation,
    economicMonitoring,
    featureFlags,
  };
}
