'use client';

import { useState, useEffect } from 'react';
import { useAdvancedAnalytics } from '@/hooks/useAnalytics';
import type { Heatmap, PlayerBehavior, BehaviorPattern, Prediction, PredictionMetric } from '@/services/analytics-advanced';
import type { FormationStats, MetaTrend, PlayerRole } from '@/lib/metaAnalytics';
import styles from './analytics-demo.module.css';

const demoUserId = 'player_demo_001';
const demoMatchId = 'match_demo_001';

export default function AnalyticsDemo() {
  const { heatmaps, behavior, predictions, meta } = useAdvancedAnalytics(demoUserId, demoMatchId);
  const [activeTab, setActiveTab] = useState<'heatmaps' | 'behavior' | 'predictions' | 'meta'>('heatmaps');

  // Demo data generation
  useEffect(() => {
    // Create demo heatmap if none exists
    if (heatmaps.heatmaps.length === 0) {
      const hm = heatmaps.createHeatmap('pass');
      if (hm) {
        for (let i = 0; i < 15; i++) {
          heatmaps.addPoint(hm.id, Math.random() * 100, Math.random() * 100, Math.random() * 100 + 30, 'pass');
        }
        heatmaps.selectHeatmap(hm);
      }
    }
  }, []);

  const createDemoPredictionModel = () => {
    predictions.createModel('performance', ['passAccuracy', 'shotCount', 'defensiveActions', 'possession']);
  };

  const createDemoPrediction = () => {
    if (predictions.models.length === 0) {
      createDemoPredictionModel();
      return;
    }
    const modelId = predictions.models[0].id;
    predictions.makePrediction(modelId, demoUserId, 'high_performance', 85);
  };

  const recordDemoBehavior = () => {
    behavior.recordBehavior(demoMatchId, {
      passAccuracy: Math.random() * 100,
      shotAccuracy: Math.random() * 100,
      dribbleSucRate: Math.random() * 100,
      avgPassLength: Math.random() * 25 + 5,
      avgRunDistance: Math.random() * 8 + 2,
      pressureResistance: Math.random() * 100,
      creativeIndex: Math.random() * 100,
      defensivePresence: Math.random() * 100,
      positioningScore: Math.random() * 100,
      consistency: Math.random() * 100
    });
  };

  const recordDemoFormationMatch = () => {
    const formations = meta.formations;
    if (formations.length > 0) {
      meta.recordFormationMatch(formations[0]?.formationId || 'f_433', 'win', {
        possession: 55,
        goalsFor: 2,
        goalsAgainst: 1,
        shots: 12,
        accuracy: 65
      });
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>📊 Advanced Analytics Dashboard</h1>
        <p>Heatmaps, Player Behavior, Predictions & Meta Analysis</p>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'heatmaps' ? styles.active : ''}`}
          onClick={() => setActiveTab('heatmaps')}
        >
          🔥 Heatmaps
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'behavior' ? styles.active : ''}`}
          onClick={() => setActiveTab('behavior')}
        >
          👤 Behavior
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'predictions' ? styles.active : ''}`}
          onClick={() => setActiveTab('predictions')}
        >
          🎯 Predictions
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'meta' ? styles.active : ''}`}
          onClick={() => setActiveTab('meta')}
        >
          📈 Meta-Game
        </button>
      </nav>

      {activeTab === 'heatmaps' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>🔥 Heatmap Analysis</h2>
            <p>Visualize player activity across the field</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>📍 Active Heatmaps</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => heatmaps.createHeatmap('pass')}
                >
                  ➕ Pass Heatmap
                </button>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => heatmaps.createHeatmap('shot')}
                >
                  ➕ Shot Heatmap
                </button>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={() => heatmaps.createHeatmap('tackle')}
                >
                  ➕ Tackle Heatmap
                </button>
              </div>
              <div className={styles.heatmapList}>
                <p className={styles.count}>Total Heatmaps: {heatmaps.heatmaps.length}</p>
                {heatmaps.heatmaps.map((hm: Heatmap) => (
                  <div key={hm.id} className={styles.heatmapItem}>
                    <span className={styles.type}>{hm.eventType.toUpperCase()}</span>
                    <span className={styles.points}>{hm.points.length} points</span>
                    <button 
                      className={styles.viewBtn}
                      onClick={() => heatmaps.selectHeatmap(hm)}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3>🎨 Heatmap Visualization</h3>
              {heatmaps.selectedHeatmap && heatmaps.heatmapGrid ? (
                <div className={styles.heatmapContainer}>
                  <div className={styles.fieldPreview}>
                    <div className={styles.heatmapGrid}>
                      {heatmaps.heatmapGrid.map((row: number[], y: number) => (
                        <div key={y} className={styles.heatmapRow}>
                          {row.map((intensity: number, x: number) => (
                            <div
                              key={`${x}-${y}`}
                              className={styles.heatmapCell}
                              style={{
                                opacity: intensity / 100,
                                backgroundColor: `hsl(${Math.max(0, 100 - intensity * 1.2)}, 100%, 50%)`
                              }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={styles.heatmapInfo}>
                    <p><strong>Type:</strong> {heatmaps.selectedHeatmap.eventType}</p>
                    <p><strong>Total Points:</strong> {heatmaps.selectedHeatmap.points.length}</p>
                    <p><strong>Grid Size:</strong> {heatmaps.selectedHeatmap.gridSize}x{heatmaps.selectedHeatmap.gridSize}</p>
                    <button 
                      className={`${styles.button} ${styles.danger}`}
                      onClick={() => heatmaps.deleteHeatmap(heatmaps.selectedHeatmap!.id)}
                    >
                      Delete Heatmap
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>Select a heatmap to visualize</p>
              )}
            </div>

            <div className={`${styles.card} ${styles.fullWidth}`}>
              <h3>📊 Heatmap Statistics</h3>
              <div className={styles.statsGrid}>
                {heatmaps.heatmaps.map((hm: Heatmap) => (
                  <div key={hm.id} className={styles.statCard}>
                    <span className={styles.eventType}>{hm.eventType}</span>
                    <span className={styles.intensity}>Points: {hm.points.length}</span>
                    <span className={styles.time}>Last updated: {new Date(hm.updatedAt).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'behavior' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>👤 Player Behavior Analysis</h2>
            <p>Track performance metrics and behavior patterns</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>📈 Current Behavior</h3>
              <button 
                className={`${styles.button} ${styles.primary}`}
                onClick={recordDemoBehavior}
              >
                ➕ Record Behavior
              </button>
              {behavior.currentBehavior ? (
                <div className={styles.behaviorStats}>
                  <div className={styles.statRow}>
                    <span>Pass Accuracy:</span>
                    <div className={styles.statBar}>
                      <div 
                        className={styles.fill}
                        style={{ width: `${behavior.currentBehavior.passAccuracy}%` }}
                      ></div>
                    </div>
                    <span>{behavior.currentBehavior.passAccuracy.toFixed(0)}%</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Shot Accuracy:</span>
                    <div className={styles.statBar}>
                      <div 
                        className={styles.fill}
                        style={{ width: `${behavior.currentBehavior.shotAccuracy}%` }}
                      ></div>
                    </div>
                    <span>{behavior.currentBehavior.shotAccuracy.toFixed(0)}%</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Defensive Presence:</span>
                    <div className={styles.statBar}>
                      <div 
                        className={styles.fill}
                        style={{ width: `${behavior.currentBehavior.defensivePresence}%` }}
                      ></div>
                    </div>
                    <span>{behavior.currentBehavior.defensivePresence.toFixed(0)}%</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Creative Index:</span>
                    <div className={styles.statBar}>
                      <div 
                        className={styles.fill}
                        style={{ width: `${behavior.currentBehavior.creativeIndex}%` }}
                      ></div>
                    </div>
                    <span>{behavior.currentBehavior.creativeIndex.toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>No behavior recorded yet</p>
              )}
            </div>

            <div className={styles.card}>
              <h3>📊 Average Performance</h3>
              {Object.keys(behavior.averageBehavior).length > 0 ? (
                <div className={styles.behaviorStats}>
                  <div className={styles.statRow}>
                    <span>Avg Pass Accuracy:</span>
                    <span className={styles.value}>{(behavior.averageBehavior.passAccuracy || 0).toFixed(1)}%</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Avg Shot Accuracy:</span>
                    <span className={styles.value}>{(behavior.averageBehavior.shotAccuracy || 0).toFixed(1)}%</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Avg Pass Length:</span>
                    <span className={styles.value}>{(behavior.averageBehavior.avgPassLength || 0).toFixed(1)}m</span>
                  </div>
                  <div className={styles.statRow}>
                    <span>Consistency Score:</span>
                    <span className={styles.value}>{(behavior.averageBehavior.consistency || 0).toFixed(0)}%</span>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>No data available</p>
              )}
            </div>

            <div className={styles.card}>
              <h3>🎯 Detected Patterns</h3>
              {behavior.patterns.length > 0 ? (
                <div className={styles.patternList}>
                  {behavior.patterns.map((pattern: BehaviorPattern) => (
                    <div key={pattern.id} className={styles.patternItem}>
                      <div className={styles.patternType}>{pattern.pattern.toUpperCase()}</div>
                      <div className={styles.patternInfo}>
                        <span>Confidence: {pattern.confidence}%</span>
                        <span>Frequency: {pattern.frequency}x</span>
                      </div>
                      <button 
                        className={styles.removeBtn}
                        onClick={() => behavior.deletePattern(pattern.id)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No patterns detected yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'predictions' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>🎯 Prediction Models</h2>
            <p>AI-powered performance predictions and outcomes</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>🤖 Models & Performance</h3>
              <div className={styles.buttonGroup}>
                <button 
                  className={`${styles.button} ${styles.primary}`}
                  onClick={createDemoPredictionModel}
                >
                  ➕ Create Model
                </button>
                <button 
                  className={styles.button}
                  onClick={createDemoPrediction}
                >
                  🎯 Make Prediction
                </button>
              </div>
              <div className={styles.modelsList}>
                <p className={styles.count}>Total Models: {predictions.metrics.length}</p>
                {predictions.metrics.map((metric: PredictionMetric) => (
                  <div key={metric.modelId} className={styles.modelItem}>
                    <div className={styles.modelName}>Model {metric.modelId.slice(0, 8)}</div>
                    <div className={styles.modelStats}>
                      <span>Accuracy: {metric.accuracy}%</span>
                      <span>Predictions: {metric.totalPredictions}</span>
                      <span>Correct: {metric.correctPredictions}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.card}>
              <h3>🔮 Active Predictions</h3>
              {predictions.predictions.length > 0 ? (
                <div className={styles.predictionsList}>
                  {predictions.predictions.slice(0, 5).map((pred: Prediction) => (
                    <div key={pred.id} className={styles.predictionItem}>
                      <div className={styles.predictionPred}>{pred.prediction}</div>
                      <div className={styles.confidenceBar}>
                        <div 
                          className={styles.confidenceFill}
                          style={{ width: `${pred.confidence}%` }}
                        ></div>
                      </div>
                      <span className={styles.confidence}>{pred.confidence}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No active predictions</p>
              )}
            </div>

            <div className={styles.card}>
              <h3>📈 Model Accuracy Trends</h3>
              {predictions.metrics.length > 0 ? (
                <div className={styles.accuracyChart}>
                  {predictions.metrics.map((metric: PredictionMetric) => (
                    <div key={metric.modelId} className={styles.accuracyBar}>
                      <span className={styles.label}>Model {metric.modelId.slice(0, 5)}</span>
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.barFill}
                          style={{ width: `${metric.accuracy}%` }}
                        ></div>
                      </div>
                      <span className={styles.percent}>{metric.accuracy}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>Create a model to see accuracy trends</p>
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'meta' && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>📈 Meta-Game Analysis</h2>
            <p>Formation effectiveness, strategy trends, and meta shifts</p>
          </div>

          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>⚽ Top Formations</h3>
              <button 
                className={`${styles.button} ${styles.primary}`}
                onClick={recordDemoFormationMatch}
              >
                ➕ Record Match
              </button>
              {meta.formations.length > 0 ? (
                <div className={styles.formationsList}>
                  {meta.formations.slice(0, 5).map((formation: FormationStats) => (
                    <div key={formation.formationId} className={styles.formationItem}>
                      <div className={styles.formationName}>{formation.formationName}</div>
                      <div className={styles.formationStats}>
                        <span>Matches: {formation.matchesPlayed}</span>
                        <span>W: {formation.wins} D: {formation.draws} L: {formation.losses}</span>
                        <span>Win %: {formation.matchesPlayed > 0 ? ((formation.wins / formation.matchesPlayed) * 100).toFixed(0) : 0}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No formation data yet</p>
              )}
            </div>

            <div className={styles.card}>
              <h3>📊 Meta Summary</h3>
              {meta.metaSummary ? (
                <div className={styles.metaInfo}>
                  <div className={styles.infoItem}>
                    <span>Total Strategies:</span>
                    <strong>{meta.metaSummary.totalStrategies}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Active Trends:</span>
                    <strong>{meta.metaSummary.activeTrends}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Top Formation:</span>
                    <strong>{meta.metaSummary.topFormation}</strong>
                  </div>
                  <div className={styles.infoItem}>
                    <span>Meta Shift:</span>
                    <strong>{meta.metaSummary.metaShift > 0 ? '📈 ' : meta.metaSummary.metaShift < 0 ? '📉 ' : '→ '}{meta.metaSummary.metaShift}</strong>
                  </div>
                </div>
              ) : (
                <p className={styles.empty}>No meta data available</p>
              )}
            </div>

            <div className={styles.card}>
              <h3>🔥 Trending Now</h3>
              {meta.trends.length > 0 ? (
                <div className={styles.trendsList}>
                  {meta.trends.slice(0, 5).map((trend: MetaTrend) => (
                    <div key={trend.id} className={styles.trendItem}>
                      <div className={styles.trendName}>{trend.trend}</div>
                      <div className={styles.trendMetrics}>
                        <span>Popularity: {trend.popularity}%</span>
                        <span>Success: {trend.successRate}%</span>
                        <span className={styles.direction}>{trend.direction === 'rising' ? '📈' : trend.direction === 'falling' ? '📉' : '→'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.empty}>No trends recorded yet</p>
              )}
            </div>
          </div>
        </section>
      )}

      <footer className={styles.footer}>
        <p>📊 Advanced Analytics v1.0 • Production Ready</p>
      </footer>
    </div>
  );
}
