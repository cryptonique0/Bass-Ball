# ML/AI Quick Reference

- Matchmaking: `lib/mlEngine.ts`
  - Register profiles:
    ```ts
    import { matchmakingEngine } from '@/lib/mlEngine';
    matchmakingEngine.registerProfile({ id: 'p1', rating: 1200, skill: 0.6, latencyMs: 50, region: 'us', stats: { winrate: 0.52, accuracy: 0.48 } });
    matchmakingEngine.registerProfile({ id: 'p2', rating: 1180, skill: 0.58, latencyMs: 60, region: 'us' });
    matchmakingEngine.rebuildClusters();
    const matches = matchmakingEngine.findMatches({ playerId: 'p1', maxLatencyMs: 120, regionPreference: 'us', tolerance: 200 });
    ```

- Fraud detection: `lib/mlEngine.ts`
  - Analyze events:
    ```ts
    import { fraudDetector } from '@/lib/mlEngine';
    const analysis = fraudDetector.analyze([
      { timestamp: Date.now(), type: 'login' },
      { timestamp: Date.now() + 100, type: 'reward_claim', value: 5000 },
    ], { id: 'p1', rating: 1300, skill: 0.6, stats: { winrate: 0.96 } });
    ```

- Recommendations: `lib/recommendationEngine.ts`
  - Define items and interactions:
    ```ts
    import { recommendationEngine } from '@/lib/recommendationEngine';
    recommendationEngine.upsertItem({ id: 'arena', tags: ['fast','team'], attributes: { difficulty: 0.5, pace: 0.9 } });
    recommendationEngine.upsertItem({ id: 'survival', tags: ['solo','strategy'], attributes: { difficulty: 0.7, pace: 0.4 } });
    recommendationEngine.rebuildItemSimilarities();
    recommendationEngine.recordInteraction('p1', 'arena', 'play', 1.0);
    const recs = recommendationEngine.getRecommendations('p1', 5);
    ```
