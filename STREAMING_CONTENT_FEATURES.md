# 🎮 Phase 7: Streaming & Content System - Complete Feature Guide

## Overview

Phase 7 introduces a comprehensive **Streaming & Content Creation Platform** to Bass Ball, enabling live broadcasting, match replays, highlight generation, and global video delivery. This is the 15th core system, bringing production-ready video infrastructure to the platform.

**Key Statistics:**
- **3 Core Libraries**: 1,550+ lines of TypeScript
- **React Integration**: 3 custom hooks with full state management
- **5 Global CDN Endpoints**: Latency-optimized video delivery
- **Auto-Highlight Generation**: AI-driven clip creation from events
- **Real-time Analytics**: Live viewer and engagement tracking

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Streaming Integration System](#streaming-integration-system)
3. [Replay & Highlights Engine](#replay--highlights-engine)
4. [CDN & Video Delivery Service](#cdn--video-delivery-service)
5. [React Hooks Integration](#react-hooks-integration)
6. [Implementation Guide](#implementation-guide)
7. [API Reference](#api-reference)
8. [Examples & Recipes](#examples--recipes)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                  Bass Ball Streaming Platform                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │   Streaming      │  │   Replay &       │  │   CDN      │ │
│  │  Integration     │  │   Highlights     │  │  Service   │ │
│  │  (Twitch/YT)     │  │   Engine         │  │ (5 regions)│ │
│  └──────────────────┘  └──────────────────┘  └────────────┘ │
│        │                      │                      │       │
│        └──────────────────────┴──────────────────────┘       │
│                        │                                      │
│        ┌───────────────────────────────────┐                 │
│        │  React Hooks Integration Layer    │                 │
│        ├───────────────────────────────────┤                 │
│        │ • useStreaming()                  │                 │
│        │ • useReplays()                    │                 │
│        │ • useCDN()                        │                 │
│        │ • useStreamingContent()           │                 │
│        └───────────────────────────────────┘                 │
│                        │                                      │
│        ┌───────────────────────────────────┐                 │
│        │   UI Components & Demo Page       │                 │
│        │   /streaming-demo                 │                 │
│        └───────────────────────────────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Live Streaming**: Twitch/YouTube accounts → Stream events → Analytics
2. **Replay System**: Frame/event capture → Auto-highlight generation → CDN delivery
3. **CDN Service**: Video upload → Regional optimization → Bandwidth tracking → Cost analysis

---

## Streaming Integration System

### Purpose
Complete live streaming platform supporting Twitch and YouTube with real-time viewer management, chat moderation, and analytics collection.

### Core Types

```typescript
interface StreamAccount {
  id: string;
  platform: 'twitch' | 'youtube' | 'custom';
  channelId: string;
  channelName: string;
  displayName: string;
  oauthToken: string;
  refreshToken?: string;
  avatar?: string;
  verified: boolean;
  followers: number;
  subscribers: number;
  createdAt: number;
}

interface LiveStream {
  id: string;
  accountId: string;
  title: string;
  description: string;
  status: 'planning' | 'live' | 'ended' | 'archived';
  thumbnailUrl?: string;
  viewers: number;
  resolution: '720p' | '1080p' | '1440p' | '4k';
  fps: 30 | 60;
  bitrate: number; // kbps
  startedAt: number;
  endedAt?: number;
  createdAt: number;
  chatMessages: StreamChat[];
  events: StreamEvent[];
}

interface StreamChat {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
  emotes: string[];
  badges: string[];
  highlighted: boolean;
  isPinned: boolean;
  userLevel: 'viewer' | 'moderator' | 'subscriber' | 'broadcaster';
}

interface StreamEvent {
  type: 'follow' | 'subscribe' | 'donate' | 'raid' | 'cheer';
  userId: string;
  username: string;
  data: Record<string, any>;
  timestamp: number;
}

interface StreamAnalytics {
  viewers: number;
  peakViewers: number;
  avgViewDuration: number;
  totalWatchTime: number;
  chatActivity: number;
  follows: number;
  subs: number;
  donations: number;
}
```

### Key Methods

#### `connectAccount(userId, platform, token, channelData)`
Connects a Twitch or YouTube account with OAuth authentication.

```typescript
const account = streamingService.connectAccount(
  'user_123',
  'twitch',
  'oauth_token',
  {
    channelId: 'ch_123',
    channelName: 'streamer_name',
    displayName: 'My Channel',
    avatar: 'url'
  }
);
```

#### `startStream(userId, accountId, streamData)`
Initiates a live stream broadcast.

```typescript
const stream = streamingService.startStream(
  'user_123',
  'account_456',
  {
    title: 'Championship Match',
    description: 'Live gameplay',
    resolution: '1080p',
    fps: 60,
    bitrate: 6000
  }
);
```

#### `updateStreamViewers(streamId, viewers)`
Updates real-time viewer count (called every few seconds).

```typescript
streamingService.updateStreamViewers(stream.id, 1250);
```

#### `sendChatMessage(streamId, message)`
Posts message to stream chat with moderation.

```typescript
streamingService.sendChatMessage(stream.id, {
  id: 'msg_123',
  userId: 'user_123',
  username: 'player_name',
  content: 'Great play!',
  timestamp: Date.now(),
  userLevel: 'viewer'
});
```

#### `addEvent(streamId, event)`
Records stream events (follows, subs, donations, raids).

```typescript
streamingService.addEvent(stream.id, {
  type: 'subscribe',
  userId: 'user_456',
  username: 'new_subscriber',
  data: { tier: 1 }
});
```

#### `getAnalytics(streamId)`
Retrieves real-time stream analytics.

```typescript
const analytics = streamingService.getAnalytics(stream.id);
console.log(analytics.peakViewers); // Current peak viewer count
```

#### `banUser(streamId, userId)`
Moderates chat by banning users.

```typescript
streamingService.banUser(stream.id, 'user_spam');
```

---

## Replay & Highlights Engine

### Purpose
Records match events into replayable frames, auto-generates highlights based on gameplay moments, and creates shareable clip formats (MP4, WebM, GIF).

### Core Types

```typescript
interface Replay {
  id: string;
  userId: string;
  title: string;
  description?: string;
  frames: ReplayFrame[];
  events: ReplayEvent[];
  duration: number; // seconds
  quality: '720p' | '1080p' | '1440p' | '4k';
  views: number;
  likes: number;
  shares: number;
  createdAt: number;
  analytics: ReplayAnalytics;
}

interface ReplayFrame {
  frameNumber: number;
  timestamp: number;
  type: 'kickoff' | 'play' | 'goal' | 'pause' | 'end';
  data: Record<string, any>; // Game state snapshot
}

interface ReplayEvent {
  type: 'goal' | 'tackle' | 'pass' | 'shot' | 'foul' | 'injury' | 'substitution' | 'formation_change';
  player?: string;
  team?: string;
  timestamp: number;
  data?: Record<string, any>;
}

interface Highlight {
  id: string;
  replayId: string;
  userId: string;
  type: 'goal' | 'save' | 'tackle' | 'skill_move' | 'epic_moment' | 'fail';
  startTime: number;
  endTime: number;
  autoGenerated: boolean;
  title: string;
  likes: number;
  comments: HighlightComment[];
  views: number;
  createdAt: number;
}

interface HighlightComment {
  id: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface Clip {
  id: string;
  highlightId: string;
  userId: string;
  title: string;
  format: 'mp4' | 'webm' | 'gif';
  downloadUrl: string;
  shareUrl: string;
  duration: number;
  downloads: number;
  shares: number;
  expiresAt?: number; // Optional expiration
  createdAt: number;
}

interface ReplayAnalytics {
  views: number;
  uniqueViewers: number;
  completionRate: number; // percentage
  avgWatchTime: number; // seconds
  devices: Record<string, number>; // device breakdown
  retention: number[]; // retention at 25%, 50%, 75%, 100%
  peakConcurrentViewers: number;
}
```

### Key Methods

#### `createReplay(userId, replayData)`
Creates a new replay session.

```typescript
const replay = replayEngine.createReplay('user_123', {
  title: 'Championship Final',
  description: 'Full match replay',
  duration: 1800,
  quality: '1080p60'
});
```

#### `addFrame(replayId, frame)`
Records a frame snapshot during gameplay.

```typescript
replayEngine.addFrame(replay.id, {
  frameNumber: 1,
  timestamp: Date.now(),
  type: 'play',
  data: {
    ballPosition: { x: 50, y: 40 },
    playerPositions: [...],
    score: { team1: 2, team2: 1 }
  }
});
```

#### `addEvent(replayId, event)`
Records in-game events (goals, tackles, etc.).

```typescript
replayEngine.addEvent(replay.id, {
  type: 'goal',
  player: 'Player Name',
  team: 'Team A',
  timestamp: Date.now(),
  data: { xG: 0.85 }
});
```

#### `autoGenerateHighlights(replayId, userId)`
AI-driven highlight generation based on events.

```typescript
const highlights = replayEngine.autoGenerateHighlights(
  replay.id,
  'user_123'
);
// Auto-creates highlights for: goals, saves, key tackles, epic moments
```

**Auto-Highlight Algorithm:**
- **Goals**: 100-frame window around goal event
- **Saves**: Critical defensive moments
- **Tackles**: High-intensity player interactions
- **Epic Moments**: Rare/skilled plays (dribbles, long shots, bicycle kicks)
- **Fails**: Humorous miss moments

#### `createClip(userId, clipData)`
Converts highlight to shareable clip formats.

```typescript
const clip = replayEngine.createClip('user_123', {
  highlightId: highlight.id,
  format: 'mp4',
  startTime: 0,
  endTime: 30,
  title: 'Epic Goal',
  expiresIn: 604800 // 7 days
});
```

#### `startPlayback(replayId, userId)`
Initiates replay playback session with full controls.

```typescript
const session = replayEngine.startPlayback(replay.id, 'user_123');
// Returns: PlaybackSession with speed, volume, subtitle controls
```

#### `updatePlaybackPosition(sessionId, frame, time)`
Updates playback progress (for analytics tracking).

```typescript
replayEngine.updatePlaybackPosition(session.id, 150, 5000);
```

#### `likeHighlight(highlightId)`
Records user engagement with highlight.

```typescript
replayEngine.likeHighlight(highlight.id);
```

---

## CDN & Video Delivery Service

### Purpose
Global video distribution with automatic regional optimization, bandwidth tracking, and cost analysis.

### Core Types

```typescript
interface CDNEndpoint {
  id: string;
  name: string; // e.g., "US East"
  region: 'us-east' | 'us-west' | 'eu-west' | 'ap-south' | 'sa-east';
  latency: number; // ms
  bandwidth: number; // percentage utilization
  uptime: number; // percentage
}

interface VideoAsset {
  id: string;
  userId: string;
  filename: string;
  uploadUrl: string;
  playUrl: string;
  size: number; // bytes
  mimeType: string;
  duration: number; // seconds
  quality: 'mobile' | 'standard' | 'hd' | '4k';
  bitrate: number; // kbps
  fps: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  createdAt: number;
}

interface BandwidthUsage {
  date: string;
  bytesUsed: number;
  cost: number; // $0.085 per GB
  endpoint: string;
}

interface CDNQuality {
  tier: 'mobile' | 'standard' | 'hd' | '4k';
  resolution: string; // "480p", "720p", etc.
  bitrate: number; // kbps
  fps: number;
  fileSize: number; // estimated bytes per minute
}
```

### Key Methods

#### `selectOptimalEndpoint(region, latencyThreshold)`
Chooses best CDN endpoint based on region and performance.

```typescript
const endpoint = cdnService.selectOptimalEndpoint('us-west', 50);
// Returns: CDNEndpoint with best latency < 50ms
```

**Regional Selection Logic:**
- Prioritizes same region
- Falls back to nearby regions if primary overloaded
- Balances latency vs. bandwidth availability
- Automatic failover to backup endpoints

#### `createAsset(userId, assetData)`
Initializes video asset for upload.

```typescript
const asset = cdnService.createAsset('user_123', {
  filename: 'match_highlights.mp4',
  size: 524288000, // 500MB
  mimeType: 'video/mp4',
  duration: 120
});
```

#### `completeUpload(assetId)`
Finalizes upload and triggers processing.

```typescript
cdnService.completeUpload(asset.id);
// Asset status: uploading → processing → ready
```

#### `getPlayUrl(assetId, quality)`
Generates CDN play URL with quality selection.

```typescript
const playUrl = cdnService.getPlayUrl(asset.id, 'hd');
// Returns: https://cdn-endpoint.com/videos/asset_id.m3u8?quality=hd
```

#### `recordDownload(userId, bytes)`
Tracks bandwidth usage for cost analysis.

```typescript
cdnService.recordDownload('user_123', 524288000); // 500MB
```

#### `getBandwidthUsage(userId, days)`
Retrieves 30-day bandwidth history with costs.

```typescript
const usage = cdnService.getBandwidthUsage('user_123', 30);
// Returns: Array of daily BandwidthUsage records
```

#### `getStats()`
Returns platform-wide CDN statistics.

```typescript
const stats = cdnService.getStats();
console.log(stats.estimatedCost); // Monthly cost
console.log(stats.totalBandwidth); // Total bytes served
```

#### `calculateFileSize(bitrate, fps, duration)`
Estimates file size before upload.

```typescript
const size = cdnService.calculateFileSize(5000, 60, 120);
// Returns: ~375MB for 1080p60 2-minute video
```

---

## React Hooks Integration

### useStreaming Hook

Manages live streaming state and controls.

```typescript
const {
  accounts,           // Connected StreamAccount[]
  liveStreams,        // All LiveStream[]
  currentStream,      // Currently active LiveStream | null
  analytics,          // Real-time StreamAnalytics | null
  connectAccount,     // (platform, token, data) => StreamAccount
  startStream,        // (accountId, streamData) => LiveStream
  endStream,          // () => void
  updateViewers,      // (count) => void
  sendChatMessage,    // (content) => void
  addEvent            // (type, username) => void
} = useStreaming(userId);
```

**Usage Example:**
```typescript
function StreamingControl() {
  const { currentStream, startStream, endStream } = useStreaming('user_123');
  
  return (
    <div>
      {currentStream ? (
        <>
          <h2>{currentStream.title}</h2>
          <p>Viewers: {currentStream.viewers}</p>
          <button onClick={endStream}>End Stream</button>
        </>
      ) : (
        <button onClick={() => startStream(accountId, {
          title: 'Live Now',
          resolution: '1080p',
          fps: 60
        })}>
          Start Streaming
        </button>
      )}
    </div>
  );
}
```

### useReplays Hook

Manages replay, highlight, and clip state.

```typescript
const {
  replays,                    // Replay[]
  highlights,                 // Highlight[]
  clips,                      // Clip[]
  currentReplay,              // Replay | null
  playbackSession,            // PlaybackSession | null
  createReplay,               // (data) => Replay
  createHighlight,            // (data) => Highlight
  createClip,                 // (data) => Clip
  startPlayback,              // (replayId) => PlaybackSession
  updatePlayback,             // (frame, time) => void
  likeHighlight,              // (id) => void
  downloadClip,               // (id) => void
  autoGenerateHighlights      // (replayId) => Highlight[]
} = useReplays(userId);
```

**Usage Example:**
```typescript
function ReplayViewer() {
  const {
    replays,
    currentReplay,
    playbackSession,
    startPlayback,
    updatePlayback
  } = useReplays('user_123');
  
  const handlePlayReplay = (replayId) => {
    const session = startPlayback(replayId);
    // Begin playback with controls
  };
  
  return (
    <div>
      {replays.map(r => (
        <button key={r.id} onClick={() => handlePlayReplay(r.id)}>
          {r.title}
        </button>
      ))}
      {currentReplay && (
        <div>
          <p>Now Playing: {currentReplay.title}</p>
          <ProgressBar onChange={(frame, time) => 
            updatePlayback(frame, time)
          } />
        </div>
      )}
    </div>
  );
}
```

### useCDN Hook

Manages video uploads and delivery.

```typescript
const {
  assets,              // VideoAsset[]
  bandwidthStats,      // BandwidthUsage[]
  cdnStats,            // CDN statistics
  uploadAsset,         // (data) => VideoAsset
  completeUpload,      // (assetId) => void
  getPlayUrl,          // (assetId) => string
  recordDownload,      // (assetId, bytes) => void
  deleteAsset          // (assetId) => void
} = useCDN(userId);
```

**Usage Example:**
```typescript
function VideoUpload() {
  const { uploadAsset, completeUpload, assets } = useCDN('user_123');
  
  const handleUpload = async (file) => {
    const asset = uploadAsset({
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      duration: 120
    });
    
    // Upload file to asset.uploadUrl
    await uploadFile(file, asset.uploadUrl);
    
    // Mark complete
    completeUpload(asset.id);
  };
  
  return (
    <div>
      <input type="file" onChange={(e) => 
        handleUpload(e.target.files[0])
      } />
      <p>Uploaded: {assets.filter(a => a.status === 'ready').length}</p>
    </div>
  );
}
```

### useStreamingContent Hook

Combined hook for accessing all streaming systems.

```typescript
const {
  streaming,   // useStreaming result
  replays,     // useReplays result
  cdn          // useCDN result
} = useStreamingContent(userId);
```

---

## Implementation Guide

### Step 1: Import Services

```typescript
import { streamingService } from '@/lib/streamingIntegration';
import { replayEngine } from '@/lib/replayEngine';
import { cdnService } from '@/services/cdn-service';
```

### Step 2: Use React Hooks

```typescript
import { useStreaming, useReplays, useCDN } from '@/hooks/useStreaming';

export function StreamingDashboard() {
  const userId = useUser().id;
  const streaming = useStreaming(userId);
  const replays = useReplays(userId);
  const cdn = useCDN(userId);
  
  // Access state and methods
}
```

### Step 3: Build UI with Components

```typescript
<div>
  {/* Streaming Tab */}
  {streaming.currentStream && (
    <div>
      <h2>{streaming.currentStream.title}</h2>
      <p>Viewers: {streaming.currentStream.viewers}</p>
    </div>
  )}
  
  {/* Replays Tab */}
  {replays.highlights.map(h => (
    <HighlightCard key={h.id} highlight={h} />
  ))}
  
  {/* CDN Stats Tab */}
  <BandwidthChart data={cdn.bandwidthStats} />
</div>
```

---

## API Reference

### Streaming Integration API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connectAccount` | `userId, platform, token, data` | `StreamAccount` | Connect Twitch/YouTube account |
| `startStream` | `userId, accountId, streamData` | `LiveStream` | Start live stream |
| `endStream` | `streamId` | `LiveStream \| null` | End current stream |
| `addViewer` | `streamId, viewerData` | `StreamViewer` | Add viewer to stream |
| `removeViewer` | `streamId, viewerId` | `boolean` | Remove viewer |
| `sendChatMessage` | `streamId, message` | `StreamChat` | Post chat message |
| `banUser` | `streamId, userId` | `boolean` | Ban user from chat |
| `unbanUser` | `streamId, userId` | `boolean` | Unban user |
| `addEvent` | `streamId, event` | `StreamEvent` | Record stream event |
| `getAnalytics` | `streamId` | `StreamAnalytics \| null` | Get stream analytics |
| `updateSettings` | `streamId, settings` | `void` | Update stream settings |

### Replay Engine API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `createReplay` | `userId, replayData` | `Replay` | Create replay session |
| `addFrame` | `replayId, frame` | `void` | Add frame to replay |
| `addEvent` | `replayId, event` | `void` | Add event to replay |
| `createHighlight` | `userId, data` | `Highlight` | Create manual highlight |
| `autoGenerateHighlights` | `replayId, userId` | `Highlight[]` | Auto-generate highlights |
| `createClip` | `userId, clipData` | `Clip` | Create shareable clip |
| `startPlayback` | `replayId, userId` | `PlaybackSession` | Start replay playback |
| `updatePlaybackPosition` | `sessionId, frame, time` | `void` | Update playback progress |
| `likeHighlight` | `highlightId` | `void` | Like highlight |
| `addComment` | `highlightId, comment` | `void` | Comment on highlight |

### CDN Service API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `selectOptimalEndpoint` | `region, latency` | `CDNEndpoint` | Get best endpoint |
| `createAsset` | `userId, assetData` | `VideoAsset` | Create upload asset |
| `completeUpload` | `assetId` | `void` | Finish upload process |
| `getPlayUrl` | `assetId, quality` | `string` | Get playback URL |
| `recordDownload` | `userId, bytes` | `void` | Track bandwidth |
| `getBandwidthUsage` | `userId, days` | `BandwidthUsage[]` | Get usage history |
| `getStats` | `none` | `object` | Get CDN statistics |
| `deleteAsset` | `assetId` | `boolean` | Remove video asset |

---

## Examples & Recipes

### Recipe 1: Complete Live Stream Workflow

```typescript
async function completeLiveStreamWorkflow() {
  const userId = 'user_123';
  
  // 1. Connect account
  const account = streamingService.connectAccount(
    userId,
    'twitch',
    'oauth_token',
    { channelId: 'ch_123', channelName: 'my_channel', displayName: 'My Channel' }
  );
  
  // 2. Start stream
  const stream = streamingService.startStream(userId, account.id, {
    title: 'Championship Match',
    description: 'Live gameplay',
    resolution: '1080p',
    fps: 60,
    bitrate: 6000
  });
  
  // 3. Simulate viewer updates (every 5 seconds)
  setInterval(() => {
    const viewers = Math.floor(Math.random() * 1000) + 100;
    streamingService.updateStreamViewers(stream.id, viewers);
  }, 5000);
  
  // 4. Record stream events
  streamingService.addEvent(stream.id, {
    type: 'subscribe',
    userId: 'fan_123',
    username: 'new_subscriber',
    data: { tier: 1 }
  });
  
  // 5. Get analytics after 1 hour
  setTimeout(() => {
    const analytics = streamingService.getAnalytics(stream.id);
    console.log('Peak viewers:', analytics.peakViewers);
    console.log('Avg watch time:', analytics.avgViewDuration);
  }, 3600000);
  
  // 6. End stream
  streamingService.endStream(stream.id);
}
```

### Recipe 2: Auto-Highlight Generation Workflow

```typescript
async function autoHighlightWorkflow() {
  const userId = 'user_123';
  
  // 1. Create replay session
  const replay = replayEngine.createReplay(userId, {
    title: 'Match vs Team B',
    duration: 1800
  });
  
  // 2. Record frames and events
  for (let i = 0; i < 1800; i += 5) {
    replayEngine.addFrame(replay.id, {
      frameNumber: i,
      timestamp: Date.now() + (i * 1000),
      type: 'play',
      data: { /* game state */ }
    });
  }
  
  // Record goal event
  replayEngine.addEvent(replay.id, {
    type: 'goal',
    player: 'John Doe',
    team: 'Team A',
    timestamp: Date.now() + 600000
  });
  
  // 3. Auto-generate highlights
  const highlights = replayEngine.autoGenerateHighlights(replay.id, userId);
  
  // 4. Create clips from highlights
  for (const highlight of highlights) {
    const clip = replayEngine.createClip(userId, {
      highlightId: highlight.id,
      format: 'mp4',
      startTime: highlight.startTime,
      endTime: highlight.endTime,
      title: `${highlight.type} Clip`,
      expiresIn: 604800 // 7 days
    });
    console.log('Created clip:', clip.downloadUrl);
  }
}
```

### Recipe 3: Video Upload & Delivery

```typescript
async function videoUploadWorkflow() {
  const userId = 'user_123';
  const file = /* File object */;
  
  // 1. Create asset
  const asset = cdnService.createAsset(userId, {
    filename: file.name,
    size: file.size,
    mimeType: file.type,
    duration: 120
  });
  
  // 2. Upload to CDN
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(asset.uploadUrl, {
    method: 'POST',
    body: formData
  });
  
  // 3. Complete upload
  cdnService.completeUpload(asset.id);
  
  // 4. Get optimal endpoint for viewer's region
  const endpoint = cdnService.selectOptimalEndpoint('us-west', 50);
  
  // 5. Get playback URL
  const playUrl = cdnService.getPlayUrl(asset.id, 'hd');
  
  // 6. Track downloads
  cdnService.recordDownload(userId, file.size);
}
```

### Recipe 4: Real-time Streaming Dashboard

```typescript
function StreamingDashboard() {
  const { currentStream, analytics, updateViewers } = useStreaming('user_123');
  const { highlights, autoGenerateHighlights } = useReplays('user_123');
  const { bandwidthStats } = useCDN('user_123');
  
  useEffect(() => {
    // Simulate viewer updates
    const interval = setInterval(() => {
      const viewers = Math.floor(Math.random() * 5000) + 100;
      updateViewers(viewers);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [updateViewers]);
  
  return (
    <div className="dashboard">
      <h1>Live Stream Stats</h1>
      
      {currentStream && (
        <div className="stream-info">
          <h2>{currentStream.title}</h2>
          <p>Viewers: {currentStream.viewers.toLocaleString()}</p>
          <p>Peak: {analytics?.peakViewers.toLocaleString()}</p>
          <p>Avg Watch Time: {Math.round(analytics?.avgViewDuration / 60)}m</p>
        </div>
      )}
      
      <div className="highlights">
        <h3>Auto-Generated Highlights ({highlights.length})</h3>
        {highlights.map(h => (
          <div key={h.id} className="highlight-card">
            <span>{h.type}</span>
            <span>❤️ {h.likes}</span>
          </div>
        ))}
      </div>
      
      <BandwidthChart data={bandwidthStats} />
    </div>
  );
}
```

---

## Performance Optimization

### 1. Viewer Updates Batching
Instead of updating individually:
```typescript
// ❌ Too frequent
for (let i = 0; i < 1000; i++) {
  streamingService.updateStreamViewers(stream.id, i);
}

// ✅ Batch updates
setTimeout(() => {
  streamingService.updateStreamViewers(stream.id, 1000);
}, 5000);
```

### 2. Replay Frame Optimization
```typescript
// ❌ Store every frame
for (let i = 0; i < 1800 * 60; i++) { // 1800 seconds @ 60fps = 108,000 frames
  replayEngine.addFrame(...);
}

// ✅ Store key frames only
for (let i = 0; i < 1800; i += 5) { // Every 5 seconds = 360 frames
  replayEngine.addFrame(...);
}
```

### 3. CDN Quality Selection
```typescript
// Adaptive bitrate based on bandwidth
const connection = navigator.connection;
let quality = 'standard';

if (connection.downlink > 10) {
  quality = '4k';
} else if (connection.downlink > 5) {
  quality = 'hd';
} else if (connection.downlink > 2) {
  quality = 'standard';
} else {
  quality = 'mobile';
}

const playUrl = cdnService.getPlayUrl(asset.id, quality);
```

### 4. Chat Message Debouncing
```typescript
// ❌ Send every keystroke
onInput={(e) => streamingService.sendChatMessage(e.target.value)}

// ✅ Debounce input
const debouncedSend = useCallback(
  debounce((message) => streamingService.sendChatMessage(message), 300),
  []
);
```

---

## Troubleshooting

### Issue: Stream not connecting to Twitch
**Solution:**
1. Verify OAuth token is valid: `account.oauthToken`
2. Check channel ID: `account.channelId`
3. Ensure Twitch API is accessible
4. Verify network connectivity

```typescript
// Debug
console.log('Account:', account);
console.log('Token valid:', !!account.oauthToken);
console.log('Channel:', account.channelName);
```

### Issue: Auto-highlights not generating
**Solution:**
1. Ensure events are recorded: `replay.events.length > 0`
2. Check event types are valid (goal, tackle, etc.)
3. Verify replay has minimum duration

```typescript
// Debug
const replay = replayEngine.getReplay(replayId);
console.log('Events:', replay.events);
console.log('Replay duration:', replay.duration);
if (replay.events.length === 0) {
  console.error('No events recorded!');
}
```

### Issue: CDN upload slow or failing
**Solution:**
1. Use optimal endpoint: `selectOptimalEndpoint(region)`
2. Check file size doesn't exceed limits
3. Verify upload URL is accessible
4. Check network bandwidth

```typescript
// Debug
const endpoint = cdnService.selectOptimalEndpoint('us-west');
console.log('Selected endpoint:', endpoint.name);
console.log('Latency:', endpoint.latency, 'ms');
console.log('Bandwidth available:', endpoint.bandwidth, '%');

// Estimate upload time
const asset = { size: 524288000 }; // 500MB
const mbps = 50; // Your internet speed
const seconds = (asset.size / 1000000 / 8) / (mbps / 8);
console.log('Est. upload time:', seconds, 'seconds');
```

### Issue: Replays consuming too much storage
**Solution:**
1. Delete old replays: `replayEngine.deleteReplay(id)`
2. Archive to CDN instead of localStorage
3. Compress replay data
4. Set expiration dates on clips

```typescript
// Cleanup old replays
const replays = replayEngine.getReplays(userId);
const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
replays.forEach(r => {
  if (r.createdAt < oneWeekAgo) {
    replayEngine.deleteReplay(r.id);
  }
});
```

---

## Summary

Phase 7 (Streaming & Content System) provides production-ready video infrastructure for Bass Ball with:

- ✅ Live streaming to Twitch/YouTube
- ✅ Real-time viewer management and chat
- ✅ Match replay creation with frame-accurate controls
- ✅ AI-driven auto-highlight generation
- ✅ Shareable clip creation (MP4/WebM/GIF)
- ✅ Global CDN with 5 endpoints
- ✅ Bandwidth optimization and cost tracking
- ✅ Real-time analytics and retention tracking
- ✅ React hooks for easy integration
- ✅ Full TypeScript support

**Total Implementation:**
- 1,550+ lines of core libraries
- 300+ lines of React hooks
- 500+ lines of UI components
- Production-ready features ready for integration with game engine
