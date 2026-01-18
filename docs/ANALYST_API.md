# Analyst API: Open Data for Creators

## Vision

**Bass Ball data is a public good.** Instead of gatekeeping match data, expose it via an **open API** that analysts, streamers, and researchers can build on.

Think of it like soccer data providers (Wyscout, StatsBomb) but **decentralized and free** for the community. Anyone can:

- Query match statistics
- Download replays for analysis
- Build predictive models
- Create heat maps and tactical breakdowns
- Stream with live analytics overlays
- Publish research papers

This transforms Bass Ball from a game → **an analytics platform**.

---

## 1. API Architecture

### 1.1 REST Endpoints Overview

```
/api/v1/matches              - Query matches
/api/v1/players              - Player stats and profiles
/api/v1/replay               - Download and analyze replays
/api/v1/stats                - Advanced statistics
/api/v1/analytics            - Tactical breakdowns
/api/v1/leaderboards         - Rankings and trends
/api/v1/clubs                - Club and community data
```

### 1.2 Authentication Tiers

```typescript
interface APIAuthTier {
  name: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  dataAccess: {
    historical: number;  // days of history accessible
    replayAccess: boolean;
    advancedAnalytics: boolean;
  };
  cost: string;
}

const TIERS = {
  "free": {
    name: "Community",
    rateLimit: { requestsPerMinute: 10, requestsPerDay: 1000 },
    dataAccess: { historical: 30, replayAccess: false, advancedAnalytics: false },
    cost: "$0/month",
  },
  "pro": {
    name: "Pro Analyst",
    rateLimit: { requestsPerMinute: 100, requestsPerDay: 50000 },
    dataAccess: { historical: 365, replayAccess: true, advancedAnalytics: true },
    cost: "$49/month",
  },
  "pro_plus": {
    name: "Professional",
    rateLimit: { requestsPerMinute: 1000, requestsPerDay: Infinity },
    dataAccess: { historical: Infinity, replayAccess: true, advancedAnalytics: true },
    cost: "$199/month",
  },
  "research": {
    name: "Research (Free for academics)",
    rateLimit: { requestsPerMinute: 500, requestsPerDay: Infinity },
    dataAccess: { historical: Infinity, replayAccess: true, advancedAnalytics: true },
    cost: "$0 (with .edu email)",
  },
};
```

---

## 2. Match Query API

### 2.1 List Matches

```
GET /api/v1/matches
Query Parameters:
  - player_id: Filter by player
  - opponent_id: Filter by opponent
  - date_from, date_to: Date range
  - min_elo, max_elo: ELO range
  - competition: ranked | career | friendly | custom
  - result: win | draw | loss
  - limit: 1-1000 (default 100)
  - offset: Pagination
```

**Response:**

```json
{
  "matches": [
    {
      "id": "match_xyz123",
      "player_id": "player_123",
      "opponent_id": "player_456",
      "date": "2026-01-15T14:30:00Z",
      
      "competition": "ranked",
      "elo_before": 1650,
      "elo_after": 1680,
      
      "result": "win",
      "final_score": [2, 1],
      
      "formation": "4-3-3",
      "opponent_formation": "4-2-3-1",
      
      "possession": 0.55,
      "shots_on_target": 5,
      "passes_completed": 287,
      
      "replay_available": true,
      "replay_id": "replay_xyz123",
      
      "duration": 2700,  // seconds
      "server_tick_rate": 128,
      "frame_rate": 60,
    }
  ],
  "pagination": {
    "total": 4521,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

### 2.2 Get Match Details

```
GET /api/v1/matches/{match_id}
```

**Response:**

```json
{
  "id": "match_xyz123",
  "player": {
    "id": "player_123",
    "name": "AlexTheGreat",
    "rank": 1850,
    "reputation": 2400
  },
  "opponent": {
    "id": "player_456",
    "name": "DefenseKing",
    "rank": 1820,
    "reputation": 1800
  },
  
  "match_metadata": {
    "competition": "ranked",
    "start_time": "2026-01-15T14:30:00Z",
    "duration_seconds": 2700,
    "platform": "pc",
    "region": "eu-west-1"
  },
  
  "player_stats": {
    "formation": "4-3-3",
    "formation_adherence": 0.92,
    "possession": 0.55,
    
    "shots": {
      "total": 8,
      "on_target": 5,
      "conversion": 0.40
    },
    
    "passing": {
      "attempts": 350,
      "completed": 287,
      "accuracy": 0.82,
      "key_passes": 12
    },
    
    "defense": {
      "tackles": 8,
      "interceptions": 4,
      "clearances": 6
    },
    
    "pressing": {
      "press_attempts": 45,
      "press_success_rate": 0.36,
      "average_press_delay": 1.2
    }
  },
  
  "opponent_stats": {
    // ... same structure
  },
  
  "events": [
    {
      "time": 347,
      "type": "goal",
      "player": "player_123",
      "description": "Shot from 18 yards, low save attempt"
    },
    // ... more events
  ],
  
  "heat_maps": {
    "player": "https://cdn.bassball.io/heatmaps/match_xyz123_player.png",
    "opponent": "https://cdn.bassball.io/heatmaps/match_xyz123_opponent.png",
    "possession": "https://cdn.bassball.io/heatmaps/match_xyz123_possession.png"
  },
  
  "replay": {
    "available": true,
    "id": "replay_xyz123",
    "ipfs_hash": "QmXx...",
    "download_url": "/api/v1/replay/replay_xyz123/download"
  }
}
```

---

## 3. Replay Download API

### 3.1 Download Replay

```
GET /api/v1/replay/{replay_id}/download
Query Parameters:
  - format: binary | json | csv (default: binary)
  - frames: true | false (include frame data, default: false)
  - compress: true | false (gzip compression, default: true)
```

**Response:** Raw replay file (binary or JSON depending on format)

### 3.2 Replay Metadata

```
GET /api/v1/replay/{replay_id}
```

**Response:**

```json
{
  "id": "replay_xyz123",
  "match_id": "match_xyz123",
  
  "metadata": {
    "recorded_at": "2026-01-15T14:30:00Z",
    "duration": 2700,
    "format_version": "1.0",
    "platform": "pc",
    
    "checksums": {
      "content": "sha256_hash_here",
      "physics": "sha256_hash_here",
      "inputs": "sha256_hash_here"
    }
  },
  
  "storage": {
    "ipfs_hash": "QmXx...",
    "blockchain_tx": "0x1234...abcd",
    "cdn_url": "https://cdn.bassball.io/replays/replay_xyz123.bsr"
  },
  
  "verification": {
    "valid": true,
    "certificate_id": "cert_abc123",
    "verified_at": "2026-01-15T15:00:00Z"
  },
  
  "frame_count": 16200,
  "event_count": 47,
  
  "compression": {
    "format": "deflate",
    "compressed_size_mb": 12.5,
    "uncompressed_size_mb": 45.2
  }
}
```

### 3.3 Frame-by-Frame Data

```
GET /api/v1/replay/{replay_id}/frames
Query Parameters:
  - frame_from, frame_to: Frame range
  - include: ball,players,events (comma-separated)
```

**Response:**

```json
{
  "frames": [
    {
      "frame_number": 1000,
      "timestamp": 16.67,  // seconds
      
      "ball": {
        "position": [55.2, 0.3, 34.1],
        "velocity": [2.1, 0.5, 1.2],
        "rotation": [45, 120, 30]
      },
      
      "players": [
        {
          "player_id": "player_123",
          "position": [40.0, 0.0, 25.0],
          "velocity": [1.5, 0.0, 0.8],
          "role": "CM",
          "animation": "running"
        }
        // ... more players
      ],
      
      "events": [
        {
          "type": "pass",
          "from_player": "player_123",
          "to_player": "player_124",
          "success": true
        }
      ]
    }
    // ... more frames
  ],
  "pagination": {
    "total_frames": 16200,
    "returned": 100,
    "frame_from": 1000,
    "frame_to": 1100
  }
}
```

---

## 4. Advanced Statistics API

### 4.1 Player Stats Aggregation

```
GET /api/v1/stats/player/{player_id}
Query Parameters:
  - date_from, date_to: Date range
  - min_elo, max_elo: Filter by opponent strength
  - competition: ranked | career | friendly | custom
```

**Response:**

```json
{
  "player_id": "player_123",
  "period": {
    "from": "2025-06-01T00:00:00Z",
    "to": "2026-01-18T00:00:00Z",
    "matches_played": 247
  },
  
  "overall": {
    "wins": 165,
    "draws": 35,
    "losses": 47,
    "win_rate": 0.667,
    
    "goals_for": 432,
    "goals_against": 218,
    "goal_difference": 214
  },
  
  "offensive": {
    "shots_per_match": 8.2,
    "shots_on_target_rate": 0.61,
    "conversion_rate": 0.55,
    "assists_per_match": 1.8,
    
    "expected_goals": 485.2,  // xG model
    "actual_goals": 432,
    "overperformance": -0.11
  },
  
  "defensive": {
    "tackles_per_match": 5.2,
    "interceptions_per_match": 2.1,
    "clearances_per_match": 4.5,
    
    "press_success_rate": 0.42,
    "average_press_recovery_time": 1.3
  },
  
  "possession": {
    "possession_average": 0.54,
    "pass_accuracy": 0.81,
    "key_passes_per_match": 3.2
  },
  
  "formations": [
    {
      "formation": "4-3-3",
      "matches": 145,
      "win_rate": 0.71,
      "goals_for": 312,
      "goals_against": 148
    },
    {
      "formation": "4-2-3-1",
      "matches": 89,
      "win_rate": 0.64,
      "goals_for": 98,
      "goals_against": 61
    },
    // ... more formations
  ],
  
  "vs_opponent_elo": [
    {
      "elo_min": 800,
      "elo_max": 1200,
      "matches": 25,
      "win_rate": 0.92
    },
    {
      "elo_min": 1200,
      "elo_max": 1600,
      "matches": 145,
      "win_rate": 0.68
    },
    {
      "elo_min": 1600,
      "elo_max": 2000,
      "matches": 65,
      "win_rate": 0.45
    },
    {
      "elo_min": 2000,
      "elo_max": 2400,
      "matches": 12,
      "win_rate": 0.25
    }
  ],
  
  "recent_form": [
    { "match": 1, "result": "win", "opponent_elo": 1850 },
    { "match": 2, "result": "loss", "opponent_elo": 1920 },
    { "match": 3, "result": "win", "opponent_elo": 1800 },
    // ... last 10 matches
  ]
}
```

### 4.2 Comparison API

```
GET /api/v1/stats/compare
Query Parameters:
  - players: comma-separated player IDs
  - metrics: possession,shots,passing,defense
  - date_from, date_to: Date range
```

**Response:**

```json
{
  "players": ["player_123", "player_456"],
  "period": { "from": "...", "to": "..." },
  
  "comparison": {
    "possession": {
      "player_123": 0.54,
      "player_456": 0.48
    },
    "shots_per_match": {
      "player_123": 8.2,
      "player_456": 7.1
    },
    "pass_accuracy": {
      "player_123": 0.81,
      "player_456": 0.78
    },
    "win_rate": {
      "player_123": 0.667,
      "player_456": 0.620
    }
  },
  
  "head_to_head": {
    "matches": 3,
    "player_123_wins": 2,
    "draws": 0,
    "player_456_wins": 1,
    
    "average_goals_for_123": 2.0,
    "average_goals_for_456": 1.0
  }
}
```

---

## 5. Analytics API

### 5.1 Heatmaps

```
GET /api/v1/analytics/{match_id}/heatmap
Query Parameters:
  - player_id: Which player's heatmap
  - metric: possession | passes | shots | pressure | defense
  - format: json | png | svg
```

**Response (JSON):**

```json
{
  "match_id": "match_xyz123",
  "player_id": "player_123",
  "metric": "possession",
  
  "grid": {
    "width": 105,
    "height": 68,
    "cells_x": 21,  // 5m cells
    "cells_y": 17,
    
    "data": [
      [0, 0, 0, 0, 0, 0, 0, ...],
      [0, 1, 3, 5, 4, 3, 1, ...],
      [0, 2, 8, 12, 15, 10, 2, ...],
      // ... cells represent time in seconds player spent in that zone
    ]
  },
  
  "image_url": "https://cdn.bassball.io/heatmaps/match_xyz123_player_123_possession.png"
}
```

### 5.2 Pass Networks

```
GET /api/v1/analytics/{match_id}/pass-network
Query Parameters:
  - player_id: Optional filter by player
  - pass_type: all | key_passes | long_balls
```

**Response:**

```json
{
  "match_id": "match_xyz123",
  "pass_type": "all",
  
  "nodes": [
    {
      "player_id": "player_123",
      "position": [40.0, 25.0],
      "passes_made": 45,
      "passes_received": 42
    },
    // ... other players
  ],
  
  "edges": [
    {
      "from": "player_123",
      "to": "player_124",
      "passes": 12,
      "accuracy": 0.92,
      "weight": 4  // visual thickness
    },
    // ... pass connections
  ],
  
  "visualization_url": "https://cdn.bassball.io/networks/match_xyz123_passes.svg"
}
```

### 5.3 xG (Expected Goals) Analysis

```
GET /api/v1/analytics/{match_id}/xg
Query Parameters:
  - player_id: Optional filter
```

**Response:**

```json
{
  "match_id": "match_xyz123",
  
  "team_xg": 2.1,  // Expected goals for player
  "team_actual": 2,
  "team_overperformance": -0.1,
  
  "opponent_xg": 1.4,
  "opponent_actual": 1,
  "opponent_overperformance": -0.4,
  
  "shots": [
    {
      "time": 347,
      "player": "player_123",
      "position": [18.5, 30.0],
      "distance_from_goal": 18.5,
      "angle_to_goal": 45,
      
      "xg_value": 0.35,  // 35% chance of goal from that position
      "actual": 1,  // Did score
      "over_performance": 0.65
    },
    // ... more shots
  ],
  
  "plot_url": "https://cdn.bassball.io/analytics/match_xyz123_xg_plot.png"
}
```

---

## 6. Leaderboard API

### 6.1 Ranked Leaderboard

```
GET /api/v1/leaderboards/ranked
Query Parameters:
  - page: 1-X
  - limit: 10-100
  - region: global | eu-west | us-east | etc
```

**Response:**

```json
{
  "leaderboard": "ranked",
  "period": "current_season",
  "region": "global",
  
  "entries": [
    {
      "rank": 1,
      "player": {
        "id": "player_elite_1",
        "name": "ProPlayer",
        "elo": 2487,
        "reputation": 8500
      },
      
      "stats": {
        "wins": 287,
        "losses": 47,
        "win_rate": 0.859,
        "matches_this_season": 334
      },
      
      "trending": "↑ 3"  // Moving up
    },
    // ... more entries
  ],
  
  "pagination": {
    "page": 1,
    "total_pages": 50,
    "total_players": 5000
  }
}
```

### 6.2 Stats Leaderboard

```
GET /api/v1/leaderboards/stats
Query Parameters:
  - metric: win_rate | goals_scored | assists | possession | etc
  - min_matches: 50 (qualification threshold)
```

**Response:**

```json
{
  "metric": "possession",
  "min_matches": 50,
  
  "entries": [
    {
      "rank": 1,
      "player_id": "player_123",
      "value": 0.58,  // 58% average possession
      "matches": 247
    },
    // ... top 100
  ]
}
```

---

## 7. Content Creator Tools

### 7.1 Stream Overlay Data

```
GET /api/v1/creator/stream-overlay/{match_id}
Headers:
  - Authorization: Bearer {streamer_token}
```

**Response:**

```json
{
  "match_id": "match_xyz123",
  "live": true,
  "time_elapsed": 1847,
  "time_remaining": 853,
  
  "score": {
    "player": 2,
    "opponent": 1
  },
  
  "player_stats": {
    "possession": 0.55,
    "shots_on_target": 5,
    "pass_accuracy": 0.82,
    "pressing_intensity": 0.68
  },
  
  "heatmap_url": "https://cdn.bassball.io/live/match_xyz123_heatmap.png",
  "pass_network_url": "https://cdn.bassball.io/live/match_xyz123_network.svg",
  
  "key_events": [
    {
      "time": 1847,
      "type": "tackle",
      "description": "Successful tackle regaining possession"
    }
  ]
}
```

### 7.2 Highlight Detection

```
GET /api/v1/creator/highlights/{match_id}
Query Parameters:
  - min_excitement: 0-100
```

**Response:**

```json
{
  "match_id": "match_xyz123",
  "highlights": [
    {
      "start_frame": 2100,
      "end_frame": 2150,
      "start_time": 35.0,
      "duration": 0.83,
      
      "type": "goal",
      "excitement_score": 100,
      "description": "Shot from 18 yards, bottom corner"
    },
    {
      "start_frame": 4500,
      "end_frame": 4550,
      "start_time": 75.0,
      "duration": 0.83,
      
      "type": "save",
      "excitement_score": 75,
      "description": "Diving save, point-blank range"
    },
    // ... more highlights
  ],
  
  "highlight_reel_url": "https://cdn.bassball.io/highlights/match_xyz123_reel.mp4"
}
```

---

## 8. Implementation

### 8.1 API Gateway

```typescript
// api-gateway.ts
import express from "express";
import { APIKeyAuth, RateLimiter } from "./middleware";
import { MatchController, ReplayController, StatsController } from "./controllers";

const app = express();

// Authentication
app.use(APIKeyAuth.middleware);

// Rate limiting (tier-based)
app.use(RateLimiter.middleware);

// Match endpoints
app.get("/api/v1/matches", MatchController.listMatches);
app.get("/api/v1/matches/:id", MatchController.getMatch);

// Replay endpoints
app.get("/api/v1/replay/:id", ReplayController.getMetadata);
app.get("/api/v1/replay/:id/download", ReplayController.download);
app.get("/api/v1/replay/:id/frames", ReplayController.getFrames);

// Stats endpoints
app.get("/api/v1/stats/player/:id", StatsController.playerStats);
app.get("/api/v1/stats/compare", StatsController.comparePlayerss);

// Analytics endpoints
app.get("/api/v1/analytics/:matchId/heatmap", AnalyticsController.heatmap);
app.get("/api/v1/analytics/:matchId/pass-network", AnalyticsController.passNetwork);
app.get("/api/v1/analytics/:matchId/xg", AnalyticsController.xg);

// Leaderboards
app.get("/api/v1/leaderboards/ranked", LeaderboardController.ranked);
app.get("/api/v1/leaderboards/stats", LeaderboardController.stats);

// Creator tools
app.get("/api/v1/creator/stream-overlay/:matchId", CreatorController.streamOverlay);
app.get("/api/v1/creator/highlights/:matchId", CreatorController.highlights);

export default app;
```

### 8.2 Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_match_player ON matches(player_id, created_at DESC);
CREATE INDEX idx_match_opponent ON matches(opponent_id, created_at DESC);
CREATE INDEX idx_match_date ON matches(created_at DESC);

-- Materialized views for fast stats
CREATE MATERIALIZED VIEW player_season_stats AS
SELECT
  player_id,
  COUNT(*) as matches,
  SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
  AVG(possession) as avg_possession,
  AVG(shots_on_target) as avg_shots,
  ...
FROM matches
WHERE created_at > NOW() - INTERVAL '1 season'
GROUP BY player_id;

-- Cache frequently accessed data
CREATE TABLE api_cache (
  endpoint VARCHAR(255),
  params_hash VARCHAR(64),
  response JSONB,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  PRIMARY KEY (endpoint, params_hash)
);
```

---

## 9. Why This Matters

**An open API ecosystem transforms Bass Ball from game → platform:**

1. **Content Creator Economics**: Streamers get data-rich overlays, attract viewers
2. **Analytics Community**: Researchers publish findings, improve the game
3. **Third-Party Tools**: Fantasy leagues, betting models, coaching apps built on API
4. **Transparency**: All stats public, verifiable, no hidden calculations
5. **Data Mobility**: Player data isn't locked into one platform

---

## 10. Example Use Cases

### Sports Analytics Platform
```python
import requests

# Get season stats for all top 100 players
response = requests.get(
  "https://api.bassball.io/v1/leaderboards/ranked",
  params={"limit": 100},
  headers={"Authorization": f"Bearer {api_key}"}
)

players = response.json()["entries"]

# Analyze formation effectiveness
for player in players:
  stats = requests.get(
    f"https://api.bassball.io/v1/stats/player/{player['player_id']}",
    headers={"Authorization": f"Bearer {api_key}"}
  ).json()
  
  for formation in stats["formations"]:
    print(f"{player['name']} - {formation['formation']}: {formation['win_rate']:.1%}")
```

### Twitch Overlay
```typescript
// Real-time overlay during stream
setInterval(async () => {
  const overlay = await fetch(
    `https://api.bassball.io/v1/creator/stream-overlay/${currentMatchId}`,
    { headers: { Authorization: `Bearer ${streamerToken}` } }
  ).then(r => r.json());
  
  updateOverlayUI({
    possession: overlay.player_stats.possession,
    shots: overlay.player_stats.shots_on_target,
    passes: overlay.player_stats.pass_accuracy,
    heatmap: overlay.heatmap_url
  });
}, 500);  // Update every 500ms
```

### Predictive Model
```python
# Train ML model on historical data
matches = fetch_all_matches(api)  # Use pagination

for match in matches:
  features = extract_features(match)
  outcome = match['result']
  
  model.fit(features, outcome)

# Predict next match
prediction = model.predict(current_match_features)
print(f"Win probability: {prediction:.1%}")
```

---

## 11. Roadmap

### Phase 1: Core API (Months 1-2)
- [ ] Match & player endpoints
- [ ] Basic statistics
- [ ] Rate limiting & auth

### Phase 2: Advanced Analytics (Months 3-4)
- [ ] Heatmaps & pass networks
- [ ] xG analysis
- [ ] Comparison endpoints

### Phase 3: Creator Tools (Months 5-6)
- [ ] Stream overlay data
- [ ] Highlight detection
- [ ] Custom analytics

### Phase 4: Ecosystem (Months 7+)
- [ ] Third-party integrations
- [ ] Research partnerships
- [ ] Premium analytics

---

## Conclusion

The Analyst API is the **platform pillar** that enables a data-driven ecosystem. It ensures:

- Transparency through public data
- Creator tools built on standardized API
- Research community around the game
- No vendor lock-in

By 2027, Bass Ball analytics should rival Wyscout and StatsBomb—except it's free, decentralized, and community-owned.

