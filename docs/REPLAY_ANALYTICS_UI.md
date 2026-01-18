# 🎬 Replay & Analytics UI System

**Timeline Scrubber, Event Markers, Heatmaps, Pass Maps, Shot Maps, and Web3 Trustless Verification**

Bass Ball's replay system is where Web3 beats Web2: every match is publicly verifiable, independently analyzable, and permanently stored on-chain. Players can audit their own tactics, opponents can scout, analysts can build tools.

---

## Table of Contents

1. [Replay Viewer Architecture](#replay-viewer-architecture)
2. [Timeline Scrubber](#timeline-scrubber)
3. [Event Markers & Log](#event-markers--log)
4. [Player Heatmaps](#player-heatmaps)
5. [Pass Maps & Pass Networks](#pass-maps--pass-networks)
6. [Shot Maps & Shooting Analysis](#shot-maps--shooting-analysis)
7. [Advanced Analytics Overlays](#advanced-analytics-overlays)
8. [Web3 Trustless Verification](#web3-trustless-verification)
9. [Implementation](#implementation)

---

## Replay Viewer Architecture

### Multi-Layer Replay System

```
┌────────────────────────────────────────────────────┐
│           REPLAY VIEWER (Post-Match)                │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  LAYER 1: Match Video (60 FPS)              │  │ ← Deterministic physics render
│  │  ├─ Player positions (interpolated)         │  │
│  │  ├─ Ball physics (exact reproduction)       │  │
│  │  └─ Animation sequence (verified)           │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  LAYER 2: Data Overlay (Selectable)         │  │ ← Switch on/off
│  │  ├─ Heatmaps (possession, pressure)         │  │
│  │  ├─ Pass networks (passing graphs)          │  │
│  │  ├─ Shot zones (accuracy, xG)               │  │
│  │  └─ Event markers (goals, fouls, etc)       │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  LAYER 3: Timeline & Controls               │  │ ← Scrub, play, analyze
│  │  ├─ Timestamp slider                        │  │
│  │  ├─ Event jump buttons                      │  │
│  │  ├─ Speed control (0.25x - 2x)              │  │
│  │  └─ Download / Share buttons                │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  LAYER 4: Proof & Verification              │  │ ← On-chain hash validation
│  │  ├─ Match hash (IPFS CID)                   │  │
│  │  ├─ Block reference (Base chain)            │  │
│  │  └─ Dispute flag option                     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
└────────────────────────────────────────────────────┘
```

### Data Integrity Flow

```
Match Complete (Server)
       ↓
Deterministic Replay Generated
       ↓
Physics/AI Inputs Hashed (SHA256)
       ↓
Hash Anchored on Base (Tx)
       ↓
IPFS CID Published (decentralized storage)
       ↓
Player Gets Replay Link
       ↓
Anyone Can:
├─ Download full replay data
├─ Run local verification
├─ Extract analytics (pass maps, heatmaps)
└─ Dispute if hash doesn't match on-chain record
```

---

## Timeline Scrubber

### Interactive Timeline (Minute-by-Minute + Frame-by-Frame)

```
REPLAY VIEWER - Minute 23:45 | Duration: 90:00

┌─────────────────────────────────────────────────────────┐
│ ▶️ PLAY  ⏸️ PAUSE  ⏹️ STOP  | Speed: 1.0x 🔽          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Timeline with Event Markers:                           │
│                                                         │
│ 0:00 ─○─ 15:00 ─○─ 30:00 ─●─ 45:00 ─○─ 60:00 ─●─ 75:00 │
│       │         │         │        │        │        │
│       └─Goal?   └─Foul    └─Goal ✓ └─Injury └─Goal ✓ │
│                                                         │
│ Current: 23:45 ================================================│
│          |                                                    │
│ Scrub:   [ ◄━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━━ ► ]     │
│                  23:45 / 90:00                              │
│                                                         │
│ ZOOM CONTROLS:                                         │
│ [1-Min] [5-Min] [10-Min] [Full Match]                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Speed Controls & Playback Options

```
PLAYBACK SETTINGS:

Speed:
├─ 0.25x (frame-by-frame analysis)
├─ 0.5x (slow motion)
├─ 0.75x (normal)
├─ 1.0x (original speed) ← DEFAULT
├─ 1.5x (fast forward)
└─ 2.0x (ultra fast)

Loop Options:
├─ Full match
├─ First half only
├─ Second half only
├─ Last 5 minutes (clutch moments)
├─ Last goal + 1 minute before/after
└─ Custom range (minute X to Y)

Audio:
├─ Game sounds (default)
├─ Stadium atmosphere only
├─ Commentary (if available)
└─ Muted
```

### Keyboard Shortcuts for Timeline

```
REPLAY CONTROLS (Keyboard):

SPACE       → Play/Pause
ARROW RIGHT → +10 seconds
ARROW LEFT  → -10 seconds
SHIFT+RIGHT → +1 minute
SHIFT+LEFT  → -1 minute
CTRL+G      → Jump to goal
CTRL+F      → Jump to foul
CTRL+S      → Jump to substitution
CTRL+I      → Jump to injury
0-9         → Jump to minute (0-90)
>           → Speed up (0.25x increments)
<           → Speed down
D           → Download replay
T           → Take screenshot
```

---

## Event Markers & Log

### Event Timeline Visualization

```
MATCH EVENTS - Chronological Log

┌──────────────────────────────────────────────────────┐
│ GOAL             Min 23    Marcus Wilson (ST)        │ ← Click to jump to
│ ├─ Type: Tap-in                                      │
│ ├─ Distance: 6 yards                                 │
│ ├─ xG: 0.85 (high probability)                       │
│ └─ [🎬 Watch]  [📊 Analyze]  [Share]                  │
│                                                      │
│ FOUL             Min 34    John Silva (CB)           │
│ ├─ Type: Sliding tackle                              │
│ ├─ Severity: Yellow card                             │
│ ├─ Location: Left touchline                          │
│ └─ [🎬 Watch]  [📊 Analyze]                          │
│                                                      │
│ INJURY           Min 41    David Torres (LW)        │
│ ├─ Type: Muscle strain (hamstring)                   │
│ ├─ Severity: Can continue                            │
│ ├─ Recovery time: ~3 minutes                         │
│ └─ [🎬 Watch]                                        │
│                                                      │
│ GOAL             Min 58    James Wilson (CM)        │
│ ├─ Type: Header                                      │
│ ├─ Distance: 14 yards                                │
│ ├─ xG: 0.42 (moderate probability)                   │
│ └─ [🎬 Watch]  [📊 Analyze]  [Share]                  │
│                                                      │
│ SUBSTITUTION     Min 67    Out: Marcus Wilson      │
│ ├─ Reason: Fatigue (35% fitness)                     │
│ ├─ In: Carlos Silva (ST, 100% fitness)              │
│ └─ Formation change: 4-3-3 → 4-3-3 (same)           │
│                                                      │
│ RED CARD         Min 78    David Torres (LW)        │
│ ├─ Type: Violent conduct                             │
│ ├─ Incident: Two-footed challenge                    │
│ └─ [🎬 Watch Incident]                               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Event Statistics Sidebar

```
MATCH STATISTICS (Real-Time Updated)

Goals: 2-1 ✓
├─ Your goals: 2
├─ Opponent goals: 1
└─ Total xG: 3.7 (you) vs 2.1 (opp)

Fouls Committed:
├─ Your fouls: 3
├─ Opponent fouls: 5
└─ Yellow cards: 3-2 ✓

Injuries:
├─ Your injuries: 1 (recovered)
├─ Opponent injuries: 0

Substitutions:
├─ Your subs used: 3/5
├─ Opponent subs used: 2/5

Possession Lost:
├─ Total turnovers: 47
├─ In dangerous areas: 8
├─ Recovered within 5 sec: 31 (66%)
```

---

## Player Heatmaps

### Position Heatmap (Show Where Player Spent Most Time)

```
PLAYER HEATMAP: #10 MARCUS WILSON (ST)

         ⚫ = 0-10 touches
         🟠 = 10-20 touches
         🟡 = 20-30 touches
         🟢 = 30-50 touches
         🔵 = 50+ touches

           GK
     
   🟠  🟠  🟠  🟠     ← Opponent defense
    🟠           🟠
 🔴            🔵      ← Marcus mostly in box (top 10%)
  🔴          🟡
   🟠  🟠  🟠  🟠
 
      YOUR GK

Heat Intensity:
├─ Time in box: 72/90 = 80% (elite positioning)
├─ Time in attacking third: 68/90 = 76%
├─ Distance from own goal: 50-70 yards (offensive)
└─ Offensive pressure: 42 press attempts (high)
```

### Pressure Heatmap (Show Where Team Pressed Most)

```
TEAM PRESSURE HEATMAP (Your Team - Blue)

Heat Legend:
🔵 = Low pressure zone (passive)
🟦 = Medium pressure (standard)
🟩 = High pressure zone (aggressive)

           GK

   🟦  🟦  🟦  🟦
  🟦            🟦
🟩            🟩     ← Heavy press on wings
🟩            🟩
  🟦  🟦  🟦  🟦

      YOUR GK

Insights:
├─ Left side (LB Marcus): 85% press rate (aggressive)
├─ Right side (RB Ahmed): 62% press rate (balanced)
├─ Center: 45% press rate (defensive)
├─ Total pressing intensity: 64% (balanced)
└─ Press effectiveness: 41% of presses win ball (good)
```

### Pass Completion Heatmap (Show Safe vs Risky Zones)

```
PASSING SAFETY HEATMAP

🟢 = 85%+ completion rate (safe)
🟡 = 70-85% completion rate (moderate)
🔴 = <70% completion rate (risky)

           GK
     
   🟢  🟢  🟢  🟢
  🟢            🟡
🟢            🟡      ← Risky area near box
🟢            🟡
  🟢  🟢  🟢  🟡
 
      YOUR GK

Team Passing: 81% overall
├─ Defense third: 89% (safe, build-up)
├─ Midfield third: 82% (moderate, transition)
└─ Attack third: 68% (risky, creative plays)
```

---

## Pass Maps & Pass Networks

### Individual Pass Map (All Passes by One Player)

```
PASS MAP: #8 DAVID (CM)

Completed Passes: ✓ (Solid line)
Incomplete Passes: ✗ (Dashed line)

         GK
     
   🟡--🟡--🟡        ← Defensive passes
  🟡  ✓  ✓  🟡
🟠 ✓ ← ✓ → ✓ 🟠     ← David (CM) at center with many pass options
🟠  ✓      ✓  🟠
  🟡  ✗  ✓  🟡      ← Some incomplete passes forward
   🟡--🟡--🟡
     
      GK

Pass Statistics:
├─ Total passes: 47
├─ Completed: 42 (89%)
├─ Incomplete: 5 (11%)
├─ Average pass distance: 18 yards
├─ Forward passes: 22 (47%)
├─ Backward passes: 15 (32%)
├─ Lateral passes: 10 (21%)
├─ Key passes (chance creation): 3
└─ Pass accuracy under pressure: 86%
```

### Team Pass Network (Who Passes to Whom)

```
TEAM PASS NETWORK (First Half)

Nodes = Players
Edge thickness = Number of passes
Node size = Touches/Involvement

           [GK]
           
  [CB]---[CB]       ← Defensive passing network
   │      │
  [FB]  [FB]        ← Fullbacks connect
   │  X  │
  [DM]-[DM]         ← Midfield hub (high pass volume)
   │  X  │
  [AM]  [AM]        ← Attacking midfielders
   │  X  │
  [ST]--[ST]        ← Forward interplay

Key Passers (Pass Network Centrality):
1. #8 David (CM) - 47 passes (most involved)
2. #6 Ahmed (DM) - 43 passes
3. #4 John (CB) - 38 passes

Pass Progression:
├─ Defense → Midfield: 89 passes (78% successful)
├─ Midfield → Attack: 34 passes (71% successful)
└─ Attack → Chance: 8 passes (75% successful)

Play Style:
├─ Build from back: Yes (heavy passing in defense)
├─ Through midfield: Yes (David controls tempo)
└─ Direct to attack: No (balanced, controlled)
```

---

## Shot Maps & Shooting Analysis

### Shot Map (All Shots in Match)

```
SHOT MAP - Your Team (Blue) vs Opponent (Red)

Legend:
⚪ = Shot, Miss
🟦 = Shot, On Target
🟩 = Goal ✓
🔴 = Opponent shot
🔵 = Opponent goal

                    [GK] 🟠
     
    ⚪          🔴      ← Opponent wide shot (missed)
              🟦        ← Opponent on target (saved)
    
    🟦 ← 🟩 → 🔴        ← Goals: Your goal + Opponent goal
    (On)  (Goal)  (Goal)
    
            🟦          ← Your shot on target
            ⚪          ← Your shot missed
    
    ⚪                  ← Wide shot
    

Shot Analysis:

YOUR TEAM:
├─ Total shots: 6
├─ Shots on target: 4 (67%)
├─ Goals: 2 (33% conversion)
├─ Average distance: 16 yards
├─ xG (Expected Goals): 3.2
├─ Shots from box: 5
└─ Outside box: 1

OPPONENT:
├─ Total shots: 5
├─ Shots on target: 3 (60%)
├─ Goals: 1 (20% conversion)
├─ Average distance: 18 yards
├─ xG: 1.8
└─ Shots from box: 4

Shooting Efficiency:
├─ You: 33% (2 goals from 6 shots) ← Clinical
├─ Opponent: 20% (1 goal from 5 shots) ← Wasteful
└─ Shot quality: You 3.2 xG, Opponent 1.8 xG ← You dominated
```

### xG (Expected Goals) Breakdown

```
EXPECTED GOALS (xG) ANALYSIS

Your Team: 3.2 xG (Actual: 2 goals)
├─ Tap-in (Min 23, Marcus):     0.85 xG → GOAL ✓
├─ Header (Min 58, James):      0.42 xG → GOAL ✓
├─ Outside box (Min 15, Ahmed): 0.28 xG → MISS ✗
├─ Rebound (Min 35, Carlos):    0.67 xG → MISS ✗
├─ Chance (Min 72, Marcus):     0.75 xG → MISS ✗
└─ Long shot (Min 81, David):   0.23 xG → MISS ✗

Opponent: 1.8 xG (Actual: 1 goal)
├─ Free kick (Min 44, #9):      0.35 xG → GOAL ✓
├─ Counterattack (Min 29, #7):  0.65 xG → MISS ✗
├─ Penalty (Min 75, #9):        0.80 xG → SAVED ✗ (lucky)
└─ Edge of box (Min 88, #11):   0.20 xG → MISS ✗

Underperformance/Overperformance:
├─ You: 2 goals from 3.2 xG = -0.2 (slight underperformance)
├─ Opponent: 1 goal from 1.8 xG = -0.8 (major underperformance)
└─ Edge: You were more clinical overall
```

---

## Advanced Analytics Overlays

### Pressing Sequence Analysis

```
PRESSING SEQUENCE (Min 35-40)

Opponent has ball at their CB position
↓
Your AM presses immediately (high aggression)
├─ Success rate on this press: 35% historically
├─ Risk: Leaves space behind
↓
Opponent passes sideways to FB
↓
Your FB reacts (good positioning)
├─ Closes down in 1.2 seconds
├─ Forces error (good tackling)
↓
YOU WIN BALL
├─ Immediate counter-attack threat
├─ 3 vs 3 advantage (2 players forward)
↓
CHANCE CREATED
├─ Pass to striker
├─ Shot on target (on your shot map)

Pressing Effectiveness This Match:
├─ Press win rate: 41% (above average 35%)
├─ Presses per match: 52
├─ Time regained: Avg 3.2 seconds per win
└─ Counter-attack conversion: 8 chances from 21 presses
```

### Dribble Sequence Analysis

```
DRIBBLE SEQUENCE: #7 CARLOS (RW) - Min 52

Carlos receives ball at right wing
├─ Dribble attempt vs FB
│  ├─ Success: YES ✓
│  ├─ Distance: 3 yards
│  └─ Speed: 22 km/h
├─ 1v1 vs CB, space opens up
│  ├─ Dribble attempt 2
│  ├─ Success: YES ✓ (15-yard run)
│  ├─ Distance: 12 yards
│  └─ Creates shooting chance
├─ Takes shot from 14 yards
│  ├─ On target: YES
│  ├─ GK saves
│  └─ Rebound (Carlos off-target)

Dribble Summary:
├─ Total dribble attempts: 8
├─ Successful: 6 (75%)
├─ Failed: 2 (25%)
├─ Chances created from dribbles: 2
├─ Take-on locations: Mostly right wing
└─ Defender difficulty: Medium (FB + CB)
```

---

## Web3 Trustless Verification

### On-Chain Proof System

```
┌─────────────────────────────────────────┐
│  MATCH PROOF (On-Chain Verification)    │
├─────────────────────────────────────────┤
│                                         │
│ Match ID: 0x7a3f...8c2b                │
│ Timestamp: Jan 18, 2026, 14:32:15 UTC  │
│ Player 1: 0x1234...5678                │
│ Player 2: 0x9abc...def0                │
│                                         │
│ MATCH DATA HASH:                        │
│ SHA256: 0x5f8a2e1c9d4b7f3a6e8c2d5b9f1a│
│                                         │
│ IPFS CID (Full Replay):                 │
│ QmXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXxXx    │
│                                         │
│ BASE CHAIN PROOF:                       │
│ Tx: 0x8f7e6d5c4b3a2f1e9d8c7b6a5f4e3d2  │
│ Block: 19,847,392                      │
│ Confirmation: 128 blocks (confirmed)   │
│                                         │
│ VERIFICATION:                           │
│ ✓ Hash matches on-chain                │
│ ✓ IPFS file integrity confirmed        │
│ ✓ Physics reproducible locally         │
│ ✓ No disputes filed                    │
│ ✓ Dispute period: Closed (30 days)     │
│                                         │
│ [Download Full Replay] [Verify Locally] │
│ [Challenge Result] [View Dispute]       │
│                                         │
└─────────────────────────────────────────┘
```

### Trustless Verification Flow

```
VERIFICATION OPTIONS (Available to Anyone):

1. DOWNLOAD FULL REPLAY
   ├─ Entire match data (1-2 GB)
   ├─ Run locally on your machine
   ├─ Re-render match frame-by-frame
   ├─ Verify physics against on-chain hash
   └─ Confirm no server manipulation

2. VERIFY VIA IPFS GATEWAY
   ├─ Access replay via public IPFS
   ├─ Check file integrity (hash match)
   ├─ Confirm stored on Arweave (permanent)
   └─ View without full download

3. BLOCKCHAIN VERIFICATION
   ├─ Query Base chain proof
   ├─ Check match hash on-chain
   ├─ View timestamp + players
   ├─ See dispute status
   └─ Confirm no tampering

4. CHALLENGE/DISPUTE PROCESS
   ├─ If physics doesn't match: File dispute
   ├─ Provide alternative hash
   ├─ Smart contract arbitration
   ├─ Prize pool ($100 per confirmed exploit)
   └─ Auto-refund if cheat detected
```

### Dispute Mechanism

```
MATCH DISPUTE (Min 23 Goal - "Was It Offside?")

Claim: "Marcus was in offside position"
┌────────────────────────────────────────┐
│ DISPUTE EVIDENCE:                      │
├────────────────────────────────────────┤
│ [Show Frame-by-Frame Replay]            │
│                                        │
│ Min 23:42 (Ball played)                │
│ Marcus position: 2 yards ahead of CB   │
│ Latest CB position: 4 yards back       │
│ Conclusion: ONSIDE ✓ (offside flag off)│
│                                        │
│ Alternative Analysis:                  │
│ "But angle from this view..."          │
│ [Load 3D Positional Data]              │
│ [Render from different angle]          │
│                                        │
│ Verdict: NOT OFFSIDE (physics verified)
│                                        │
│ [Accept Verdict] [Appeal] [Lodge Formal]
└────────────────────────────────────────┘

Dispute Resolution:
├─ Community voting (low ELO impact)
├─ Smart contract arbitration (high ELO)
├─ Automated physics verification
└─ Escalation to developers if ambiguous
```

---

## Implementation

### ReplayAnalyticsController Class

```typescript
class ReplayAnalyticsController {
  private match: Match;
  private replayData: ReplayFrame[] = [];
  private currentFrame: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  
  // Initialize replay viewer
  initializeReplayViewer(matchId: string): void {
    // Fetch replay from IPFS/Base chain
    const replayHash = this.fetchMatchProofFromChain(matchId);
    this.replayData = this.downloadReplayFromIPFS(replayHash);
    
    // Render initial frame
    this.renderFrame(0);
    
    // Display proof information
    this.displayBlockchainProof(matchId);
  }
  
  // Timeline scrubber
  scrubToTimestamp(minutes: number, seconds: number): void {
    const frameIndex = (minutes * 60 + seconds) * 60; // 60 FPS
    this.currentFrame = Math.min(frameIndex, this.replayData.length - 1);
    this.renderFrame(this.currentFrame);
    
    // Update UI
    this.updateTimeDisplay(minutes, seconds);
    this.updateEventMarkers(minutes);
  }
  
  // Playback controls
  play(): void {
    this.isPlaying = true;
    this.playLoop();
  }
  
  pause(): void {
    this.isPlaying = false;
  }
  
  private playLoop(): void {
    if (!this.isPlaying) return;
    
    const nextFrame = this.currentFrame + this.playbackSpeed;
    if (nextFrame < this.replayData.length) {
      this.currentFrame = nextFrame;
      this.renderFrame(Math.floor(this.currentFrame));
      requestAnimationFrame(() => this.playLoop());
    } else {
      this.isPlaying = false;
    }
  }
  
  // Generate heatmap overlay
  generateHeatmap(type: 'position' | 'pressure' | 'passing'): void {
    const heatmapData = new Map<{ x: number; y: number }, number>();
    
    // Aggregate player positions over match
    this.replayData.forEach(frame => {
      const players = type === 'position' 
        ? [frame.players.find(p => p.id === this.selectedPlayer)]
        : frame.players;
      
      players.forEach(player => {
        const gridCell = this.discretizePosition(player.x, player.y);
        heatmapData.set(
          gridCell,
          (heatmapData.get(gridCell) || 0) + 1
        );
      });
    });
    
    // Render heatmap
    this.renderHeatmapOverlay(heatmapData, type);
  }
  
  // Generate pass map
  generatePassMap(playerId: string): void {
    const passes = this.replayData
      .flatMap(frame => frame.events)
      .filter(event => 
        event.type === 'pass' && event.fromPlayer === playerId
      );
    
    // Draw passes (completed vs incomplete)
    passes.forEach(pass => {
      const completed = pass.success;
      const color = completed ? '#00aa00' : '#ff0000';
      const lineStyle = completed ? 'solid' : 'dashed';
      
      this.drawLine(
        pass.fromPos,
        pass.toPos,
        color,
        lineStyle,
        completed
      );
    });
    
    // Display pass stats
    const completed = passes.filter(p => p.success).length;
    const accuracy = (completed / passes.length) * 100;
    this.displayPassStats(playerId, passes.length, accuracy);
  }
  
  // Generate shot map
  generateShotMap(): void {
    const shots = this.replayData
      .flatMap(frame => frame.events)
      .filter(event => event.type === 'shot');
    
    shots.forEach(shot => {
      const marker = this.getShotMarker(shot.result);
      const distance = shot.distance;
      const xG = shot.expectedGoals;
      
      this.drawShotMarker(shot.pos, marker, xG);
      this.displayShotTooltip(shot, distance, xG);
    });
    
    // Display xG summary
    const yourxG = shots
      .filter(s => s.team === 'yours')
      .reduce((sum, s) => sum + s.expectedGoals, 0);
    const oppxG = shots
      .filter(s => s.team === 'opponent')
      .reduce((sum, s) => sum + s.expectedGoals, 0);
    
    this.displayxGComparison(yourxG, oppxG);
  }
  
  // Verify replay on-chain
  verifyReplayIntegrity(matchId: string): boolean {
    const onChainHash = this.fetchProofFromChain(matchId);
    const localHash = this.calculateReplayHash(this.replayData);
    
    if (onChainHash === localHash) {
      this.displayVerificationStatus('✓ Match verified', 'green');
      return true;
    } else {
      this.displayVerificationStatus('✗ Hash mismatch - possible tampering', 'red');
      this.enableDisputeButton(matchId);
      return false;
    }
  }
  
  // Dispute handler
  fileDispute(matchId: string, claim: string): void {
    const disputeData = {
      matchId,
      claimant: this.currentPlayer,
      claim,
      timestamp: Date.now(),
      evidence: this.captureCurrentFrame(), // Screenshot
      localHash: this.calculateReplayHash(this.replayData),
    };
    
    // Store on-chain
    this.submitDisputeToChain(disputeData);
    
    // Display dispute status
    this.displayDisputeStatus('Dispute filed - awaiting arbitration');
  }
  
  private renderFrame(frameIndex: number): void {
    const frame = this.replayData[frameIndex];
    
    // Render ball position
    this.renderBall(frame.ball);
    
    // Render player positions
    frame.players.forEach(player => {
      this.renderPlayer(player);
    });
    
    // Render event markers
    this.renderEventMarkers(frame.events);
  }
  
  private discretizePosition(x: number, y: number): { x: number; y: number } {
    // Convert continuous position to grid cell (for heatmap)
    const gridSize = 100 / 10; // 10x10 grid
    return {
      x: Math.floor(x / gridSize),
      y: Math.floor(y / gridSize),
    };
  }
  
  private getShotMarker(result: 'goal' | 'saved' | 'miss'): string {
    switch (result) {
      case 'goal': return '🟩';
      case 'saved': return '🟦';
      case 'miss': return '⚪';
    }
  }
}
```

---

## Replay & Analytics Summary

✅ **Deterministic Replay**: Verifiable physics, reproduced locally  
✅ **Timeline Scrubber**: Minute-by-minute + frame-by-frame navigation  
✅ **Event Markers**: Goals, fouls, injuries, substitutions with timestamps  
✅ **Player Heatmaps**: Position, pressure, passing safety zones  
✅ **Pass Maps**: Individual passes + team pass networks  
✅ **Shot Maps**: All shots with xG analysis  
✅ **Web3 Verification**: On-chain proof, IPFS storage, dispute resolution  
✅ **Public Analysis**: Anyone can download, verify, dispute  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Web3 Advantage**: ✅ Trustless Verification System
