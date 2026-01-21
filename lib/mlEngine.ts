/**
 * ML Engine - Lightweight ML utilities for matchmaking, clustering, and fraud detection
 * No heavy deps; pure TypeScript implementations suited for real-time game backend/frontends.
 */

// ===== Types =====
export interface PlayerProfile {
  id: string;
  rating: number; // ELO/MMR
  skill: number; // derived skill index 0..1
  latencyMs?: number;
  region?: string;
  playStyle?: 'aggressive' | 'defensive' | 'balanced';
  stats?: Record<string, number>; // e.g., accuracy, winrate, avgSession
}

export interface MatchRequest {
  playerId: string;
  maxLatencyMs?: number;
  regionPreference?: string;
  teamSize?: number;
  tolerance?: number; // rating tolerance
}

export interface MatchCandidate {
  playerId: string;
  score: number; // matchmaking score
  reason?: string;
}

export interface FraudSignal {
  name: string;
  value: number;
  weight: number; // contribution to risk
}

export interface FraudAnalysis {
  riskScore: number; // 0..100
  signals: FraudSignal[];
  reasons: string[];
}

// ===== Utils =====
export class StandardScaler {
  private mean: number = 0;
  private std: number = 1;

  fit(values: number[]): void {
    if (!values.length) return;
    const m = values.reduce((a, b) => a + b, 0) / values.length;
    const v = values.reduce((acc, x) => acc + (x - m) * (x - m), 0) / values.length;
    this.mean = m;
    this.std = Math.sqrt(Math.max(v, 1e-8));
  }
  transform(x: number): number { return (x - this.mean) / this.std; }
}

export function euclidean(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) { const d = a[i] - b[i]; s += d * d; }
  return Math.sqrt(s);
}

// ===== KMeans Clustering =====
export class KMeans {
  private k: number;
  private centroids: number[][] = [];

  constructor(k: number = 3) { this.k = Math.max(1, k); }

  fit(data: number[][], iterations: number = 30): void {
    if (data.length === 0) return;
    // init centroids randomly
    this.centroids = [];
    const used = new Set<number>();
    while (this.centroids.length < this.k && used.size < data.length) {
      const idx = Math.floor(Math.random() * data.length);
      if (!used.has(idx)) { used.add(idx); this.centroids.push([...data[idx]]); }
    }
    if (!this.centroids.length) this.centroids = [data[0]];

    for (let it = 0; it < iterations; it++) {
      const clusters: number[][][] = Array.from({ length: this.k }, () => []);
      for (const v of data) {
        let best = 0; let bestDist = Infinity;
        for (let c = 0; c < this.centroids.length; c++) {
          const d = euclidean(v, this.centroids[c]);
          if (d < bestDist) { bestDist = d; best = c; }
        }
        clusters[best].push(v);
      }
      // recompute
      for (let c = 0; c < this.centroids.length; c++) {
        const cl = clusters[c];
        if (!cl.length) continue;
        const dim = cl[0].length;
        const mean = new Array(dim).fill(0);
        for (const v of cl) { for (let i = 0; i < dim; i++) mean[i] += v[i]; }
        for (let i = 0; i < dim; i++) mean[i] /= cl.length;
        this.centroids[c] = mean;
      }
    }
  }

  predict(v: number[]): number {
    let best = 0; let bestDist = Infinity;
    for (let c = 0; c < this.centroids.length; c++) {
      const d = euclidean(v, this.centroids[c]);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  }

  getCentroids(): number[][] { return this.centroids; }
}

// ===== ELO/MMR =====
export class EloRating {
  constructor(private kFactor: number = 32) {}
  expectedScore(rA: number, rB: number): number { return 1 / (1 + Math.pow(10, (rB - rA) / 400)); }
  update(rA: number, rB: number, scoreA: 0 | 0.5 | 1): number { const exp = this.expectedScore(rA, rB); return Math.round(rA + this.kFactor * (scoreA - exp)); }
}

// ===== Fraud Detection (Lightweight) =====
export interface PlayerEvent {
  timestamp: number;
  type: string; // e.g., 'login','match_end','purchase','reward_claim'
  value?: number; // optional numeric payload
}

export class FraudDetector {
  analyze(events: PlayerEvent[], profile?: PlayerProfile): FraudAnalysis {
    const signals: FraudSignal[] = [];
    const reasons: string[] = [];
    if (!events.length) return { riskScore: 0, signals, reasons };

    // Rapid actions (suspicious automation)
    let rapidCount = 0;
    for (let i = 1; i < events.length; i++) {
      const dt = events[i].timestamp - events[i - 1].timestamp;
      if (dt > 0 && dt < 500) rapidCount++;
    }
    if (rapidCount > 10) { signals.push({ name: 'rapid_actions', value: rapidCount, weight: 0.25 }); reasons.push('High number of rapid consecutive actions'); }

    // Abnormal reward claims
    const claims = events.filter(e => e.type === 'reward_claim' && typeof e.value === 'number').map(e => e.value as number);
    if (claims.length) {
      const scaler = new StandardScaler(); scaler.fit(claims);
      const outliers = claims.map(v => Math.abs(scaler.transform(v))).filter(z => z > 3).length;
      if (outliers > 0) { signals.push({ name: 'reward_outliers', value: outliers, weight: 0.35 }); reasons.push('Outlier reward amounts detected'); }
    }

    // Winrate anomaly
    if (profile?.stats?.winrate != null) {
      const wr = profile.stats.winrate;
      if (wr > 0.95 && (profile.rating || 0) < 2400) { signals.push({ name: 'winrate_spike', value: wr, weight: 0.2 }); reasons.push('Unusually high winrate for rating'); }
    }

    // Region hopping (potential VPN)
    if (profile?.region && events.some(e => e.type === 'region_change')) {
      signals.push({ name: 'region_hopping', value: 1, weight: 0.2 }); reasons.push('Frequent region change events'); }

    const risk = Math.min(100, Math.round(signals.reduce((s, sg) => s + sg.value * sg.weight * 20, 0)));
    return { riskScore: risk, signals, reasons };
  }
}

// ===== Matchmaking Engine =====
export class MatchmakingEngine {
  private profiles: Map<string, PlayerProfile> = new Map();
  private elo: EloRating = new EloRating(24);
  private clusterer: KMeans = new KMeans(4);
  private featureCache: Map<string, number[]> = new Map();

  registerProfile(p: PlayerProfile): void {
    this.profiles.set(p.id, p);
    this.featureCache.set(p.id, this.profileToVector(p));
  }

  updateRating(playerA: string, playerB: string, resultA: 0 | 0.5 | 1): void {
    const a = this.profiles.get(playerA); const b = this.profiles.get(playerB);
    if (!a || !b) return;
    const newA = this.elo.update(a.rating, b.rating, resultA);
    const newB = this.elo.update(b.rating, a.rating, (1 - resultA) as 0 | 0.5 | 1);
    a.rating = newA; b.rating = newB;
    this.registerProfile(a); this.registerProfile(b);
  }

  rebuildClusters(): void {
    const data: number[][] = [];
    for (const [id, p] of this.profiles) {
      const v = this.profileToVector(p); this.featureCache.set(id, v); data.push(v);
    }
    if (data.length >= 4) this.clusterer.fit(data, 25);
  }

  findMatches(req: MatchRequest, maxCandidates: number = 20): MatchCandidate[] {
    const me = this.profiles.get(req.playerId);
    if (!me) return [];
    const myV = this.featureCache.get(me.id) || this.profileToVector(me);
    const myCluster = this.clusterer.predict(myV);
    const tol = req.tolerance ?? 200;

    const candidates: MatchCandidate[] = [];
    for (const [id, p] of this.profiles) {
      if (id === me.id) continue;
      if (req.regionPreference && p.region && p.region !== req.regionPreference) continue;
      if (req.maxLatencyMs != null && (p.latencyMs || Infinity) > req.maxLatencyMs) continue;

      const v = this.featureCache.get(id) || this.profileToVector(p);
      const dist = euclidean(myV, v);
      const ratingDiff = Math.abs((p.rating || 1200) - (me.rating || 1200));
      if (ratingDiff > tol) continue;

      // Higher score for closer vector, lower latency, similar play style
      const latencyScore = 1 - Math.min((p.latencyMs || 80) / Math.max(req.maxLatencyMs || 200, 200), 1);
      const clusterBonus = this.clusterer.predict(v) === myCluster ? 0.15 : 0;
      const score = (1 / (1 + dist)) * 0.6 + (1 - ratingDiff / Math.max(tol, 1)) * 0.25 + latencyScore * 0.15 + clusterBonus;
      candidates.push({ playerId: id, score });
    }
    return candidates.sort((a, b) => b.score - a.score).slice(0, maxCandidates);
  }

  private profileToVector(p: PlayerProfile): number[] {
    const rating = p.rating ?? 1200;
    const skill = p.skill ?? 0.5;
    const latency = (p.latencyMs ?? 80) / 300; // normalized
    const styleIdx = p.playStyle === 'aggressive' ? 1 : p.playStyle === 'defensive' ? -1 : 0;
    const winrate = p.stats?.winrate ?? 0.5;
    const accuracy = p.stats?.accuracy ?? 0.5;
    return [rating / 3000, skill, latency, styleIdx, winrate, accuracy];
  }
}

// ===== Export singletons =====
export const matchmakingEngine = new MatchmakingEngine();
export const fraudDetector = new FraudDetector();

export default {
  StandardScaler,
  KMeans,
  EloRating,
  FraudDetector,
  MatchmakingEngine,
  matchmakingEngine,
  fraudDetector,
};
