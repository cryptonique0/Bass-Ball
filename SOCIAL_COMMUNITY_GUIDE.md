# Social & Community System Documentation

Complete guide to implementing clans, club wars, spectating, and in-app chat for multiplayer engagement.

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Components](#core-components)
3. [Manager Systems](#manager-systems)
4. [React Components](#react-components)
5. [Integration Guide](#integration-guide)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Real-World Examples](#real-world-examples)

---

## System Overview

The Social & Community system consists of four interconnected manager systems and corresponding React UI components:

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│          Social & Community System                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │  Backend Managers (localStorage-based)       │  │
│  ├──────────────────────────────────────────────┤  │
│  │  • ClanManager       → Club/clan management  │  │
│  │  • ClubWarsManager   → Tournament system     │  │
│  │  • ChatManager       → Real-time messaging   │  │
│  │  • SpectatorManager  → Live match viewing    │  │
│  └──────────────────────────────────────────────┘  │
│                    ↓ Integration                    │
│  ┌──────────────────────────────────────────────┐  │
│  │  React UI Components                         │  │
│  ├──────────────────────────────────────────────┤  │
│  │  • ClansUI          → Club management UI     │  │
│  │  • ClubWarsUI       → Tournament UI          │  │
│  │  • ChatComponent    → Messaging UI           │  │
│  │  • SpectatorMode    → Match viewing UI       │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Key Features

- **Clans/Clubs**: Player-formed organizations with hierarchical roles, treasury, and statistics
- **Club Wars**: Competitive tournaments with tier-based matchmaking and rating system
- **In-App Chat**: Real-time messaging with channels, direct messages, reactions, and moderation
- **Spectator Mode**: Live match viewing with event recording and replay system

---

## Core Components

### 1. Clan System

**File**: `lib/clanSystem.ts`

#### Data Structures

```typescript
interface Club {
  clubId: string;
  name: string;
  description: string;
  ownerId: string;
  members: Map<string, ClubMember>; // userId -> ClubMember
  treasury: ClubTreasury;
  status: 'active' | 'disbanded';
  level: number;
  experience: number;
  joinPolicy: 'open' | 'approval' | 'private';
  stats: {
    totalWins: number;
    totalLosses: number;
    totalDraws: number;
  };
  createdAt: number;
}

interface ClubMember {
  userId: string;
  name: string;
  role: 'owner' | 'leader' | 'officer' | 'member';
  joinedAt: number;
  contributions: number;
  stats: {
    wins: number;
    losses: number;
    draws: number;
  };
}

interface ClubTreasury {
  softBalance: number;
  hardBalance: number;
  lockedBalance: number;
  history: TransactionRecord[];
}

interface ClubInvite {
  inviteId: string;
  clubId: string;
  invitedPlayerId: string;
  invitedByPlayerId: string;
  status: 'pending' | 'accepted' | 'declined';
  message: string;
  expiresAt: number;
  createdAt: number;
}
```

#### Key Methods

```typescript
// Create a new club
const club = clanManager.createClub({
  name: 'Dragon Slayers',
  description: 'Elite competitive team',
  ownerId: 'player_1',
  joinPolicy: 'approval'
});

// Invite a player
clanManager.invitePlayer(
  'club_001',
  'player_2',
  'player_1',
  'Join us!'
);

// Accept invite
clanManager.acceptInvite('invite_001', 'player_2');

// Manage members
clanManager.updateMemberRole('club_001', 'player_2', 'officer', 'player_1');
clanManager.removeMember('club_001', 'player_3', 'player_1');

// Treasury management
clanManager.depositToClubbTreasury('club_001', 1000, 50); // soft, hard currency
clanManager.withdrawFromTreasury('club_001', 500, 25, 'player_1');

// Query methods
const club = clanManager.getClub('club_001');
const playerClub = clanManager.getPlayerClub('player_1');
const allClubs = clanManager.getAllClubs(); // Top 100 by wins
const members = clanManager.getClubMembers('club_001');
```

#### Storage

```javascript
localStorage['clan_system'] = {
  clubs: Map<clubId, Club>,
  playerClubs: Map<userId, clubId>,
  invites: Map<inviteId, ClubInvite>,
  playerInvites: Map<userId, inviteId[]>
}
```

---

### 2. Club Wars System

**File**: `lib/clubWarsSystem.ts`

#### Data Structures

```typescript
interface ClubWar {
  warId: string;
  season: number;
  status: 'registration' | 'active' | 'completed' | 'cancelled';
  tier: WarTier; // 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
  format: 'single_elimination' | 'round_robin' | 'best_of_three';
  registeredClubs: string[]; // clubIds
  matches: WarMatch[];
  standings: WarStanding[];
  prizePool: number;
  registrationDeadline: number;
  startDate: number;
  endDate: number;
}

interface WarMatch {
  matchId: string;
  homeClubId: string;
  awayClubId: string;
  homeTeam: string[]; // playerIds
  awayTeam: string[]; // playerIds
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'active' | 'completed';
  scheduledFor: number;
  completedAt: number;
}

interface WarMetrics {
  clubId: string;
  clubName: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  tier: WarTier;
  rating: number; // 800 - 2500+
  consecutiveWins: number;
  lastMatchAt: number;
}

type WarTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

// Tier Thresholds
const TIER_THRESHOLDS = {
  bronze: { min: 800, max: 1199 },
  silver: { min: 1200, max: 1499 },
  gold: { min: 1500, max: 1999 },
  platinum: { min: 2000, max: 2499 },
  diamond: { min: 2500, max: Infinity }
};
```

#### Rating System

- **Win**: +25 rating
- **Loss**: -15 rating (minimum 800)
- **Draw**: +10 rating
- **Tier auto-updates** based on current rating
- **Consecutive win bonus**: +5 rating per consecutive win

#### Key Methods

```typescript
// Create a new war
const war = clubWarsManager.createWar({
  season: 1,
  tier: 'gold',
  format: 'single_elimination',
  prizePool: 10000
});

// Register a club
clubWarsManager.registerClubForWar('war_001', 'club_001');

// Schedule a match
clubWarsManager.scheduleMatch(
  'war_001',
  'club_001',
  'club_002',
  ['player_1', 'player_2'],
  ['player_3', 'player_4']
);

// Record match result
clubWarsManager.recordMatchResult(
  'match_001',
  'club_001', // winner
  3,
  1
);

// Get metrics
const metrics = clubWarsManager.getClubMetrics('club_001');

// Leaderboards
const global = clubWarsManager.getGlobalLeaderboard(); // Top 20
const season = clubWarsManager.getWarLeaderboard('war_001');

// Season management
clubWarsManager.advanceSeason();
```

#### Storage

```javascript
localStorage['club_wars_system'] = {
  wars: Map<warId, ClubWar>,
  clubMetrics: Map<clubId, WarMetrics>,
  matchResults: Map<matchId, MatchResult>,
  seasonData: { currentSeason: number }
}
```

---

### 3. Chat System

**File**: `lib/chatSystem.ts`

#### Data Structures

```typescript
interface ChatMessage {
  messageId: string;
  channelId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'emoji' | 'sticker' | 'system';
  reactions: Map<string, string[]>; // emoji -> [userIds]
  isPinned: boolean;
  isDeleted: boolean;
  edited: boolean;
  editedAt?: number;
  timestamp: number;
}

interface ChatChannel {
  channelId: string;
  name: string;
  description: string;
  type: 'direct' | 'clan' | 'group' | 'public';
  createdBy: string;
  members: Map<string, ChannelMember>; // userId -> ChannelMember
  messages: ChatMessage[];
  createdAt: number;
  isArchived: boolean;
}

interface ChannelMember {
  role: 'admin' | 'moderator' | 'member';
  isMuted: boolean;
  mutedUntil?: number;
  joinedAt: number;
}

interface DirectMessage {
  dmId: string;
  participant1: string; // userId
  participant2: string; // userId
  createdAt: number;
  messages: ChatMessage[];
  isBlocked: boolean;
  blockedBy?: string; // userId who blocked
}
```

#### Key Methods

```typescript
// Channel Management
const channel = chatManager.createChannel('general', 'public', 'player_1');
chatManager.addMemberToChannel('channel_001', 'player_2', 'member');
const channels = chatManager.getUserChannels('player_1');
const publicChannels = chatManager.getPublicChannels();

// Messaging
chatManager.sendMessage('channel_001', 'player_1', 'Player One', 'Hello team!');
chatManager.editMessage('message_001', 'channel_001', 'Updated message');
chatManager.deleteMessage('message_001', 'channel_001', 'player_1');

// Reactions
chatManager.addReaction('message_001', 'channel_001', '👍', 'player_2');
chatManager.removeReaction('message_001', 'channel_001', '👍', 'player_2');

// Message Management
chatManager.pinMessage('message_001', 'channel_001', 'player_1'); // Admin only
const messages = chatManager.getChannelMessages('channel_001', 50);

// Moderation
chatManager.muteUser('channel_001', 'player_3', 'player_1', 3600); // 1 hour
chatManager.unmuteUser('channel_001', 'player_3', 'player_1');
chatManager.blockUser('player_1', 'player_4');
chatManager.unblockUser('player_1', 'player_4');

// Direct Messages
chatManager.startDirectMessage('player_1', 'player_2');
chatManager.sendDirectMessage('dm_001', 'player_1', 'Hey!');
const dms = chatManager.getUserDirectMessages('player_1');
```

#### Storage

```javascript
localStorage['chat_system'] = {
  channels: Map<channelId, ChatChannel>,
  directMessages: Map<dmId, DirectMessage>,
  userChannels: Map<userId, channelId[]>,
  userDMs: Map<userId, dmId[]>,
  mutedUsers: Map<userId, MuteRecord[]>,
  blockedUsers: Map<userId, string[]>
}
```

---

### 4. Spectator System

**File**: `lib/spectatorSystem.ts`

#### Data Structures

```typescript
interface SpectatorSession {
  sessionId: string;
  matchId: string;
  spectatorId: string;
  spectatorName: string;
  joinedAt: number;
  isGuest: boolean;
  streamQuality: 'low' | 'medium' | 'high';
  isStreaming: boolean;
}

interface LiveMatchEvent {
  eventId: string;
  matchId: string;
  type: 'goal' | 'card' | 'substitution' | 'injury' | 'foul' | 'possession' | 'other';
  timestamp: number;
  team: 'home' | 'away';
  playerId: string;
  playerName: string;
  description: string;
  details?: Record<string, any>;
}

interface MatchReplay {
  replayId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  duration: number; // milliseconds
  events: LiveMatchEvent[];
  isPublic: boolean;
  createdBy: string;
  views: number;
  createdAt: number;
}
```

#### Key Methods

```typescript
// Spectating
const session = spectatorManager.joinSpectator(
  'match_001',
  'player_1',
  'Player One'
);

spectatorManager.leaveSpectator('match_001', session.sessionId);

// Event Recording
spectatorManager.recordEvent('match_001', {
  type: 'goal',
  timestamp: Date.now(),
  team: 'home',
  playerId: 'player_2',
  playerName: 'Player Two',
  description: 'Goal scored!'
});

// Live Events
const events = spectatorManager.getLiveEvents('match_001'); // Last 50
const count = spectatorManager.getSpectatorCount('match_001');
const spectators = spectatorManager.getActiveSpectators('match_001');

// Replays
const replay = spectatorManager.createReplay('match_001', true); // public
const savedReplay = spectatorManager.getReplay('replay_001');
const replays = spectatorManager.getMatchReplays('match_001');
const popular = spectatorManager.getPopularReplays(); // Top 10
spectatorManager.viewReplay('replay_001'); // Increment view count
```

#### Storage

```javascript
localStorage['spectator_system'] = {
  activeSessions: Map<sessionId, SpectatorSession>,
  matchSessions: Map<matchId, sessionId[]>,
  liveEvents: Map<matchId, LiveMatchEvent[]>,
  replays: Map<replayId, MatchReplay>,
  matchReplays: Map<matchId, replayId[]>
}
```

---

## React Components

### 1. ClansUI Component

**File**: `components/ClansUI.tsx`

#### Features

- **Browse Clubs**: Search and filter all available clubs
- **Create Club**: Form to create new club with join policy selection
- **Join Club**: Request to join with optional message
- **My Club**: Manage owned club with members, treasury, invites
- **Invites Tab**: Accept/decline pending invitations
- **Real-time Updates**: 5-second polling for live data

#### Sub-Components

```typescript
// Main component
<ClansUI />

// Sub-components
<ClubCard />          // Individual club display
<MyClubView />        // Club management interface
<InviteCard />        // Pending invite card
<CreateClubModal />   // Create club form
<JoinClubModal />     // Join club form
```

#### Usage

```typescript
import { ClansUI } from '@/components/ClansUI';

export default function SocialPage() {
  return <ClansUI />;
}
```

#### Props & State

```typescript
// Internal state management
const [activeTab, setActiveTab] = useState<'browse' | 'my-clan' | 'invites'>('browse');
const [clubs, setClubs] = useState<Club[]>([]);
const [myClub, setMyClub] = useState<Club | null>(null);
const [invites, setInvites] = useState<ClubInvite[]>([]);
```

### 2. ChatComponent

**File**: `components/ChatComponent.tsx`

#### Features

- **Channel Chat**: Send messages in public/clan/group channels
- **Direct Messages**: P2P messaging with individual players
- **Reactions**: Add emoji reactions to messages
- **Message Management**: Edit, delete, pin messages
- **Moderation**: Mute, block, and manage users
- **Real-time Updates**: 3-second polling for live messages
- **Keyboard Shortcuts**: Enter to send, Shift+Enter for newline
- **Auto-scroll**: Automatically scrolls to latest message

#### Sub-Components

```typescript
// Main component
<ChatComponent />

// Sub-components
<MessageBubble />  // Individual message display
```

#### Usage

```typescript
import { ChatComponent } from '@/components/ChatComponent';

export default function ChatPage() {
  return <ChatComponent />;
}
```

#### Features Implementation

```typescript
// Select channel
const [activeChannel, setActiveChannel] = useState('general');

// Send message
const handleSendMessage = () => {
  chatMgr.sendMessage(activeChannel, userId, userName, messageText);
};

// Add reaction
const handleAddReaction = (emoji: string) => {
  chatMgr.addReaction(messageId, activeChannel, emoji, userId);
};

// Moderation
const handleMuteUser = (targetUserId: string) => {
  chatMgr.muteUser(activeChannel, targetUserId, userId);
};
```

### 3. ClubWarsUI Component

**File**: `components/ClubWarsUI.tsx`

#### Features

- **Active Wars**: Browse available tournaments and register
- **Leaderboard**: Top 20 clubs ranked by rating
- **My Wars**: Clubs registered wars and match history
- **Tier System**: Bronze, Silver, Gold, Platinum, Diamond
- **Match Display**: View scheduled and completed matches
- **Rating Tracking**: Real-time rating updates and tier promotions
- **Registration Modal**: Register club for available wars

#### Sub-Components

```typescript
// Main component
<ClubWarsUI />

// Sub-components
<ActiveWarsTab />      // Browse available wars
<LeaderboardTab />     // Global leaderboard
<MyWarsTab />          // User's war registrations
<WarCard />            // Individual war display
<LeaderboardRow />     // Leaderboard entry
<MyWarCard />          // User's war details
<MatchRow />           // Match display
<StatBox />            // Stat display
<RegistrationModal />  // Registration form
```

#### Usage

```typescript
import { ClubWarsUI } from '@/components/ClubWarsUI';

export default function WarsPage() {
  return <ClubWarsUI />;
}
```

### 4. SpectatorMode Component

**File**: `components/SpectatorMode.tsx`

#### Features

- **Live Match Viewing**: Watch live matches with spectator count
- **Event Timeline**: Real-time event recording (goals, cards, etc.)
- **Match Info**: Display match details and statistics
- **Player Controls**: Play/pause, volume, fullscreen
- **Featured Matches**: Browse and join popular matches
- **Replay System**: Create and view match replays
- **Event Icons**: Visual indicators for different event types

#### Sub-Components

```typescript
// Main component
<SpectatorMode />

// Sub-components
<EventTimeline />      // Event display
<FeaturedMatch />      // Featured match card
```

#### Usage

```typescript
import { SpectatorMode } from '@/components/SpectatorMode';

export default function SpectatePage() {
  return <SpectatorMode />;
}
```

---

## Integration Guide

### Setup Instructions

#### 1. Copy Manager Systems

```bash
# Copy all manager files to your lib directory
cp lib/clanSystem.ts lib/clubWarsSystem.ts lib/spectatorSystem.ts lib/chatSystem.ts <your-project>/lib/
```

#### 2. Copy React Components

```bash
# Copy all component files to your components directory
cp components/ClansUI.tsx components/ChatComponent.tsx components/ClubWarsUI.tsx components/SpectatorMode.tsx <your-project>/components/
```

#### 3. Import in Your App

```typescript
// app/page.tsx or your main app file
import { ClansUI } from '@/components/ClansUI';
import { ChatComponent } from '@/components/ChatComponent';
import { ClubWarsUI } from '@/components/ClubWarsUI';
import { SpectatorMode } from '@/components/SpectatorMode';

export default function SocialHub() {
  return (
    <div>
      <ClansUI />
      <ChatComponent />
      <ClubWarsUI />
      <SpectatorMode />
    </div>
  );
}
```

### Integration with Economy System

```typescript
import { EconomyManager } from '@/lib/economySystem';

const economyMgr = EconomyManager.getInstance();
const clanMgr = ClanManager.getInstance();

// Deposit to clan treasury
const player = economyMgr.getPlayer('player_1');
clanMgr.depositToClubbTreasury('club_001', player.softCurrency, player.hardCurrency);

// Withdraw from treasury
const club = clanMgr.getClub('club_001');
if (club.treasury.softBalance >= 500) {
  economyMgr.addCurrency('player_1', 500, 0); // Add to player
  clanMgr.withdrawFromTreasury('club_001', 500, 0, 'player_1');
}
```

### Data Flow Example

```
User Action → React Component → Manager System → localStorage → Auto-persist
     ↓                 ↓               ↓               ↓
Create Club      ClansUI Button  ClanManager.      JSON stringify
                                 createClub()      to localStorage

     ↑                 ↑               ↑               ↑
User Sees        Real-time       Read from       Parse from
Updated UI       Polling (5s)    localStorage    JSON storage
```

---

## API Reference

### ClanManager API

```typescript
class ClanManager {
  // Create & Management
  createClub(options): Club
  disbandClub(clubId: string, ownerId: string): boolean
  
  // Members
  invitePlayer(clubId, playerId, inviterId, message): ClubInvite
  acceptInvite(inviteId: string, playerId: string): boolean
  declineInvite(inviteId: string, playerId: string): boolean
  removeMember(clubId, memberId, removerRole): boolean
  updateMemberRole(clubId, memberId, newRole, ownerId): boolean
  
  // Treasury
  depositToClubbTreasury(clubId, softAmount, hardAmount): void
  withdrawFromTreasury(clubId, softAmount, hardAmount, ownerId): boolean
  
  // Queries
  getClub(clubId: string): Club | null
  getPlayerClub(playerId: string): Club | null
  getClubMembers(clubId: string): ClubMember[]
  getAllClubs(limit?: number): Club[]
  searchClubs(query: string): Club[]
  getGlobalStats(): ClubStatistics
  getPlayerInvites(playerId: string): ClubInvite[]
}
```

### ClubWarsManager API

```typescript
class ClubWarsManager {
  // War Management
  createWar(options): ClubWar
  getCurrentSeasonWars(): ClubWar[]
  
  // Registration
  registerClubForWar(warId, clubId): boolean
  
  // Matches
  scheduleMatch(warId, homeId, awayId, homeTeam, awayTeam): WarMatch
  recordMatchResult(matchId, winnerId, homeScore, awayScore): void
  
  // Queries
  getClubMetrics(clubId: string): WarMetrics
  getGlobalLeaderboard(limit?: number): WarMetrics[]
  getWarLeaderboard(warId: string): WarMetrics[]
  
  // Season
  advanceSeason(): void
}
```

### ChatManager API

```typescript
class ChatManager {
  // Channels
  createChannel(name, type, creatorId): ChatChannel
  addMemberToChannel(channelId, playerId, role): void
  getUserChannels(playerId: string): ChatChannel[]
  getPublicChannels(): ChatChannel[]
  
  // Messaging
  sendMessage(channelId, senderId, senderName, content): ChatMessage
  editMessage(messageId, channelId, newContent): void
  deleteMessage(messageId, channelId, deleterId): void
  getChannelMessages(channelId, limit?): ChatMessage[]
  
  // Reactions
  addReaction(messageId, channelId, emoji, playerId): void
  removeReaction(messageId, channelId, emoji, playerId): void
  
  // Management
  pinMessage(messageId, channelId, playerId): void
  muteUser(channelId, userId, modId, duration?): void
  unmuteUser(channelId, userId, modId): void
  blockUser(playerId, blockedId): void
  unblockUser(playerId, blockedId): void
  
  // Direct Messages
  startDirectMessage(player1Id, player2Id): DirectMessage
  sendDirectMessage(dmId, senderId, content): ChatMessage
  getUserDirectMessages(playerId): DirectMessage[]
}
```

### SpectatorManager API

```typescript
class SpectatorManager {
  // Sessions
  joinSpectator(matchId, spectatorId, spectatorName): SpectatorSession
  leaveSpectator(matchId, sessionId): void
  
  // Events
  recordEvent(matchId, event): void
  getLiveEvents(matchId, limit?): LiveMatchEvent[]
  getSpectatorCount(matchId: string): number
  getActiveSpectators(matchId: string): SpectatorSession[]
  
  // Replays
  createReplay(matchId, isPublic): MatchReplay
  getReplay(replayId: string): MatchReplay | null
  getMatchReplays(matchId: string): MatchReplay[]
  getPopularReplays(limit?: number): MatchReplay[]
  viewReplay(replayId: string): void
}
```

---

## Best Practices

### 1. User Roles & Permissions

```typescript
// Always check roles before sensitive operations
function canRemoveMember(club: Club, removerRole: string, targetRole: string): boolean {
  const roleHierarchy = { owner: 4, leader: 3, officer: 2, member: 1 };
  return roleHierarchy[removerRole] > roleHierarchy[targetRole];
}

// Example: Only officers+ can remove members
const club = clanMgr.getClub('club_001');
const member = club.members.get('player_1');
if (canRemoveMember(club, userRole, member.role)) {
  clanMgr.removeMember('club_001', 'player_1', userId);
}
```

### 2. Real-time Updates

```typescript
// Component polling pattern
useEffect(() => {
  const interval = setInterval(() => {
    // Refresh data from managers
    const updatedClub = clanMgr.getClub(clubId);
    setClub(updatedClub);
  }, 5000); // 5 second interval

  return () => clearInterval(interval);
}, [clubId]);
```

### 3. Message Persistence

```typescript
// Always use timestamps for ordering
const messages = chatMgr.getChannelMessages(channelId, 100);
const sorted = messages.sort((a, b) => a.timestamp - b.timestamp);

// Handle deleted messages gracefully
messages.forEach(msg => {
  if (msg.isDeleted) {
    displayPlaceholder('[Message deleted]');
  }
});
```

### 4. War Rating Management

```typescript
// Monitor tier promotions
const metrics = warMgr.getClubMetrics('club_001');
const prevTier = getPreviousTier();

if (metrics.tier !== prevTier) {
  notifyUser(`Promoted to ${metrics.tier} tier!`);
}
```

### 5. Error Handling

```typescript
// Handle mute/unmute safely
try {
  chatMgr.muteUser(channelId, userId, adminId, 3600);
} catch (error) {
  console.error('Mute failed:', error);
  showErrorNotification('Unable to mute user');
}

// Validate before operations
if (!clanMgr.getPlayerClub(userId)) {
  showErrorNotification('You must be in a club');
  return;
}
```

---

## Real-World Examples

### Example 1: Club Formation Flow

```typescript
// 1. Create club
const club = clanMgr.createClub({
  name: 'Dragon Slayers',
  description: 'Elite PvP team',
  ownerId: 'player_1',
  joinPolicy: 'approval'
});

// 2. Invite players
clanMgr.invitePlayer(club.clubId, 'player_2', 'player_1', 'Join our team!');
clanMgr.invitePlayer(club.clubId, 'player_3', 'player_1', 'Join our team!');

// 3. Players accept invites
clanMgr.acceptInvite(invite2.inviteId, 'player_2');
clanMgr.acceptInvite(invite3.inviteId, 'player_3');

// 4. Owner promotes player to officer
clanMgr.updateMemberRole(club.clubId, 'player_2', 'officer', 'player_1');

// 5. Create chat channel for club
const channel = chatMgr.createChannel(
  'dragon-slayers-general',
  'clan',
  'player_1'
);
chatMgr.addMemberToChannel(channel.channelId, 'player_2', 'member');
chatMgr.addMemberToChannel(channel.channelId, 'player_3', 'member');
```

### Example 2: War Tournament Flow

```typescript
// 1. Create war
const war = warMgr.createWar({
  season: 5,
  tier: 'gold',
  format: 'single_elimination',
  prizePool: 50000
});

// 2. Clubs register
warMgr.registerClubForWar(war.warId, 'club_001');
warMgr.registerClubForWar(war.warId, 'club_002');
warMgr.registerClubForWar(war.warId, 'club_003');

// 3. Schedule match
const match = warMgr.scheduleMatch(
  war.warId,
  'club_001',
  'club_002',
  ['player_1', 'player_2'],
  ['player_3', 'player_4']
);

// 4. Record result (club_001 wins 2-1)
warMgr.recordMatchResult(match.matchId, 'club_001', 2, 1);

// 5. Check leaderboard
const leaderboard = warMgr.getGlobalLeaderboard();
console.log('Top clubs:', leaderboard.slice(0, 5));
```

### Example 3: Live Spectating Flow

```typescript
// 1. Player joins as spectator
const session = spectatorMgr.joinSpectator(
  'match_001',
  'spectator_1',
  'Spectator'
);

// 2. Start recording events
spectatorMgr.recordEvent('match_001', {
  type: 'goal',
  timestamp: Date.now(),
  team: 'home',
  playerId: 'player_1',
  playerName: 'Player One',
  description: 'Amazing goal!'
});

// 3. Get live events (3-second polling)
setInterval(() => {
  const events = spectatorMgr.getLiveEvents('match_001');
  const count = spectatorMgr.getSpectatorCount('match_001');
  updateUI(events, count);
}, 3000);

// 4. Create replay when match ends
const replay = spectatorMgr.createReplay('match_001', true); // public

// 5. View later
const savedReplay = spectatorMgr.getReplay(replay.replayId);
const events = savedReplay.events;
```

### Example 4: In-Game Chat Flow

```typescript
// 1. User joins clan channel
const channel = chatMgr.getPublicChannels()
  .find(c => c.name === 'general');
chatMgr.addMemberToChannel(channel.channelId, 'player_1', 'member');

// 2. Send message
chatMgr.sendMessage(
  channel.channelId,
  'player_1',
  'Player One',
  'Hey team, lets group up!'
);

// 3. React to message
chatMgr.addReaction(messageId, channel.channelId, '👍', 'player_2');
chatMgr.addReaction(messageId, channel.channelId, '👍', 'player_3');

// 4. Start direct message
const dm = chatMgr.startDirectMessage('player_1', 'player_2');
chatMgr.sendDirectMessage(dm.dmId, 'player_1', 'Want to 1v1?');

// 5. Mute spammer
chatMgr.muteUser(channel.channelId, 'player_4', 'player_1', 1800); // 30 mins
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Data not persisting | Check localStorage quota; clear old data |
| Chat messages not updating | Verify polling interval; check network |
| Club wars not showing | Check registration status; verify tier matching |
| Spectator lag | Reduce event polling frequency or video quality |

### Debug Mode

```typescript
// Enable debug logging
window.DEBUG_SOCIAL = true;

// In managers, add logging
if (window.DEBUG_SOCIAL) {
  console.log('[ClanManager]', action, data);
}
```

---

## Performance Considerations

### Optimization Tips

1. **Pagination**: Limit message/club queries
2. **Caching**: Store frequently accessed data
3. **Debouncing**: Debounce search queries
4. **Lazy Loading**: Load components on demand
5. **Polling Intervals**: Adjust based on network quality

```typescript
// Optimize polling
const POLL_INTERVALS = {
  messages: 3000,     // 3 seconds for messages
  clubs: 5000,        // 5 seconds for clubs
  wars: 10000,        // 10 seconds for wars
  spectating: 1000    // 1 second for live events
};
```

---

## Future Enhancements

- Voice chat integration
- Rich message formatting (embeds, links)
- Message search across channels
- Customizable club perks and leveling
- Tournament brackets visualization
- AI-powered match recommendations
- Social trading post for items/rewards
- Guild warfare alliances
- Streaming platform integration

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: Community Team
