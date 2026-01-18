# 👀 Spectator Mode & Broadcasting System

**Live Match Spectating, Delayed Verified Spectating, Tournament Casting UI, and Community Engagement**

Bass Ball's spectator mode transforms passive viewers into active community participants—with real-time match watching, trustless replay verification, professional tournament broadcasting, and spectator rewards.

---

## Table of Contents

1. [Spectator Mode Overview](#spectator-mode-overview)
2. [Live Match Spectating](#live-match-spectating)
3. [Delayed Verified Spectating](#delayed-verified-spectating)
4. [Tournament Casting Mode](#tournament-casting-mode)
5. [Camera Systems](#camera-systems)
6. [Spectator UI & Controls](#spectator-ui--controls)
7. [Spectator Rewards & Engagement](#spectator-rewards--engagement)
8. [Broadcasting Integration](#broadcasting-integration)
9. [Implementation](#implementation)

---

## Spectator Mode Overview

### What is Spectator Mode?

**Spectator mode** allows players to watch ongoing and completed matches with:
- **Live spectating**: Real-time viewing of matches in progress (~500ms latency)
- **Delayed spectating**: Verified replay of completed matches with on-chain proof
- **Tournament casting**: Professional broadcast UI with director controls
- **Camera control**: 5+ camera angles, zoom, player tracking
- **Interactive stats**: Live stats overlay, heatmaps, player info cards
- **Spectator rewards**: Cosmetics, battle pass XP, badges for engagement

```
┌────────────────────────────────────────────────┐
│      SPECTATOR ECOSYSTEM                       │
├────────────────────────────────────────────────┤
│                                                │
│  MATCH DISCOVERY                               │
│  ├─ Browse Live Matches                        │
│  ├─ Search by League/Division/Region           │
│  ├─ Favorites & Subscriptions                  │
│  └─ Tournament Schedule                        │
│                                                │
│  LIVE SPECTATING                               │
│  ├─ Real-time match feed (60 FPS)              │
│  ├─ ~500ms latency (network + streaming)       │
│  ├─ Live stats overlay                         │
│  ├─ Event log (goals, fouls, subs)             │
│  └─ Spectator chat (mutable)                   │
│                                                │
│  DELAYED SPECTATING                            │
│  ├─ Watch completed matches                    │
│  ├─ Replay with on-chain proof badge           │
│  ├─ Full analytics (heatmaps, pass maps)       │
│  └─ Download replay for local verification     │
│                                                │
│  TOURNAMENT CASTING                            │
│  ├─ Professional broadcast UI                  │
│  ├─ Director controls (camera, stats)          │
│  ├─ Multiple camera feeds                      │
│  ├─ Commentary sync (if available)             │
│  └─ Instant replay & slow-motion               │
│                                                │
│  COMMUNITY ENGAGEMENT                          │
│  ├─ Spectator chat (teams or global)           │
│  ├─ Match predictions (cosmetics prize)        │
│  ├─ Trivia during halftime                     │
│  └─ Spectator badges (10/50/100 matches)       │
│                                                │
└────────────────────────────────────────────────┘
```

---

## Live Match Spectating

### Live Match Discovery

```
BROWSE LIVE MATCHES:

┌──────────────────────────────────────┐
│ LIVE MATCHES                         │
│ [Filter] [Search] [My Favorites]     │
├──────────────────────────────────────┤
│                                      │
│ 🔴 LIVE (12 matches):               │
│                                      │
│ Match 1:                             │
│ ├─ Ahmed (1,650 ELO) vs Sarah       │
│ │  (1,550 ELO)                      │
│ ├─ Kickoff: 2:14 / 90:00            │
│ ├─ Score: 2-1 Ahmed                 │
│ ├─ Viewers: 342 spectators           │
│ └─ [Watch Live] [Add to Favorites]  │
│                                      │
│ Match 2:                             │
│ ├─ Diamond Club Tournament Semi      │
│ ├─ Apex Predators vs United Force    │
│ ├─ Score: 1-0 (35th min)             │
│ ├─ Viewers: 1,247 spectators         │
│ └─ [Watch Live] [Add to Favorites]  │
│                                      │
│ Match 3-12: [More live matches...]   │
│                                      │
│ UPCOMING (Next 2 hours):             │
│ ├─ 6:00 PM: Charity Match            │
│ ├─ 6:30 PM: Regional Cup Final       │
│ └─ 7:00 PM: Championship Qualifier   │
│                                      │
│ [Schedule] [All Tournaments]         │
│                                      │
└──────────────────────────────────────┘

Filter Options:
├─ ELO Range (1000-2800)
├─ Region (Global / US / EU / ASIA)
├─ League (Ranked / Tournament)
├─ Viewer Count (Popular / All)
└─ Favorites Only
```

### Live Spectating Interface

```
┌─────────────────────────────────────────────────┐
│ LIVE SPECTATING VIEW (Full Screen)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │                                           │  │
│  │          LIVE MATCH FEED (60 FPS)         │  │
│  │       [Camera: Wide Angle] [Zoom: 1.0x]  │  │
│  │                                           │  │
│  │        Ahmed (2-1 Sarah)                  │  │
│  │        35:42 / 90:00 | HT: 1-1           │  │
│  │                                           │  │
│  │    FORMATION: 4-3-3          4-2-3-1      │  │
│  │                                           │  │
│  │  [Formation cards]                        │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│  📊 LIVE STATS            | 💬 SPECTATOR CHAT  │
│  ├─ Ahmed:                | [Mute Chat]       │
│  │  Possession: 58%       | [Team Colors]     │
│  │  Shots: 7 (3 on target)│ Team A is strong! │
│  │  Passes: 342 (85%)     | Great pass!       │
│  │  Tackles: 12 (67%)     | Did you see that? │
│  │                        | GG so far        │
│  ├─ Sarah:                | [Report]          │
│  │  Possession: 42%       │                   │
│  │  Shots: 4 (1 on target)│ 2,147 spectators  │
│  │  Passes: 249 (81%)     │                   │
│  │  Tackles: 8 (70%)      │                   │
│  │                        │                   │
│  └────────────────────────┴───────────────────┘
│  EVENT LOG:                                    │
│  35:42 Goal! Ahmed scores 2-1                  │
│  35:30 Shot (On Target): Ahmed                │
│  35:10 Pass to Forward: Sarah (intercepted)   │
│  ...                                           │
│                                                │
│  [Prediction] [Player Stats] [Camera ▼]        │
│                                                │
└─────────────────────────────────────────────────┘

Controls (Keyboard):
├─ C: Cycle camera angles
├─ +/-: Zoom in/out
├─ R: Instant replay (5-sec)
├─ Space: Pause/Resume (tournament only)
├─ 1-9: Jump to player
└─ Esc: Exit spectating
```

### Live Spectating Technical Details

```
LIVE SPECTATING ARCHITECTURE:

Player A Match Stream:
├─ Server generates match state (60 Hz)
├─ Encoded as video frame (H.264)
├─ Sent to spectator servers
├─ Distributed via CDN (edge nodes)
├─ Latency breakdown:
│  ├─ Server processing: 16ms
│  ├─ Streaming buffer: 100-200ms
│  ├─ Network transit: 50-100ms
│  └─ Client decode: 100-200ms
│  └─ Total: ~500ms (acceptable)
└─ Broadcast to all viewers

Viewer Quality Options:
├─ 1080p 60 FPS (5 Mbps) - Desktop/Laptop
├─ 720p 60 FPS (2.5 Mbps) - Mobile HD
├─ 480p 30 FPS (1 Mbps) - Mobile Low-bandwidth
└─ Audio-only (128 kbps) - Radio Commentary

Spectator Limit Per Match:
├─ Standard Match: Unlimited viewers
├─ Tournament Match: Unlimited (large matches auto-scale)
└─ Auto-scaling: CDN handles millions simultaneously

Live Stats Sync:
├─ Match stats sent every 5 seconds
├─ Player positions updated 60 Hz
├─ Possession % updates real-time
├─ Live heatmap overlay (low latency)
└─ Event log updates instantly
```

---

## Delayed Verified Spectating

### Watching Completed Matches (On-Chain Verified)

```
DELAYED SPECTATING INTERFACE:

┌─────────────────────────────────────┐
│ REPLAY LIBRARY                      │
│ [Recent] [Favorites] [League]       │
├─────────────────────────────────────┤
│                                     │
│ ✅ VERIFIED REPLAYS (14):           │
│ (On-chain proof, trustworthy)       │
│                                     │
│ Match 1:                            │
│ ├─ Ahmed (1,650) vs Sarah (1,550)   │
│ ├─ Final: 2-1 Ahmed                 │
│ ├─ Date: Mar 15, 2026               │
│ ├─ Duration: 90 minutes             │
│ ├─ Verified: ✅ Base Chain Hash     │
│ │  Hash: 0x8f4a2c... (click detail) │
│ ├─ Block: 18,234,567 (12 days ago)  │
│ └─ [Watch] [Download] [Details]     │
│                                     │
│ Match 2:                            │
│ ├─ Club Tournament Final             │
│ ├─ Apex Predators 4 - 2 United      │
│ ├─ Verified: ✅ IPFS + Blockchain   │
│ └─ [Watch] [Download] [Details]     │
│                                     │
│ ... 12 more verified replays        │
│                                     │
│ UNVERIFIED (Can Still Watch):       │
│ ├─ Match 15: Practice mode          │
│ ├─ Match 16: Friend match           │
│ ├─ Status: Replay stored locally    │
│ └─ [Watch] (No blockchain proof)    │
│                                     │
└─────────────────────────────────────┘

Verified Badge Explanation:
├─ ✅ Green checkmark = On-chain proof exists
├─ Match is reproducible, deterministic
├─ Anyone can download and verify locally
├─ Dispute system available (if cheat suspected)
└─ Trust level: Highest (Web3 verified)
```

### Delayed Spectating Features

```
REPLAY VIEWER WITH ON-CHAIN PROOF:

Timeline Scrubber:
├─ Minute-by-minute navigation (0:00 - 90:00)
├─ Frame-by-frame scrubbing (0.25x - 2.0x speed)
├─ Key moment markers (goals, fouls, red cards)
├─ Click any event to jump (instant replay)
└─ Remember last watched position (auto-resume)

Heatmap Overlays:
├─ Position heatmap (where each player spent time)
├─ Pressure heatmap (where team pressed opponent)
├─ Passing safety heatmap (completion % by zone)
├─ Player selection (view any individual player)
└─ Toggleable: On/Off, team-specific, player-specific

Pass Maps & Analytics:
├─ All passes (completed vs incomplete)
├─ Pass network (node size = involvement)
├─ Average pass length per player
├─ Pass clustering (short/medium/long passes)
├─ Top passer identification
└─ Pass accuracy trends (1st half vs 2nd half)

Shot Maps & xG Analysis:
├─ All shots with visualization
├─ Color-coded: Miss (gray), On-Target (blue), Goal (green)
├─ xG rating per shot (0.05 - 0.95)
├─ Expected goals total (xG 2.4 vs Actual 2)
├─ Conversion efficiency (67% vs 33% average)
└─ Shot clustering analysis

Dispute System (If Cheating Suspected):
├─ [File Claim] button on verified replay
├─ User submits: Evidence + timestamp
├─ System downloads match data (3D positions, inputs)
├─ Smart contract arbitration (7-day vote)
├─ $100 bounty if exploit confirmed
└─ Auto-refund ELO to victim if cheating proved
```

### Downloading & Local Verification

```
DOWNLOAD REPLAY FOR LOCAL VERIFICATION:

┌─────────────────────────────┐
│ DOWNLOAD VERIFIED REPLAY    │
├─────────────────────────────┤
│                             │
│ Match: Ahmed vs Sarah       │
│ Date: Mar 15, 2026          │
│ File: match_replay.bbr      │
│ Size: 1.2 GB                │
│ Format: Bass Ball Replay    │
│                             │
│ [Start Download]            │
│ ████████████░░░░░░░ 58%    │
│ ~5 minutes remaining        │
│                             │
│ [Pause] [Cancel]            │
│                             │
│ Downloaded Replays:         │
│ ├─ match_replay_001.bbr ✓   │
│ ├─ match_replay_002.bbr ✓   │
│ └─ match_replay_003.bbr ✓   │
│                             │
│ [View Local Library]        │
│                             │
└─────────────────────────────┘

Local Verification (Command Line):
```
$ bass-ball verify match_replay.bbr
Verifying replay...
├─ File integrity: ✅ SHA-256 checksum valid
├─ Physics deterministic: ✅ Reproducible
├─ Player inputs: ✅ Recorded correctly
├─ Match outcome: ✅ Matches blockchain
├─ On-chain proof: ✅ Hash match (Base chain)
│  └─ Block: 18,234,567
│  └─ TX: 0x9a3f2c...
└─ Result: ✅ VERIFIED (No cheating detected)

Can also verify online:
├─ Visit BassBall.io/verify
├─ Upload replay file
├─ System verifies against blockchain
└─ Get detailed report
```

---

## Tournament Casting Mode

### Professional Tournament UI

```
TOURNAMENT BROADCAST VIEW:

┌─────────────────────────────────────────────┐
│ 🏆 CLUB CHAMPIONSHIP FINAL (Season 1)       │
│ Apex Predators (2,150) vs United Force      │
│ Best of 3 | Match 1 | Kickoff Time 8:00 PM │
├─────────────────────────────────────────────┤
│                                             │
│ ┌────────────────────────────────────────┐ │
│ │        BROADCAST MATCH FEED (60 FPS)   │ │
│ │                                        │ │
│ │  Apex Predators vs United Force        │ │
│ │  1-0 (32:14) | First Half              │ │
│ │                                        │ │
│ │ Camera: [Wide ▼]  Angle: [Broadcast]  │ │
│ │                                        │ │
│ │ [Zoom] [Lock-on] [Instant Replay]     │ │
│ │                                        │ │
│ └────────────────────────────────────────┘ │
│                                             │
│ TOURNAMENT INFO        | STATISTICS         │
│ ├─ Apex Predators     | Possession         │
│ │  ├─ Formation: 4-2-3-1                 │ Apex: 62%
│ │  ├─ Players: 11/11  | United: 38%
│ │  └─ Bench: 3        |                   │
│ │                     | Shots              │
│ ├─ United Force       | Apex: 8 (4 target) │
│ │  ├─ Formation: 3-5-2|                   │
│ │  ├─ Players: 11/11  | United: 3 (1 tgt) │
│ │  └─ Bench: 4        |                   │
│ │                     | Passes             │
│ ├─ Venue: Virtual     | Apex: 285 (88%)    │
│ │  Stadium (Default) | United: 168 (79%)  │
│ │                     |                   │
│ ├─ Referee: AI Fair   | Fouls              │
│ │  Play (No Bias)     | Apex: 2 Yellow    │
│ │                     | United: 4 Yellow  │
│ ├─ Commentary: ON     |                   │
│ │  (Audio stream)     | xG                 │
│ │                     | Apex: 1.8 (1 goal)│
│ └─ Replay Speed: 1.0x | United: 0.6 (0 gl)│
│                       |                   │
│ ┌─────────────────────────────────────┐   │
│ │ SPECTATORS: 12,847 WATCHING         │   │
│ │ 💬 CHAT (Team): "GOAAALLL!!"        │   │
│ │ [Mute] [Team Chat] [Global Chat]    │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ [Director Controls] [Camera Presets]        │
│ [Switch Teams] [Show Heatmap]              │
│                                             │
└─────────────────────────────────────────────┘

Director Controls (Tournament Moderator):
├─ Select which camera angle to broadcast
├─ Lock-on to specific player (follow)
├─ Trigger instant replay (5-second clip)
├─ Show/hide heatmaps, pass maps
├─ Display player stat cards
├─ Adjust camera zoom/angle in real-time
├─ Manage commentary sync (mute/unmute)
└─ Switch between live view and tactical board
```

### Tournament Casting Features

```
TACTICAL BOARD OVERLAY:

┌───────────────────────────────────────────┐
│ SHOW TACTICAL BOARD (Director Toggle)    │
├───────────────────────────────────────────┤
│                                           │
│      Apex Predators (4-2-3-1)            │
│                                           │
│  GOALKEEPER                               │
│           [1]                             │
│                                           │
│  DEFENDERS (4)                            │
│      [2]  [3]  [4]  [5]                  │
│                                           │
│  MIDFIELDERS (2)                          │
│        [6]       [7]                      │
│                                           │
│  ATTACKING MIDFIELDERS (3)                │
│      [8]  [9]  [10]                      │
│                                           │
│  STRIKER                                  │
│           [11]                            │
│                                           │
│ Click any player to show individual stats │
│ [Show Heat Map] [Show Pass Map]           │
│                                           │
└───────────────────────────────────────────┘

Player Stat Card (On-Demand):

┌──────────────────────────────┐
│ PLAYER #9 (Forward)          │
│ Name: Ahmed                  │
│ Rating: 1,650 ELO            │
│ Mastery: 95% (Expert)        │
├──────────────────────────────┤
│ THIS MATCH:                  │
│ ├─ Shots: 4 (2 on target)    │
│ ├─ Goals: 1 ⚽               │
│ ├─ Pass Acc: 85%             │
│ ├─ Dribbles: 6               │
│ ├─ Tackles: 2                │
│ └─ Yellow Cards: 0           │
│                              │
│ SEASON STATS:                │
│ ├─ Goals: 24                 │
│ ├─ Assists: 8                │
│ ├─ Avg Rating: 7.8/10        │
│ └─ Consistency: Very High    │
│                              │
└──────────────────────────────┘

Instant Replay with Slow-Motion:

[Instant Replay Button Triggered]
├─ Capture last 5 seconds (automatically saved)
├─ Replay controls:
│  ├─ Playback speed: 0.25x, 0.5x, 1.0x, 2.0x
│  ├─ Frame scrubbing (±1 frame)
│  ├─ Multiple angles (if available)
│  └─ Duration: Show at halftime/after goal
└─ Then return to live feed

Commentary Sync (Optional):
├─ Cast decides to enable/disable live commentary
├─ Commentary feed synced from external audio stream
├─ Caster can mute live feed to talk over
├─ Crowd noise/ambient still present
└─ Spectators can toggle commentary in settings
```

---

## Camera Systems

### 5+ Camera Angles

```
CAMERA PRESET ANGLES:

1. BROADCAST VIEW (Default)
   ├─ Wide angle, 3/4 perspective
   ├─ Shows entire pitch
   ├─ Ideal for general spectating
   └─ Ball always visible

2. PLAYER POV (First-Person)
   ├─ View from selected player
   ├─ 100° field of view
   ├─ Perspective slightly elevated
   ├─ Shows player controls & stick input
   └─ Lock-on option: Follow player continuously

3. AERIAL VIEW (Overhead)
   ├─ Top-down perspective (0° angle)
   ├─ Entire pitch visible at once
   ├─ Tactical analysis view
   ├─ Shows player positions & formations
   └─ Color-coded by team

4. TACTICAL BOARD
   ├─ 2D top-down schematic
   ├─ Player positions (circles)
   ├─ Player numbers, formations
   ├─ Perfect for pause/analysis
   └─ No actual match video (static view)

5. GOALKEEPER VIEW
   ├─ Behind-goal angle (elevated)
   ├─ Shows full width of pitch
   ├─ Goalkeeper's perspective
   ├─ Good for defensive analysis
   └─ Corners & set-pieces highlighted

6. CORNER/FREE KICK VIEW (Dynamic)
   ├─ Automatically switches during set pieces
   ├─ Close-up of attacking area
   ├─ Shows delivery angle & keeper positioning
   └─ Returns to broadcast after event

CUSTOM CAMERA CONTROL:

Mouse/Trackpad:
├─ Drag to pan/rotate camera
├─ Scroll to zoom in/out (0.5x - 3.0x)
├─ Right-click lock-on to player
└─ Middle-click reset to default

Keyboard Shortcuts:
├─ C: Cycle through presets (1→2→3→4→5)
├─ Shift+C: Reverse (5→4→3→2→1)
├─ 1-5: Jump to specific camera
├─ Spacebar: Smooth transition to next camera
├─ +/- or Scroll: Zoom in/out
├─ Arrow keys: Pan left/right/up/down
└─ R: Instant replay (5-sec, same camera)

Spectator Preferences (Save):
├─ Favorite camera angle
├─ Default zoom level
├─ Commentary on/off
├─ Chat mode (team/global/off)
└─ Auto-save every match
```

---

## Spectator UI & Controls

### Spectator Controls Interface

```
SPECTATOR CONTROL PANEL (Bottom Right):

┌─────────────────────────┐
│ SPECTATOR TOOLS         │
├─────────────────────────┤
│                         │
│ [Camera Presets]        │
│ ├─ 1. Broadcast         │
│ ├─ 2. Player POV        │
│ ├─ 3. Aerial            │
│ ├─ 4. Tactical Board    │
│ └─ 5. GK View           │
│                         │
│ [Zoom Controls]         │
│ ├─ Current: 1.0x        │
│ ├─ [−] [+]              │
│ └─ Range: 0.5x - 3.0x   │
│                         │
│ [Statistics]            │
│ ├─ [Possession]         │
│ ├─ [Shots]              │
│ ├─ [Passes]             │
│ └─ [Fouls/Cards]        │
│                         │
│ [Overlays]              │
│ ├─ [Heat Map]           │
│ ├─ [Pass Map]           │
│ ├─ [Shot Map]           │
│ ├─ [Formation Grid]     │
│ └─ [xG Indicator]       │
│                         │
│ [Playback]              │
│ ├─ [Instant Replay]     │
│ ├─ [Slow Motion]        │
│ └─ [Speed: 1.0x ▼]      │
│                         │
│ [Settings]              │
│ ├─ [Commentary On/Off]  │
│ ├─ [Chat Mode]          │
│ ├─ [Subtitles]          │
│ └─ [Accessibility]      │
│                         │
└─────────────────────────┘

Match Info Header:

┌─────────────────────────────────────────┐
│ Apex Predators 2 - 1 United Force       │
│ Match 1 of 3 | Season 1 Championship    │
│ 45:22 / 90:00 | First Half              │
├─────────────────────────────────────────┤
│ Apex (4-2-3-1): 62% Possession          │
│ United (3-5-2): 38% Possession          │
│ Viewers: 12,847 | Pred: 1,234 on Apex  │
└─────────────────────────────────────────┘
```

---

## Spectator Rewards & Engagement

### Spectator Rewards System

```
SPECTATOR REWARDS:

Watching Matches Earns:
├─ Battle Pass XP (+5 XP per match watched)
│  └─ 5 matches = 25 XP (unlock cosmetics)
│
├─ Spectator Badges (Cosmetic Achievement)
│  ├─ Bronze Badge: 10 matches watched
│  ├─ Silver Badge: 50 matches watched
│  ├─ Gold Badge: 100 matches watched
│  ├─ Diamond Badge: 250 matches watched
│  └─ Master Badge: 500 matches watched
│  └─ Badges display on player profile
│
├─ Tournament Cosmetics (Cosmetics Only)
│  ├─ Watch any tournament match: +$0.50
│  ├─ Watch championship final: +$1.00
│  ├─ Spectator-only cosmetics (team jersey)
│  └─ Rare drops (5% chance per match)
│
├─ Prediction Rewards (Match Outcome Betting)
│  ├─ Correct prediction: +$0.25 cosmetics
│  ├─ Correct score: +$1.00 cosmetics
│  └─ Monthly leaderboard: Top 10 get special badge
│
└─ Streamer Rewards (For Broadcasting)
   ├─ Link Twitch/YouTube account
   ├─ Broadcast matches live (through platform)
   ├─ Earn $0.10 per 100 viewers
   ├─ Exclusive streamer cosmetics
   └─ Affiliate revenue share (5% of subs)

Example Progression:
├─ Watch Match 1: +5 XP, +$0.50 cosmetics
├─ Watch Match 10: Unlock Bronze Badge
├─ Watch Match 50: Unlock Silver Badge + Special Jersey
├─ Watch Match 100: Unlock Gold Badge + Gold Cosmetics
└─ Total Value: $50 cosmetics earned from 100 matches
   (Equivalent to 50 cosmetic purchases = $1,250 value)
```

### Match Predictions & Engagement

```
MATCH PREDICTION SYSTEM:

┌─────────────────────────────────────┐
│ PREDICT THE MATCH OUTCOME           │
│ Apex Predators vs United Force      │
├─────────────────────────────────────┤
│                                     │
│ WHO WILL WIN?                       │
│                                     │
│ [○] Apex Predators (6:4 odds)       │
│     If correct: +$0.25 cosmetics    │
│                                     │
│ [○] Draw (3:1 odds)                 │
│     If correct: +$0.50 cosmetics    │
│                                     │
│ [○] United Force (4:6 odds)         │
│     If correct: +$0.25 cosmetics    │
│                                     │
│ WHAT'S THE SCORE?                   │
│ [1-0] [2-1] [3-2] [2-2] [3-1] ...  │
│ [2-0] [1-1] [3-0] [4-2] [Other]    │
│ If exact: +$1.00 cosmetics          │
│                                     │
│ [Submit Prediction] [Rules]         │
│                                     │
└─────────────────────────────────────┘

Prediction Leaderboard (Monthly):

Rank │ Player        │ Correct │ Profit
─────┼───────────────┼─────────┼────────
1    │ ProPredictors │ 48/50   │ +$24
2    │ DataDriven    │ 47/50   │ +$23
3    │ MatchMaster   │ 46/50   │ +$22
...
Top 10 get: Monthly Badge + $10 cosmetics bonus
```

### Spectator Chat & Community

```
SPECTATOR CHAT FEATURES:

Chat Modes:
├─ Team Chat (only your team's supporters)
├─ Global Chat (all spectators watching)
├─ Off (silent, no chat visible)
└─ Spectators can toggle anytime

Chat Moderation:
├─ Auto-filter profanity & harassment
├─ Report player option (flag + reason)
├─ Mute individual users
├─ Mute by region/language filter
├─ Community moderators (volunteer)
└─ Toxicity auto-reduces message visibility

Chat Features:
├─ Emotes & reactions (⚽ ⚠️ 🔥 😍 etc.)
├─ Gifs (curated, no spam)
├─ Pinned messages (tournament info, rules)
├─ Message reactions (heart, laugh, etc.)
└─ Mention players (@Ahmed, @Sarah)

Spectator Badges (In Chat):
├─ 🏆 Tournament Caster (broadcast verified)
├─ 📺 Verified Streamer (Twitch/YouTube linked)
├─ ⭐ Season Champion Supporter (cheering champ)
├─ 💎 Diamond Spectator (250+ matches)
└─ 🎖️ Verified Referee (official match moderator)
```

---

## Broadcasting Integration

### Streaming Integration

```
LINK STREAMING ACCOUNTS (Optional):

┌────────────────────────────────────┐
│ STREAMING INTEGRATION              │
├────────────────────────────────────┤
│                                    │
│ [Link Twitch Account]              │
│ └─ Authorize app access            │
│    └─ Broadcast match to followers │
│    └─ Earn: $0.10 per 100 viewers  │
│                                    │
│ [Link YouTube Account]             │
│ └─ Authorize app access            │
│    └─ Stream to YouTube Live       │
│    └─ Earn: $0.10 per 100 viewers  │
│                                    │
│ [Link Discord Server]              │
│ └─ Auto-notify followers           │
│    └─ Match alerts in Discord      │
│    └─ Instant embed match link     │
│                                    │
│ Streamer Benefits:                 │
│ ├─ Exclusive overlay graphics      │
│ ├─ Custom HUD (show/hide elements) │
│ ├─ Streamer cosmetic reward        │
│ ├─ Affiliate revenue (5% subs)     │
│ └─ Featured in Bass Ball Esports   │
│                                    │
│ Earnings Dashboard:                │
│ ├─ This month: $47.50 (476 viewers)│
│ ├─ Total earned: $234.80           │
│ ├─ Payout available: $200          │
│ └─ [Request Payout]                │
│                                    │
└────────────────────────────────────┘

Streamer HUD:
├─ Match score overlay (moveable)
├─ Team formations (dynamic)
├─ Possession % display
├─ Live commentary text (optional)
├─ Viewer count & chat integration
├─ Alerts for goals/red cards/subs
└─ Custom branding (streamer logo)
```

### Tournament Broadcasting

```
TOURNAMENT OFFICIAL BROADCAST:

Bass Ball Esports Schedule:
├─ Season Championship (Weekly Matches)
│  ├─ Thursday 8 PM EST: Semifinals
│  ├─ Saturday 7 PM EST: Final (Best of 3)
│  └─ Official broadcast on platform
│
├─ Regional Cups (Monthly)
│  ├─ Region-specific tournaments
│  ├─ Broadcast on regional schedule
│  └─ 8-16 club participation
│
└─ Community Tournaments (Daily)
   ├─ Any club can host tournaments
   ├─ Option to make "public broadcast"
   ├─ Appears in official schedule
   └─ Professional commentary available

Official Caster Interface:

┌─────────────────────────────────┐
│ OFFICIAL BROADCAST SETUP        │
├─────────────────────────────────┤
│ Tournament: Club Championship    │
│ Match: Apex vs United (Semi 1)  │
│                                 │
│ [Camera Control Panel]           │
│ ├─ Select camera angle          │
│ ├─ Lock-on to player            │
│ ├─ Zoom controls                │
│ └─ Instant replay (5-sec)       │
│                                 │
│ [Statistics & Overlays]         │
│ ├─ [Show Team Stats]            │
│ ├─ [Show Player Card]           │
│ ├─ [Show Heat Map]              │
│ ├─ [Show Formation]             │
│ └─ [Show xG Analysis]           │
│                                 │
│ [Commentary]                    │
│ ├─ [Mute/Unmute]               │
│ ├─ [Volume: ████░░░░░░]        │
│ └─ [Select Commentary Stream]   │
│                                 │
│ [Viewers: 45,234]               │
│ [Recording: ON] [Archive: ON]   │
│                                 │
│ [Start Broadcast] [Settings]    │
│                                 │
└─────────────────────────────────┘
```

---

## Implementation

### SpectatorController Class

```typescript
class SpectatorController {
  private activeMatches: Map<string, LiveMatch> = new Map();
  private spectatorStreams: Map<string, SpectatorStream> = new Map();
  private replayLibrary: Map<string, ReplayData> = new Map();
  private spectatorRewards: Map<string, SpectatorProfile> = new Map();
  
  // Discover live matches
  discoverLiveMatches(filters: {
    eloRange?: [number, number];
    region?: string;
    league?: string;
  }): LiveMatchSummary[] {
    return Array.from(this.activeMatches.values())
      .filter(match => {
        if (filters.eloRange) {
          const avgElo = (match.player1Elo + match.player2Elo) / 2;
          if (avgElo < filters.eloRange[0] || avgElo > filters.eloRange[1]) {
            return false;
          }
        }
        if (filters.region && match.region !== filters.region) {
          return false;
        }
        if (filters.league && match.league !== filters.league) {
          return false;
        }
        return true;
      })
      .map(match => ({
        matchId: match.id,
        player1: match.player1Name,
        player1Elo: match.player1Elo,
        player2: match.player2Name,
        player2Elo: match.player2Elo,
        elapsed: match.elapsedTime,
        total: match.totalTime,
        score: match.currentScore,
        spectators: match.spectatorCount,
      }));
  }
  
  // Join live spectating
  joinLiveSpectating(spectatorId: string, matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    // Create stream for spectator
    const stream: SpectatorStream = {
      spectatorId,
      matchId,
      cameraAngle: 'broadcast',
      zoomLevel: 1.0,
      showHeatmap: false,
      showPassMap: false,
      chatMode: 'global',
      joinedTime: new Date(),
      lastActivityTime: new Date(),
    };
    
    this.spectatorStreams.set(`${spectatorId}:${matchId}`, stream);
    match.spectatorCount++;
    
    // Award initial XP
    this.awardSpectatorXP(spectatorId, 5);
  }
  
  // Update spectator camera
  updateCamera(
    spectatorId: string,
    matchId: string,
    camera: string,
    zoom?: number
  ): void {
    const streamKey = `${spectatorId}:${matchId}`;
    const stream = this.spectatorStreams.get(streamKey);
    if (!stream) throw new Error('Spectator stream not found');
    
    stream.cameraAngle = camera;
    if (zoom !== undefined) {
      stream.zoomLevel = Math.max(0.5, Math.min(3.0, zoom));
    }
  }
  
  // Trigger instant replay
  instantReplay(
    spectatorId: string,
    matchId: string,
    durationSeconds: number = 5
  ): ReplayClip {
    const match = this.activeMatches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    const replayStart = Math.max(0, match.elapsedFrames - (60 * durationSeconds));
    
    return {
      matchId,
      startFrame: replayStart,
      endFrame: match.elapsedFrames,
      duration: durationSeconds,
      quality: '1080p60',
    };
  }
  
  // Access replay library
  getReplayLibrary(spectatorId: string): ReplayInfo[] {
    return Array.from(this.replayLibrary.values())
      .filter(replay => replay.isPublic || replay.watchedBy.includes(spectatorId))
      .map(replay => ({
        replayId: replay.id,
        player1: replay.player1Name,
        player2: replay.player2Name,
        result: replay.result,
        date: replay.dateCompleted,
        verified: replay.onChainProof !== null,
        duration: replay.duration,
      }));
  }
  
  // Watch replay with verification badge
  watchReplay(spectatorId: string, replayId: string): void {
    const replay = this.replayLibrary.get(replayId);
    if (!replay) throw new Error('Replay not found');
    
    // Check if verified (has on-chain proof)
    const verified = replay.onChainProof !== null;
    
    // Award spectator rewards
    this.awardSpectatorXP(spectatorId, 5);
    this.awardSpectatorCosmetics(spectatorId, 0.50);
    
    // Track watch history
    if (!replay.watchedBy.includes(spectatorId)) {
      replay.watchedBy.push(spectatorId);
    }
    
    // Check if spectator earns badge
    const profile = this.spectatorRewards.get(spectatorId);
    if (profile) {
      profile.replaysWatched++;
      this.updateSpectatorBadge(spectatorId);
    }
  }
  
  // File dispute on verified replay
  fileDispute(
    spectatorId: string,
    replayId: string,
    evidence: string,
    timestamp: number
  ): DisputeClaim {
    const replay = this.replayLibrary.get(replayId);
    if (!replay) throw new Error('Replay not found');
    if (!replay.onChainProof) {
      throw new Error('Can only dispute verified replays');
    }
    
    const claim: DisputeClaim = {
      claimId: this.generateClaimId(),
      replayId,
      filer: spectatorId,
      evidence,
      timestamp,
      status: 'pending',
      filed_at: new Date(),
      bountyAmount: 100,
    };
    
    // Start smart contract arbitration
    this.startArbitration(claim);
    
    return claim;
  }
  
  // Submit match prediction
  submitPrediction(
    spectatorId: string,
    matchId: string,
    prediction: 'player1' | 'draw' | 'player2' | string
  ): void {
    const match = this.activeMatches.get(matchId);
    if (!match) throw new Error('Match not found');
    
    if (match.isCompleted) {
      throw new Error('Cannot predict on completed match');
    }
    
    // Store prediction
    match.predictions.push({
      spectatorId,
      prediction,
      timestamp: new Date(),
    });
  }
  
  // Complete match and process predictions
  completeMatch(
    matchId: string,
    finalScore: [number, number]
  ): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;
    
    match.isCompleted = true;
    match.finalScore = finalScore;
    
    // Determine outcome
    const outcome = finalScore[0] > finalScore[1]
      ? 'player1'
      : finalScore[0] < finalScore[1]
        ? 'player2'
        : 'draw';
    
    // Process predictions
    match.predictions.forEach(pred => {
      if (pred.prediction === outcome) {
        // Correct outcome prediction
        this.awardSpectatorCosmetics(pred.spectatorId, 0.25);
      }
      
      // Check for exact score
      const scoreStr = `${finalScore[0]}-${finalScore[1]}`;
      if (pred.prediction === scoreStr) {
        // Exact score prediction
        this.awardSpectatorCosmetics(pred.spectatorId, 1.00);
      }
    });
    
    // Store as replay in library
    const replay = this.createReplayFromMatch(match);
    this.replayLibrary.set(replay.id, replay);
  }
  
  // Tournament casting setup
  setupTournamentCasting(
    casterId: string,
    tournamentId: string
  ): TournamentBroadcast {
    const broadcast: TournamentBroadcast = {
      casterId,
      tournamentId,
      isActive: true,
      viewers: 0,
      camera: 'broadcast',
      overlays: {
        stats: true,
        formation: true,
        heatmap: false,
        commentary: true,
      },
    };
    
    // Verify caster permissions (tournament mod)
    this.verifyTournamentModerator(casterId, tournamentId);
    
    return broadcast;
  }
  
  // Award spectator XP & rewards
  private awardSpectatorXP(spectatorId: string, xp: number): void {
    let profile = this.spectatorRewards.get(spectatorId);
    if (!profile) {
      profile = {
        spectatorId,
        totalXP: 0,
        cosmetics: 0,
        matchesWatched: 0,
        replaysWatched: 0,
        predictions: 0,
        predictions_correct: 0,
        badges: [],
      };
      this.spectatorRewards.set(spectatorId, profile);
    }
    
    profile.totalXP += xp;
    profile.matchesWatched++;
  }
  
  private awardSpectatorCosmetics(spectatorId: string, amount: number): void {
    let profile = this.spectatorRewards.get(spectatorId);
    if (!profile) {
      profile = {
        spectatorId,
        totalXP: 0,
        cosmetics: 0,
        matchesWatched: 0,
        replaysWatched: 0,
        predictions: 0,
        predictions_correct: 0,
        badges: [],
      };
      this.spectatorRewards.set(spectatorId, profile);
    }
    
    profile.cosmetics += amount;
  }
  
  private updateSpectatorBadge(spectatorId: string): void {
    const profile = this.spectatorRewards.get(spectatorId);
    if (!profile) return;
    
    if (profile.replaysWatched === 10 && !profile.badges.includes('bronze')) {
      profile.badges.push('bronze');
    }
    if (profile.replaysWatched === 50 && !profile.badges.includes('silver')) {
      profile.badges.push('silver');
    }
    if (profile.replaysWatched === 100 && !profile.badges.includes('gold')) {
      profile.badges.push('gold');
    }
    if (profile.replaysWatched === 250 && !profile.badges.includes('diamond')) {
      profile.badges.push('diamond');
    }
    if (profile.replaysWatched === 500 && !profile.badges.includes('master')) {
      profile.badges.push('master');
    }
  }
}
```

---

## Spectator Mode Summary

✅ **Live Match Spectating**: Real-time viewing (~500ms latency), multi-quality streams, unlimited viewers  
✅ **Delayed Verified Spectating**: Watch replays with on-chain proof (Base chain), download for local verification  
✅ **Tournament Casting**: Professional broadcast UI, director controls, multiple camera angles, stats overlays  
✅ **Camera Systems**: 5+ presets (Broadcast, Player POV, Aerial, Tactical Board, GK View) + custom control  
✅ **Spectator Rewards**: Battle pass XP (+5 per match), cosmetics ($0.25-$1.00 per prediction), achievement badges  
✅ **Community Engagement**: Team/global chat, match predictions (correct outcome +$0.25, exact score +$1.00)  
✅ **Broadcasting Integration**: Twitch/YouTube streaming ($0.10 per 100 viewers), affiliate revenue, streamer cosmetics  
✅ **Retention & Monetization**: Spectators earn cosmetics (free engagement), streamers earn revenue (ecosystem growth)  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Community Engagement**: ✅ Professional Spectator & Streaming Ecosystem
