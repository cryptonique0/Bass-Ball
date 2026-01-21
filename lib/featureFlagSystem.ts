/**
 * Feature Flag System
 * Manages feature toggles, progressive rollouts, A/B testing, and rule-based feature control
 * Enables safe feature deployment and experimentation
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  rolloutType: 'all' | 'percentage' | 'whitelist' | 'blacklist' | 'rule_based';
  targetSegments: string[]; // User segments to target
  rules: FlagRule[];
  abTest?: ABTest;
  createdAt: number;
  updatedAt: number;
  deployedAt?: number;
}

export interface FlagRule {
  id: string;
  condition: string; // e.g., "userLevel === 'premium'" or "region === 'US'"
  value: boolean; // Enable or disable for this rule
  priority: number; // Higher priority rules evaluated first
}

export interface ABTestMetrics {
  controlGroup: {
    usersExposed: number;
    conversionRate: number;
    avgEngagementTime: number;
  };
  treatmentGroup: {
    usersExposed: number;
    conversionRate: number;
    avgEngagementTime: number;
  };
  statisticalSignificance: number; // 0-100, confidence %
  updatedAt: number;
}

export interface ABTest {
  id: string;
  name: string;
  controlVersion: string; // Feature flag ID for control group
  treatmentVersion: string; // Feature flag ID for treatment group
  splitPercentage: number; // Split between control/treatment
  metrics: ABTestMetrics;
  startedAt: number;
  endedAt?: number;
  winner?: 'control' | 'treatment';
}

export interface FeatureFlagConfig {
  flagId: string;
  userId: string;
  enabled: boolean;
  version: string;
  abTestVariant?: 'control' | 'treatment';
  reason: string;
}

export interface ProgressiveRollout {
  flagId: string;
  stages: RolloutStage[];
  currentStage: number;
  deployedAt: number;
}

export interface RolloutStage {
  name: string;
  percentage: number;
  duration: number; // milliseconds
  conditions?: string[];
  rollbackOnError?: boolean;
}

export interface FeatureFlagAnalytics {
  flagId: string;
  totalEvaluations: number;
  enabledEvaluations: number;
  disabledEvaluations: number;
  enabledPercentage: number;
  affectedUsers: Set<string>;
  lastEvaluatedAt: number;
  errors: FlagEvaluationError[];
}

export interface FlagEvaluationError {
  timestamp: number;
  flagId: string;
  userId: string;
  error: string;
}

export interface FeatureFlagEvent {
  id: string;
  flagId: string;
  userId: string;
  eventType: 'enabled' | 'disabled' | 'viewed' | 'interacted';
  metadata: Record<string, unknown>;
  timestamp: number;
}

export interface FeatureFlagTarget {
  type: 'user' | 'segment' | 'percentage' | 'geo' | 'device';
  value: string | number;
  enabled: boolean;
}

export interface RolloutStrategy {
  type: 'linear' | 'exponential' | 'custom';
  duration: number;
  maxPercentage: number;
  checkpointPercentages: number[];
  rollbackThreshold?: number;
}

// ============================================================================
// FEATURE FLAG SERVICE
// ============================================================================

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private userConfigs: Map<string, FeatureFlagConfig> = new Map();
  private analytics: Map<string, FeatureFlagAnalytics> = new Map();
  private events: FeatureFlagEvent[] = [];
  private rollouts: Map<string, ProgressiveRollout> = new Map();
  private abTests: Map<string, ABTest> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  // ========================================================================
  // FEATURE FLAG CREATION & MANAGEMENT
  // ========================================================================

  createFlag(
    id: string,
    name: string,
    description: string,
    options?: {
      enabled?: boolean;
      rolloutPercentage?: number;
      rolloutType?: FeatureFlag['rolloutType'];
      targetSegments?: string[];
    }
  ): FeatureFlag {
    const flag: FeatureFlag = {
      id,
      name,
      description,
      enabled: options?.enabled ?? false,
      rolloutPercentage: options?.rolloutPercentage ?? 0,
      rolloutType: options?.rolloutType ?? 'all',
      targetSegments: options?.targetSegments ?? [],
      rules: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.flags.set(id, flag);
    this.initializeAnalytics(id);
    this.saveToStorage();
    return flag;
  }

  updateFlag(id: string, updates: Partial<FeatureFlag>): FeatureFlag | undefined {
    const flag = this.flags.get(id);
    if (!flag) return undefined;

    Object.assign(flag, updates, { updatedAt: Date.now() });
    this.saveToStorage();
    return flag;
  }

  deleteFlag(id: string): boolean {
    const deleted = this.flags.delete(id);
    if (deleted) {
      this.userConfigs.forEach((config, key) => {
        if (config.flagId === id) {
          this.userConfigs.delete(key);
        }
      });
      this.saveToStorage();
    }
    return deleted;
  }

  getFlag(id: string): FeatureFlag | undefined {
    return this.flags.get(id);
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  getFlagsByStatus(enabled: boolean): FeatureFlag[] {
    return this.getAllFlags().filter((flag) => flag.enabled === enabled);
  }

  // ========================================================================
  // FEATURE FLAG RULES
  // ========================================================================

  addRule(flagId: string, condition: string, value: boolean, priority: number = 0): FlagRule | undefined {
    const flag = this.flags.get(flagId);
    if (!flag) return undefined;

    const rule: FlagRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      condition,
      value,
      priority,
    };

    flag.rules.push(rule);
    flag.rules.sort((a, b) => b.priority - a.priority); // Sort by priority
    this.saveToStorage();
    return rule;
  }

  removeRule(flagId: string, ruleId: string): boolean {
    const flag = this.flags.get(flagId);
    if (!flag) return false;

    const index = flag.rules.findIndex((r) => r.id === ruleId);
    if (index > -1) {
      flag.rules.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  updateRule(flagId: string, ruleId: string, updates: Partial<FlagRule>): FlagRule | undefined {
    const flag = this.flags.get(flagId);
    if (!flag) return undefined;

    const rule = flag.rules.find((r) => r.id === ruleId);
    if (!rule) return undefined;

    Object.assign(rule, updates);
    if (updates.priority !== undefined) {
      flag.rules.sort((a, b) => b.priority - a.priority);
    }
    this.saveToStorage();
    return rule;
  }

  // ========================================================================
  // PROGRESSIVE ROLLOUT
  // ========================================================================

  createProgressiveRollout(
    flagId: string,
    stages: RolloutStage[],
    options?: { deployedAt?: number }
  ): ProgressiveRollout {
    const rollout: ProgressiveRollout = {
      flagId,
      stages,
      currentStage: 0,
      deployedAt: options?.deployedAt ?? Date.now(),
    };

    this.rollouts.set(flagId, rollout);

    // Auto-advance stages based on timing
    this.scheduleRolloutAdvance(flagId);

    this.saveToStorage();
    return rollout;
  }

  private scheduleRolloutAdvance(flagId: string): void {
    const rollout = this.rollouts.get(flagId);
    if (!rollout || rollout.currentStage >= rollout.stages.length - 1) return;

    const currentStage = rollout.stages[rollout.currentStage];
    setTimeout(() => {
      this.advanceRolloutStage(flagId);
    }, currentStage.duration);
  }

  advanceRolloutStage(flagId: string): boolean {
    const rollout = this.rollouts.get(flagId);
    if (!rollout || rollout.currentStage >= rollout.stages.length - 1) return false;

    rollout.currentStage++;
    const stage = rollout.stages[rollout.currentStage];

    // Update flag with new rollout percentage
    const flag = this.flags.get(flagId);
    if (flag) {
      flag.rolloutPercentage = stage.percentage;
      flag.updatedAt = Date.now();
    }

    this.saveToStorage();
    this.scheduleRolloutAdvance(flagId);
    return true;
  }

  getRollout(flagId: string): ProgressiveRollout | undefined {
    return this.rollouts.get(flagId);
  }

  getCurrentStage(flagId: string): RolloutStage | undefined {
    const rollout = this.rollouts.get(flagId);
    if (!rollout) return undefined;
    return rollout.stages[rollout.currentStage];
  }

  // ========================================================================
  // A/B TESTING
  // ========================================================================

  createABTest(
    id: string,
    name: string,
    controlFlagId: string,
    treatmentFlagId: string,
    splitPercentage: number = 50
  ): ABTest {
    const abTest: ABTest = {
      id,
      name,
      controlVersion: controlFlagId,
      treatmentVersion: treatmentFlagId,
      splitPercentage,
      metrics: {
        controlGroup: {
          usersExposed: 0,
          conversionRate: 0,
          avgEngagementTime: 0,
        },
        treatmentGroup: {
          usersExposed: 0,
          conversionRate: 0,
          avgEngagementTime: 0,
        },
        statisticalSignificance: 0,
        updatedAt: Date.now(),
      },
      startedAt: Date.now(),
    };

    this.abTests.set(id, abTest);
    this.saveToStorage();
    return abTest;
  }

  getABTest(id: string): ABTest | undefined {
    return this.abTests.get(id);
  }

  endABTest(id: string, winner: 'control' | 'treatment'): ABTest | undefined {
    const test = this.abTests.get(id);
    if (!test) return undefined;

    test.endedAt = Date.now();
    test.winner = winner;
    this.saveToStorage();
    return test;
  }

  updateABTestMetrics(id: string, updates: Partial<ABTestMetrics>): ABTest | undefined {
    const test = this.abTests.get(id);
    if (!test) return undefined;

    Object.assign(test.metrics, updates, { updatedAt: Date.now() });
    this.saveToStorage();
    return test;
  }

  recordABTestExposure(testId: string, userId: string, variant: 'control' | 'treatment'): void {
    const test = this.abTests.get(testId);
    if (!test) return;

    if (variant === 'control') {
      test.metrics.controlGroup.usersExposed++;
    } else {
      test.metrics.treatmentGroup.usersExposed++;
    }

    this.recordEvent({
      flagId: variant === 'control' ? test.controlVersion : test.treatmentVersion,
      userId,
      eventType: 'viewed',
      timestamp: Date.now(),
      metadata: { abTestId: testId, variant },
    });;
  }

  // ========================================================================
  // FLAG EVALUATION
  // ========================================================================

  evaluateFlag(flagId: string, userId: string, context?: Record<string, unknown>): FeatureFlagConfig {
    const flag = this.flags.get(flagId);
    const configKey = `${userId}:${flagId}`;

    if (!flag) {
      return {
        flagId,
        userId,
        enabled: false,
        version: 'unknown',
        reason: 'Flag not found',
      };
    }

    try {
      // Check if already evaluated for this user
      const cached = this.userConfigs.get(configKey);
      if (cached) {
        return cached;
      }

      let enabled = false;
      let reason = '';
      let abTestVariant: 'control' | 'treatment' | undefined;

      // 1. Check global enabled status
      if (!flag.enabled) {
        enabled = false;
        reason = 'Flag globally disabled';
      }
      // 2. Check rules first (highest priority)
      else if (flag.rules.length > 0) {
        for (const rule of flag.rules) {
          if (this.evaluateCondition(rule.condition, context)) {
            enabled = rule.value;
            reason = `Rule matched: ${rule.condition}`;
            break;
          }
        }
      }
      // 3. Check rollout percentage
      else if (flag.rolloutType === 'percentage') {
        enabled = this.hashUserId(userId) < flag.rolloutPercentage;
        reason = `Percentage rollout: ${flag.rolloutPercentage}%`;
      }
      // 4. Check A/B test assignment
      else if (flag.abTest) {
        const variant = this.hashUserId(userId) < flag.abTest.splitPercentage ? 'control' : 'treatment';
        abTestVariant = variant;
        enabled = true;
        reason = `A/B test: ${variant}`;
      }
      // 5. Check whitelist/blacklist
      else if (flag.rolloutType === 'whitelist' && flag.targetSegments.length > 0) {
        enabled = flag.targetSegments.includes(userId);
        reason = enabled ? 'Whitelisted user' : 'Not whitelisted';
      } else if (flag.rolloutType === 'blacklist' && flag.targetSegments.length > 0) {
        enabled = !flag.targetSegments.includes(userId);
        reason = enabled ? 'Not blacklisted' : 'Blacklisted user';
      } else {
        enabled = flag.rolloutPercentage > 0 && this.hashUserId(userId) < flag.rolloutPercentage;
        reason = `General rollout: ${flag.rolloutPercentage}%`;
      }

      const config: FeatureFlagConfig = {
        flagId,
        userId,
        enabled,
        version: flag.id,
        abTestVariant,
        reason,
      };

      // Cache for this request
      this.userConfigs.set(configKey, config);

      // Update analytics
      this.recordEvaluation(flagId, userId, enabled);

      // Record event
      this.recordEvent({
        flagId,
        userId,
        eventType: enabled ? 'enabled' : 'disabled',
        timestamp: Date.now(),
        metadata: { reason, context },
      });

      return config;
    } catch (error) {
      this.recordError(flagId, userId, String(error));
      return {
        flagId,
        userId,
        enabled: false,
        version: flag.id,
        reason: 'Error evaluating flag',
      };
    }
  }

  private evaluateCondition(condition: string, context?: Record<string, unknown>): boolean {
    if (!context) return false;

    try {
      // Simple condition evaluation - can be extended for complex expressions
      // Format: "key === 'value'" or "key > number"
      const parts = condition.split(/\s*(===|==|!==|!=|>|<|>=|<=)\s*/);
      if (parts.length < 3) return false;

      const key = parts[0].trim();
      const operator = parts[1].trim();
      const value = parts[2].trim();

      const contextValue = context[key];
      const compareValue = isNaN(Number(value)) ? value.replace(/['"]/g, '') : Number(value);

      switch (operator) {
        case '===':
        case '==':
          return contextValue === compareValue;
        case '!==':
        case '!=':
          return contextValue !== compareValue;
        case '>':
          return Number(contextValue) > Number(compareValue);
        case '<':
          return Number(contextValue) < Number(compareValue);
        case '>=':
          return Number(contextValue) >= Number(compareValue);
        case '<=':
          return Number(contextValue) <= Number(compareValue);
        default:
          return false;
      }
    } catch (error) {
      return false;
    }
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  // ========================================================================
  // ANALYTICS & MONITORING
  // ========================================================================

  private recordEvaluation(flagId: string, userId: string, enabled: boolean): void {
    const analytics = this.analytics.get(flagId);
    if (!analytics) return;

    analytics.totalEvaluations++;
    if (enabled) {
      analytics.enabledEvaluations++;
    } else {
      analytics.disabledEvaluations++;
    }

    analytics.affectedUsers.add(userId);
    analytics.lastEvaluatedAt = Date.now();

    analytics.enabledPercentage =
      (analytics.enabledEvaluations / analytics.totalEvaluations) * 100;
  }

  private initializeAnalytics(flagId: string): void {
    this.analytics.set(flagId, {
      flagId,
      totalEvaluations: 0,
      enabledEvaluations: 0,
      disabledEvaluations: 0,
      enabledPercentage: 0,
      affectedUsers: new Set(),
      lastEvaluatedAt: 0,
      errors: [],
    });
  }

  private recordError(flagId: string, userId: string, error: string): void {
    const analytics = this.analytics.get(flagId);
    if (!analytics) return;

    analytics.errors.push({
      timestamp: Date.now(),
      flagId,
      userId,
      error,
    });

    // Keep only last 100 errors
    if (analytics.errors.length > 100) {
      analytics.errors = analytics.errors.slice(-100);
    }
  }

  private recordEvent(event: Omit<FeatureFlagEvent, 'id'>): void {
    const eventRecord: FeatureFlagEvent = {
      ...event,
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    this.events.push(eventRecord);

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }
  }

  getAnalytics(flagId: string): FeatureFlagAnalytics | undefined {
    return this.analytics.get(flagId);
  }

  getAllAnalytics(): FeatureFlagAnalytics[] {
    return Array.from(this.analytics.values());
  }

  getEvents(flagId?: string, limit: number = 100): FeatureFlagEvent[] {
    let filtered = this.events;
    if (flagId) {
      filtered = filtered.filter((e) => e.flagId === flagId);
    }
    return filtered.slice(-limit);
  }

  // ========================================================================
  // PERSISTENCE
  // ========================================================================

  private saveToStorage(): void {
    const data = {
      flags: Array.from(this.flags.entries()),
      analytics: Array.from(this.analytics.entries()).map(([key, value]) => [
        key,
        {
          ...value,
          affectedUsers: Array.from(value.affectedUsers),
        },
      ]),
      rollouts: Array.from(this.rollouts.entries()),
      abTests: Array.from(this.abTests.entries()),
      events: this.events,
    };
    localStorage.setItem('featureFlagSystem:global', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    try {
      const data = JSON.parse(localStorage.getItem('featureFlagSystem:global') || '{}');
      if (data.flags) {
        this.flags = new Map(data.flags);
      }
      if (data.analytics) {
        this.analytics = new Map(
          data.analytics.map(([key, value]: [string, any]) => [
            key,
            {
              ...value,
              affectedUsers: new Set(value.affectedUsers),
            },
          ])
        );
      }
      if (data.rollouts) {
        this.rollouts = new Map(data.rollouts);
      }
      if (data.abTests) {
        this.abTests = new Map(data.abTests);
      }
      if (data.events) {
        this.events = data.events;
      }
    } catch (error) {
      console.warn('Failed to load feature flag data:', error);
    }
  }

  exportData(): Record<string, unknown> {
    return {
      flags: Array.from(this.flags.values()),
      analytics: Array.from(this.analytics.values()),
      rollouts: Array.from(this.rollouts.values()),
      abTests: Array.from(this.abTests.values()),
      events: this.events,
    };
  }

  clearOldData(daysOld: number = 30): void {
    const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    this.events = this.events.filter((e) => e.timestamp > cutoffTime);
    this.saveToStorage();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

const featureFlagService = new FeatureFlagService();
export { featureFlagService };
