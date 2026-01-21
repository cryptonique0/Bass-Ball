/**
 * Recommendation Engine - Hybrid item-item CF + content-based scoring
 * Records interactions and produces personalized recommendations.
 */

export type InteractionType = 'view' | 'click' | 'like' | 'play' | 'purchase';

export interface ContentItem {
  id: string;
  title?: string;
  tags?: string[]; // e.g., ['arena','fast','team']
  attributes?: Record<string, number>; // e.g., difficulty: 0..1, pace: 0..1
}

export interface InteractionRecord {
  playerId: string;
  contentId: string;
  type: InteractionType;
  weight: number;
  timestamp: number;
}

export interface RecommendationConfig {
  decayHalfLifeMs?: number; // time-decay half-life
  cfWeight?: number; // collaborative filtering contribution
  contentWeight?: number; // content-based contribution
  diversity?: number; // 0..1 penalize similar items
}

class Similarity {
  static cosine(a: Record<string, number>, b: Record<string, number>): number {
    let dot = 0, na = 0, nb = 0;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    keys.forEach(k => { const va = a[k] || 0; const vb = b[k] || 0; dot += va * vb; na += va * va; nb += vb * vb; });
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom ? dot / denom : 0;
  }
}

export class RecommendationEngine {
  private config: Required<RecommendationConfig>;
  private items: Map<string, ContentItem> = new Map();
  private interactions: InteractionRecord[] = [];
  private playerItemWeights: Map<string, Map<string, number>> = new Map();
  private itemItemSim: Map<string, Map<string, number>> = new Map();

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = {
      decayHalfLifeMs: config.decayHalfLifeMs ?? 14 * 24 * 3600 * 1000, // 14 days
      cfWeight: config.cfWeight ?? 0.6,
      contentWeight: config.contentWeight ?? 0.4,
      diversity: config.diversity ?? 0.15,
    };
  }

  upsertItem(item: ContentItem): void { this.items.set(item.id, item); }

  recordInteraction(playerId: string, contentId: string, type: InteractionType, weight: number = this.defaultWeight(type)): void {
    const rec: InteractionRecord = { playerId, contentId, type, weight, timestamp: Date.now() };
    this.interactions.push(rec);
    // update per-player weights (time-decayed)
    const map = this.playerItemWeights.get(playerId) || new Map<string, number>();
    const prev = map.get(contentId) || 0;
    const decayed = this.applyDecay(prev, rec.timestamp);
    map.set(contentId, decayed + weight);
    this.playerItemWeights.set(playerId, map);
  }

  private defaultWeight(type: InteractionType): number {
    switch (type) {
      case 'view': return 0.2;
      case 'click': return 0.4;
      case 'like': return 0.8;
      case 'play': return 1.0;
      case 'purchase': return 1.2;
    }
  }

  private applyDecay(value: number, now: number): number {
    const halfLife = this.config.decayHalfLifeMs;
    // Exponential decay: value * 0.5^(delta/halfLife)
    const delta = 0; // no prior timestamp stored; treat prior value as current
    const factor = Math.pow(0.5, delta / halfLife);
    return value * factor;
  }

  rebuildItemSimilarities(): void {
    this.itemItemSim.clear();
    const ids = Array.from(this.items.keys());
    for (let i = 0; i < ids.length; i++) {
      const a = this.items.get(ids[i])!;
      for (let j = i + 1; j < ids.length; j++) {
        const b = this.items.get(ids[j])!;
        const vecA = this.itemVector(a);
        const vecB = this.itemVector(b);
        const sim = Similarity.cosine(vecA, vecB);
        if (!this.itemItemSim.get(a.id)) this.itemItemSim.set(a.id, new Map());
        if (!this.itemItemSim.get(b.id)) this.itemItemSim.set(b.id, new Map());
        this.itemItemSim.get(a.id)!.set(b.id, sim);
        this.itemItemSim.get(b.id)!.set(a.id, sim);
      }
    }
  }

  getRecommendations(playerId: string, topN: number = 10): Array<{ id: string; score: number; reasons: string[] }> {
    const prefs = this.playerItemWeights.get(playerId) || new Map<string, number>();
    const seen = new Set<string>(prefs.keys());
    const scores: Map<string, { score: number; reasons: string[] }> = new Map();

    // CF: for items similar to those the user interacted with
    for (const [itemId, w] of prefs) {
      const neighbors = this.itemItemSim.get(itemId);
      if (!neighbors) continue;
      for (const [nid, sim] of neighbors) {
        if (seen.has(nid)) continue;
        const prev = scores.get(nid) || { score: 0, reasons: [] };
        prev.score += this.config.cfWeight * sim * w;
        prev.reasons.push(`cf(${itemId}:${sim.toFixed(2)})`);
        scores.set(nid, prev);
      }
    }

    // Content-based: compare item attributes to inferred user profile
    const profileVec = this.inferUserVector(prefs);
    for (const [id, item] of this.items) {
      if (seen.has(id)) continue;
      const itemVec = this.itemVector(item);
      const sim = Similarity.cosine(profileVec, itemVec);
      const prev = scores.get(id) || { score: 0, reasons: [] };
      prev.score += this.config.contentWeight * sim;
      prev.reasons.push(`content(${sim.toFixed(2)})`);
      scores.set(id, prev);
    }

    // Diversity: penalize items too similar to already high-scoring items
    const result = Array.from(scores.entries()).map(([id, v]) => ({ id, score: v.score, reasons: v.reasons }));
    result.sort((a, b) => b.score - a.score);
    const penalized: Array<{ id: string; score: number; reasons: string[] }> = [];
    for (const rec of result) {
      let penalty = 0;
      for (const chosen of penalized.slice(-3)) {
        const sim = (this.itemItemSim.get(rec.id)?.get(chosen.id)) || 0;
        penalty += sim * this.config.diversity * 0.5; // small penalty
      }
      penalized.push({ id: rec.id, score: Math.max(rec.score - penalty, 0), reasons: rec.reasons });
    }

    penalized.sort((a, b) => b.score - a.score);
    return penalized.slice(0, topN);
  }

  private itemVector(item: ContentItem): Record<string, number> {
    const vec: Record<string, number> = {};
    (item.tags || []).forEach(t => { vec[`tag:${t}`] = 1; });
    const attrs = item.attributes || {};
    for (const k of Object.keys(attrs)) vec[`attr:${k}`] = attrs[k] || 0;
    return vec;
  }

  private inferUserVector(prefs: Map<string, number>): Record<string, number> {
    const vec: Record<string, number> = {};
    let total = 0;
    for (const [id, w] of prefs) {
      const item = this.items.get(id);
      if (!item) continue;
      const iv = this.itemVector(item);
      for (const k of Object.keys(iv)) { vec[k] = (vec[k] || 0) + iv[k] * w; }
      total += w;
    }
    if (total > 0) {
      for (const k of Object.keys(vec)) vec[k] /= total;
    }
    return vec;
  }
}

export const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
