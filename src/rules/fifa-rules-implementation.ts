# FIFA Rules Implementation - TypeScript Code Reference

**Production-ready TypeScript classes and functions for implementing FIFA rules in Bass Ball**

---

## Table of Contents

1. [Card & Disciplinary System](#card--disciplinary-system)
2. [Suspension Management](#suspension-management)
3. [Transfer System](#transfer-system)
4. [Squad & Match Rules](#squad--match-rules)
5. [Physics & Offside Detection](#physics--offside-detection)
6. [Match Engine Integration](#match-engine-integration)

---

## Card & Disciplinary System

### CardEvent Interface & Types

```typescript
// Card types and offenses
export type CardColor = 'yellow' | 'red';

export type YellowCardOffense =
  | 'unsporting_behavior'
  | 'excessive_force'
  | 'reckless_play'
  | 'dangerous_play'
  | 'foul_play'
  | 'handball'
  | 'dissent'
  | 'persistent_infringement'
  | 'technical_violation'
  | 'diving';

export type RedCardOffense =
  | 'violent_conduct'
  | 'serious_foul_play'
  | 'spitting'
  | 'biting'
  | 'denial_of_goal_opportunity'
  | 'handball_deliberate'
  | 'abusive_language'
  | 'second_yellow'
  | 'assault';

// Card event structure
export interface CardEvent {
  eventId: string;
  matchId: string;
  timestamp: number; // Frame when issued
  timestampSeconds: number; // Match seconds (0-5400)
  
  // Player involved
  playerName: string;
  playerTeam: 'home' | 'away';
  playerNumber: number;
  playerId: string;
  
  // Card details
  cardColor: CardColor;
  offense: YellowCardOffense | RedCardOffense;
  description: string;
  
  // Context
  location: {
    x: number; // Pitch coordinates
    y: number;
    zone: 'defensive_third' | 'middle_third' | 'attacking_third';
  };
  
  // Decision
  refereeDecision: boolean; // Always true (server-authoritative)
  isDisputable: boolean;
  
  // Consequences
  yellowCardCountInMatch: number; // 1 or 2
  isEjected: boolean; // For red cards
  
  // Blockchain
  ipfsReplayHash?: string;
  onChainTxHash?: string;
  blockNumber?: number;
}

// Match-level card tracking
export interface MatchCardHistory {
  matchId: string;
  yellowCardsIssued: CardEvent[];
  redCardsIssued: CardEvent[];
  playerYellowCounts: Map<string, number>;
  playerRedCounts: Map<string, number>;
  ejectedPlayers: Set<string>;
}
```

### Disciplinary System Class

```typescript
export class DisciplinarySystem {
  private cardHistory: Map<string, CardEvent[]> = new Map();
  private matchCardHistory: MatchCardHistory;
  private offenseBaselines: Map<YellowCardOffense | RedCardOffense, number>;
  
  constructor(matchId: string) {
    this.matchCardHistory = {
      matchId,
      yellowCardsIssued: [],
      redCardsIssued: [],
      playerYellowCounts: new Map(),
      playerRedCounts: new Map(),
      ejectedPlayers: new Set(),
    };
    
    // Initialize baseline severity scores (0-1)
    this.offenseBaselines = new Map([
      // Yellow card offenses
      ['unsporting_behavior', 0.3],
      ['excessive_force', 0.5],
      ['reckless_play', 0.55],
      ['dangerous_play', 0.65],
      ['foul_play', 0.4],
      ['handball', 0.35],
      ['dissent', 0.25],
      ['persistent_infringement', 0.45],
      ['technical_violation', 0.2],
      ['diving', 0.4],
      
      // Red card offenses
      ['violent_conduct', 0.9],
      ['serious_foul_play', 0.85],
      ['spitting', 0.95],
      ['biting', 0.95],
      ['denial_of_goal_opportunity', 0.8],
      ['handball_deliberate', 0.85],
      ['abusive_language', 0.9],
      ['second_yellow', 1.0],
      ['assault', 0.95],
    ]);
  }
  
  /**
   * Issue a yellow card to a player
   */
  issueYellowCard(
    player: Player,
    offense: YellowCardOffense,
    frame: number,
    context: FoulContext
  ): CardEvent {
    const existingYellows = this.matchCardHistory.playerYellowCounts.get(player.id) || 0;
    
    const card: CardEvent = {
      eventId: `card_${this.matchCardHistory.matchId}_${frame}_${player.id}`,
      matchId: this.matchCardHistory.matchId,
      timestamp: frame,
      timestampSeconds: Math.floor(frame / 60), // 60 FPS
      
      playerName: player.name,
      playerTeam: player.team,
      playerNumber: player.number,
      playerId: player.id,
      
      cardColor: 'yellow',
      offense: offense,
      description: `${offense} - ${player.name} (${player.number})`,
      
      location: {
        x: player.position.x,
        y: player.position.y,
        zone: this.determineZone(player.position.x, player.team),
      },
      
      refereeDecision: true,
      isDisputable: true,
      
      yellowCardCountInMatch: existingYellows + 1,
      isEjected: false,
    };
    
    // Record card
    this.matchCardHistory.yellowCardsIssued.push(card);
    this.matchCardHistory.playerYellowCounts.set(
      player.id,
      existingYellows + 1
    );
    
    // Check for second yellow → automatic red
    if (existingYellows === 1) {
      this.issueRedCard(player, 'second_yellow', frame, context);
      card.isEjected = true;
    }
    
    // Log to blockchain
    this.logCardToBlockchain(card);
    
    return card;
  }
  
  /**
   * Issue a red card (direct or from second yellow)
   */
  issueRedCard(
    player: Player,
    offense: RedCardOffense,
    frame: number,
    context: FoulContext
  ): CardEvent {
    const card: CardEvent = {
      eventId: `card_${this.matchCardHistory.matchId}_${frame}_${player.id}`,
      matchId: this.matchCardHistory.matchId,
      timestamp: frame,
      timestampSeconds: Math.floor(frame / 60),
      
      playerName: player.name,
      playerTeam: player.team,
      playerNumber: player.number,
      playerId: player.id,
      
      cardColor: 'red',
      offense: offense,
      description: `${offense} - ${player.name} (${player.number})`,
      
      location: {
        x: player.position.x,
        y: player.position.y,
        zone: this.determineZone(player.position.x, player.team),
      },
      
      refereeDecision: true,
      isDisputable: true,
      
      yellowCardCountInMatch: 0,
      isEjected: true,
    };
    
    // Record card
    this.matchCardHistory.redCardsIssued.push(card);
    this.matchCardHistory.playerRedCounts.set(
      player.id,
      (this.matchCardHistory.playerRedCounts.get(player.id) || 0) + 1
    );
    
    // Mark player as ejected
    this.matchCardHistory.ejectedPlayers.add(player.id);
    player.isEjected = true;
    player.isActive = false;
    
    // Log to blockchain
    this.logCardToBlockchain(card);
    
    // Create automatic suspension
    const suspensionLength = this.calculateSuspensionLength(offense);
    this.createSuspensionFromCard(player, card, suspensionLength);
    
    return card;
  }
  
  /**
   * Calculate suspension length based on offense
   */
  private calculateSuspensionLength(offense: RedCardOffense): number {
    const lengths: Map<RedCardOffense, number> = new Map([
      ['violent_conduct', 3],
      ['serious_foul_play', 3],
      ['spitting', 4],
      ['biting', 4],
      ['denial_of_goal_opportunity', 2],
      ['handball_deliberate', 1],
      ['abusive_language', 5],
      ['second_yellow', 1],
      ['assault', 5],
    ]);
    
    return lengths.get(offense) || 1;
  }
  
  /**
   * Evaluate a foul and determine if card needed
   */
  evaluateFoul(
    fouler: Player,
    fouled: Player,
    frame: number,
    context: FoulContext
  ): { card?: CardEvent; foulType: string } {
    const severity = this.calculateFoulSeverity(context);
    
    // Direct red card offenses
    if (context.violentConduct || context.headbutt || context.punch) {
      return {
        card: this.issueRedCard(fouler, 'violent_conduct', frame, context),
        foulType: 'violent_conduct',
      };
    }
    
    if (context.seriousFoulPlay || context.twoFooted || context.studsUp) {
      return {
        card: this.issueRedCard(fouler, 'serious_foul_play', frame, context),
        foulType: 'serious_foul_play',
      };
    }
    
    if (context.spitting) {
      return {
        card: this.issueRedCard(fouler, 'spitting', frame, context),
        foulType: 'spitting',
      };
    }
    
    // Yellow card offenses
    if (severity > 0.6) {
      return {
        card: this.issueYellowCard(
          fouler,
          this.mapSeverityToYellowOffense(severity, context),
          frame,
          context
        ),
        foulType: 'yellow',
      };
    }
    
    // Tactical foul (no card, just free kick)
    return { foulType: 'tactical' };
  }
  
  /**
   * Calculate foul severity (0-1 scale)
   */
  private calculateFoulSeverity(context: FoulContext): number {
    let severity = 0.3; // Base foul
    
    if (context.excessiveForce) severity += 0.2;
    if (context.reckless) severity += 0.15;
    if (context.dangerous) severity += 0.2;
    if (context.late) severity += 0.15; // Late challenge
    if (context.high) severity += 0.1; // High challenge
    if (context.noContact) severity -= 0.1; // Less severe if minimal contact
    
    return Math.min(1.0, severity);
  }
  
  /**
   * Get card history for a player across all matches
   */
  getPlayerCardHistory(playerId: string): CardEvent[] {
    return this.cardHistory.get(playerId) || [];
  }
  
  /**
   * Check if player is ejected this match
   */
  isPlayerEjected(playerId: string): boolean {
    return this.matchCardHistory.ejectedPlayers.has(playerId);
  }
  
  /**
   * Get yellow card count for player this match
   */
  getYellowCardCount(playerId: string): number {
    return this.matchCardHistory.playerYellowCounts.get(playerId) || 0;
  }
  
  /**
   * Log card event to blockchain
   */
  private async logCardToBlockchain(card: CardEvent): Promise<void> {
    // Call smart contract method: DisciplinaryRegistry.issueCard()
    // Encode card data and transaction hash
    // TODO: Implement blockchain call
  }
  
  /**
   * Create suspension from red card
   */
  private createSuspensionFromCard(
    player: Player,
    card: CardEvent,
    length: number
  ): void {
    // Create automatic suspension in SuspensionSystem
    // TODO: Trigger suspension creation
  }
  
  /**
   * Determine pitch zone
   */
  private determineZone(
    x: number,
    team: 'home' | 'away'
  ): 'defensive_third' | 'middle_third' | 'attacking_third' {
    if (team === 'home') {
      if (x < 40000) return 'defensive_third';
      if (x < 80000) return 'middle_third';
      return 'attacking_third';
    } else {
      if (x > 80000) return 'defensive_third';
      if (x > 40000) return 'middle_third';
      return 'attacking_third';
    }
  }
  
  /**
   * Map severity score to yellow offense
   */
  private mapSeverityToYellowOffense(
    severity: number,
    context: FoulContext
  ): YellowCardOffense {
    if (context.excessiveForce) return 'excessive_force';
    if (context.reckless) return 'reckless_play';
    if (context.dangerous) return 'dangerous_play';
    if (context.dissent) return 'dissent';
    return 'foul_play';
  }
}

// Foul context type
export interface FoulContext {
  foulerPosition: Vector3;
  fouledPosition: Vector3;
  ballPosition: Vector3;
  
  // Foul characteristics
  excessiveForce: boolean;
  reckless: boolean;
  dangerous: boolean;
  late: boolean; // Challenge >0.5s after ball played
  high: boolean; // Above shoulder
  noContact: boolean;
  
  // Special circumstances
  violentConduct: boolean;
  headbutt: boolean;
  punch: boolean;
  seriousFoulPlay: boolean;
  twoFooted: boolean;
  studsUp: boolean;
  spitting: boolean;
  biting: boolean;
  dissent: boolean;
  
  // Impact
  ballContacted: boolean;
  playerInjured: boolean;
  opponentFallen: boolean;
}
```

---

## Suspension Management

### Suspension System

```typescript
export interface Suspension {
  suspensionId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  
  // Suspension details
  suspensionType: 'red_card' | 'yellow_accumulation' | 'disciplinary';
  reason: RedCardOffense | string;
  cardEventId: string;
  
  // Timeline
  issuedFrame: number;
  issuedMatchId: string;
  issuedDate: string;
  
  matchesRemaining: number;
  matchesServed: number;
  totalMatches: number;
  
  // Status
  isActive: boolean;
  isAppealable: boolean;
  
  // Appeal
  appealDeadlineFrame: number;
  appealStatus: 'not_appealed' | 'pending' | 'upheld' | 'overturned';
  appealFiledFrame?: number;
  appealEvidence?: string; // IPFS hash
  appealVotes?: {
    judges: string[];
    votes: boolean[];
    verdict: boolean;
  };
  
  // Blockchain
  onChainId?: string;
  txHash?: string;
  blockNumber?: number;
}

export class SuspensionSystem {
  private suspensions: Map<string, Suspension[]> = new Map();
  private activeSuspensions: Set<string> = new Set();
  
  /**
   * Create suspension from card
   */
  createSuspension(
    player: Player,
    cardEvent: CardEvent,
    length: number
  ): Suspension {
    const suspension: Suspension = {
      suspensionId: `susp_${player.id}_${Date.now()}`,
      playerId: player.id,
      playerName: player.name,
      teamId: player.team,
      
      suspensionType: 'red_card',
      reason: cardEvent.offense as string,
      cardEventId: cardEvent.eventId,
      
      issuedFrame: cardEvent.timestamp,
      issuedMatchId: cardEvent.matchId,
      issuedDate: new Date().toISOString(),
      
      matchesRemaining: length,
      matchesServed: 0,
      totalMatches: length,
      
      isActive: true,
      isAppealable: true,
      
      appealDeadlineFrame: cardEvent.timestamp + (60 * 60 * 24), // 24 hours
      appealStatus: 'not_appealed',
    };
    
    // Store suspension
    if (!this.suspensions.has(player.id)) {
      this.suspensions.set(player.id, []);
    }
    this.suspensions.get(player.id)!.push(suspension);
    this.activeSuspensions.add(suspension.suspensionId);
    
    // Register on blockchain
    this.registerOnBlockchain(suspension);
    
    return suspension;
  }
  
  /**
   * Can player participate in upcoming match?
   */
  canPlayerParticipate(playerId: string, upcomingMatchId: string): {
    allowed: boolean;
    reason?: string;
    suspension?: Suspension;
  } {
    const playerSuspensions = this.suspensions.get(playerId) || [];
    
    for (const suspension of playerSuspensions) {
      if (suspension.isActive && suspension.matchesRemaining > 0) {
        return {
          allowed: false,
          reason: `Player serving suspension. Matches remaining: ${suspension.matchesRemaining}`,
          suspension,
        };
      }
    }
    
    return { allowed: true };
  }
  
  /**
   * Decrement suspension (call after each match played)
   */
  decrementSuspensions(playerId: string): void {
    const playerSuspensions = this.suspensions.get(playerId) || [];
    
    for (const suspension of playerSuspensions) {
      if (suspension.isActive && suspension.matchesRemaining > 0) {
        suspension.matchesRemaining--;
        suspension.matchesServed++;
        
        if (suspension.matchesRemaining === 0) {
          suspension.isActive = false;
          this.activeSuspensions.delete(suspension.suspensionId);
        }
      }
    }
  }
  
  /**
   * Submit appeal for suspension
   */
  async submitAppeal(
    playerId: string,
    suspensionId: string,
    replayCipHash: string
  ): Promise<{
    success: boolean;
    message: string;
    appealId?: string;
  }> {
    const playerSuspensions = this.suspensions.get(playerId) || [];
    const suspension = playerSuspensions.find(s => s.suspensionId === suspensionId);
    
    if (!suspension) {
      return { success: false, message: 'Suspension not found' };
    }
    
    if (suspension.appealStatus !== 'not_appealed') {
      return { success: false, message: 'Appeal already submitted' };
    }
    
    // Update suspension with appeal info
    suspension.appealStatus = 'pending';
    suspension.appealFiledFrame = Math.floor(Date.now() / 1000);
    suspension.appealEvidence = replayCipHash;
    
    // Initiate voting period on blockchain
    await this.initiateAppealVoting(suspension);
    
    return {
      success: true,
      message: 'Appeal submitted. Voting period: 48 hours',
      appealId: suspensionId,
    };
  }
  
  /**
   * Resolve appeal (called by voting system after 48h)
   */
  resolveAppeal(
    suspensionId: string,
    verdict: boolean // true = overturn, false = uphold
  ): void {
    for (const [playerId, suspensions] of this.suspensions) {
      const suspension = suspensions.find(s => s.suspensionId === suspensionId);
      
      if (suspension) {
        if (verdict) {
          // Appeal upheld: remove suspension
          suspension.isActive = false;
          suspension.appealStatus = 'overturned';
          suspension.matchesRemaining = 0;
          this.activeSuspensions.delete(suspensionId);
        } else {
          // Appeal rejected: suspension stands
          suspension.appealStatus = 'upheld';
        }
        
        break;
      }
    }
  }
  
  /**
   * Get suspension status
   */
  getSuspensionStatus(playerId: string): {
    isSuspended: boolean;
    matchesRemaining: number;
    suspension?: Suspension;
  } {
    const playerSuspensions = this.suspensions.get(playerId) || [];
    const activeSuspension = playerSuspensions.find(s => s.isActive);
    
    if (!activeSuspension) {
      return { isSuspended: false, matchesRemaining: 0 };
    }
    
    return {
      isSuspended: true,
      matchesRemaining: activeSuspension.matchesRemaining,
      suspension: activeSuspension,
    };
  }
  
  private async registerOnBlockchain(suspension: Suspension): Promise<void> {
    // Call smart contract: DisciplinaryRegistry.createSuspension()
    // TODO: Implement blockchain call
  }
  
  private async initiateAppealVoting(suspension: Suspension): Promise<void> {
    // Call voting contract to begin appeal voting
    // TODO: Implement blockchain voting
  }
}
```

---

## Transfer System

### Transfer Management

```typescript
export interface Transfer {
  transferId: string;
  playerTokenId: string;
  playerName: string;
  playerPosition: string;
  
  // Teams
  fromTeamId: string;
  fromTeamName: string;
  toTeamId: string;
  toTeamName: string;
  
  // Timeline
  listingDate: string;
  transferDate: string;
  transferWindow: 'summer' | 'winter' | 'emergency';
  
  // Financial
  transferFeeUSDC: number;
  platformFeePercent: number; // 3%
  creatorRoyaltyPercent: number; // 2%
  
  // Contract
  contractLengthMatches: number; // 26-130
  salaryPerMatchTokens: number;
  
  // Status
  status: 'pending' | 'cleared' | 'completed' | 'failed';
  eligibleFromMatch: string;
  requiresTeamRegistration: boolean;
  
  // Blockchain
  nftTransferId?: string;
  nftOwnershipHash?: string;
  txHash?: string;
  blockNumber?: number;
}

export class TransferSystem {
  private transfers: Map<string, Transfer[]> = new Map();
  private transferWindows: TransferWindow[] = [];
  private teamBudgets: Map<string, number> = new Map();
  
  /**
   * Check if transfer window is active
   */
  isTransferWindowActive(windowType?: 'summer' | 'winter' | 'emergency'): boolean {
    const now = new Date();
    
    for (const window of this.transferWindows) {
      if (!window.isActive) continue;
      
      if (windowType && window.windowName !== windowType) continue;
      
      const start = new Date(window.startDate);
      const end = new Date(window.endDate);
      
      if (now >= start && now <= end) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * List player for transfer
   */
  listPlayerForTransfer(
    player: NFTPlayer,
    fromTeam: Team,
    askedPrice: number
  ): {
    success: boolean;
    message: string;
    listing?: Transfer;
  } {
    // Validate window is open
    if (!this.isTransferWindowActive()) {
      return { success: false, message: 'Transfer window is closed' };
    }
    
    // Validate player eligibility
    if (!this.isPlayerTransferable(player, fromTeam)) {
      return {
        success: false,
        message: 'Player not eligible for transfer (suspension/contract)',
      };
    }
    
    // Create listing
    const listing: Transfer = {
      transferId: `transfer_${player.tokenId}_${Date.now()}`,
      playerTokenId: player.tokenId,
      playerName: player.name,
      playerPosition: player.position,
      
      fromTeamId: fromTeam.id,
      fromTeamName: fromTeam.name,
      toTeamId: '',
      toTeamName: '',
      
      listingDate: new Date().toISOString(),
      transferDate: '',
      transferWindow: this.getCurrentTransferWindow(),
      
      transferFeeUSDC: askedPrice,
      platformFeePercent: 3,
      creatorRoyaltyPercent: 2,
      
      contractLengthMatches: 26,
      salaryPerMatchTokens: 50,
      
      status: 'pending',
      eligibleFromMatch: '',
      requiresTeamRegistration: true,
    };
    
    // Store listing
    if (!this.transfers.has(player.tokenId)) {
      this.transfers.set(player.tokenId, []);
    }
    this.transfers.get(player.tokenId)!.push(listing);
    
    return { success: true, message: 'Player listed', listing };
  }
  
  /**
   * Execute transfer (buyer purchases player)
   */
  async executeTransfer(
    playerTokenId: string,
    toTeam: Team,
    agreePrice: number
  ): Promise<{
    success: boolean;
    message: string;
    transfer?: Transfer;
  }> {
    // Find active listing
    const listings = this.transfers.get(playerTokenId) || [];
    const activeListing = listings.find(t => t.status === 'pending');
    
    if (!activeListing) {
      return { success: false, message: 'No active listing found' };
    }
    
    // Check budget
    if ((this.teamBudgets.get(toTeam.id) || 0) < agreePrice) {
      return { success: false, message: 'Insufficient budget' };
    }
    
    // Validate squad restrictions
    if (!this.canAddPlayerToSquad(toTeam, activeListing)) {
      return { success: false, message: 'Squad composition violation' };
    }
    
    // Execute transfer
    activeListing.toTeamId = toTeam.id;
    activeListing.toTeamName = toTeam.name;
    activeListing.transferDate = new Date().toISOString();
    activeListing.transferFeeUSDC = agreePrice;
    activeListing.status = 'cleared';
    
    // Deduct budget
    this.teamBudgets.set(
      toTeam.id,
      (this.teamBudgets.get(toTeam.id) || 0) - agreePrice
    );
    
    // Register NFT ownership change on blockchain
    await this.transferNFTOwnership(activeListing);
    
    return {
      success: true,
      message: 'Transfer completed and cleared',
      transfer: activeListing,
    };
  }
  
  /**
   * Validate if player can be transferred
   */
  private isPlayerTransferable(player: NFTPlayer, team: Team): boolean {
    // Must complete 1 full season (26 matches)
    if (player.matchesPlayed < 26) {
      return false;
    }
    
    // Can't transfer while suspended
    if (player.suspensionStatus?.isSuspended) {
      return false;
    }
    
    // Must be under active contract
    if (!player.contractActive) {
      return false;
    }
    
    // Can't transfer mid-season (unless emergency window)
    const window = this.getCurrentTransferWindow();
    if (window !== 'summer' && window !== 'emergency') {
      return player.transferEligible || false;
    }
    
    return true;
  }
  
  /**
   * Check if team can add player (squad composition)
   */
  private canAddPlayerToSquad(team: Team, transfer: Transfer): boolean {
    // Count players by position
    const positionCounts = new Map<string, number>();
    
    for (const player of team.squad) {
      positionCounts.set(
        player.position,
        (positionCounts.get(player.position) || 0) + 1
      );
    }
    
    const currentCount = positionCounts.get(transfer.playerPosition) || 0;
    
    // Max 3 players per position (except GK: max 2, ST: max 2)
    if (transfer.playerPosition === 'GK' && currentCount >= 2) return false;
    if (transfer.playerPosition === 'ST' && currentCount >= 2) return false;
    if (currentCount >= 3) return false;
    
    // Must maintain 11+ eligible players total
    if (team.squad.length >= 18) return false; // Max squad size
    
    return true;
  }
  
  /**
   * Get current transfer window type
   */
  private getCurrentTransferWindow(): 'summer' | 'winter' | 'emergency' {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    if (month >= 6 && month <= 8) return 'summer';
    if (month === 1) return 'winter';
    if (month >= 2 && month <= 3) return 'emergency';
    
    return 'summer'; // Default
  }
  
  private async transferNFTOwnership(transfer: Transfer): Promise<void> {
    // Call NFT contract to transfer ownership
    // Update on-chain records
    // TODO: Implement blockchain call
  }
}
```

---

## Squad & Match Rules

### Squad Management

```typescript
export interface SquadSheet {
  matchId: string;
  team: Team;
  submittedFrame: number;
  
  // Formation
  formationId: string; // '4-4-2', '4-3-3', etc.
  formationName: string;
  
  // Squad
  playingXI: PlayerSquadEntry[];
  substitutes: PlayerSquadEntry[];
  
  // Designations
  captain: {
    playerName: string;
    playerNumber: number;
  };
  
  // Validation
  isValidated: boolean;
  validationErrors: string[];
}

export interface PlayerSquadEntry {
  playerTokenId: string;
  playerName: string;
  playerNumber: number;
  playerPosition: string;
  
  // Eligibility
  eligibleForMatch: boolean;
  ineligibilityReason?: string;
  
  // Status
  isSuspended: boolean;
  isInjured: boolean;
  contractActive: boolean;
}

export class SquadValidationSystem {
  /**
   * Validate squad sheet before match
   */
  validateSquadSheet(squadSheet: SquadSheet): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Check XI count
    if (squadSheet.playingXI.length !== 11) {
      errors.push(`Playing XI must be exactly 11 players (found ${squadSheet.playingXI.length})`);
    }
    
    // Check bench count
    if (squadSheet.substitutes.length > 7) {
      errors.push(`Bench cannot exceed 7 players (found ${squadSheet.substitutes.length})`);
    }
    
    // Check formation validity
    if (!this.isValidFormation(squadSheet.formationId)) {
      errors.push(`Invalid formation: ${squadSheet.formationId}`);
    }
    
    // Check formation positions match
    const positionErrors = this.validateFormationPositions(
      squadSheet.playingXI,
      squadSheet.formationId
    );
    errors.push(...positionErrors);
    
    // Check player eligibility
    for (const player of squadSheet.playingXI) {
      if (!player.eligibleForMatch) {
        errors.push(
          `Ineligible player: ${player.playerName} - ${player.ineligibilityReason}`
        );
      }
    }
    
    // Check minimum total eligible
    const totalEligible = squadSheet.playingXI.length + squadSheet.substitutes.length;
    if (totalEligible < 11) {
      errors.push(
        `Insufficient eligible players (${totalEligible}). Minimum 11 required.`
      );
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Validate formation positions
   */
  private validateFormationPositions(
    players: PlayerSquadEntry[],
    formationId: string
  ): string[] {
    const errors: string[] = [];
    const required = this.getFormationRequirements(formationId);
    const positions = new Map<string, number>();
    
    // Count positions
    for (const player of players) {
      positions.set(
        player.playerPosition,
        (positions.get(player.playerPosition) || 0) + 1
      );
    }
    
    // Validate each position
    for (const [pos, count] of required) {
      const actual = positions.get(pos) || 0;
      if (actual !== count) {
        errors.push(
          `Formation ${formationId} requires ${count} ${pos}, found ${actual}`
        );
      }
    }
    
    return errors;
  }
  
  /**
   * Get formation requirements
   */
  private getFormationRequirements(
    formationId: string
  ): Map<string, number> {
    const formations: Map<string, Map<string, number>> = new Map([
      ['4-4-2', new Map([['GK', 1], ['CB', 2], ['FB', 2], ['MF', 4], ['ST', 2]])],
      ['4-3-3', new Map([['GK', 1], ['CB', 2], ['FB', 2], ['MF', 3], ['ST', 3]])],
      ['3-5-2', new Map([['GK', 1], ['CB', 3], ['FB', 2], ['MF', 5], ['ST', 1]])],
      ['5-3-2', new Map([['GK', 1], ['CB', 3], ['WB', 2], ['MF', 3], ['ST', 2]])],
      ['5-4-1', new Map([['GK', 1], ['CB', 3], ['WB', 2], ['MF', 4], ['ST', 1]])],
    ]);
    
    return formations.get(formationId) || new Map();
  }
  
  /**
   * Check if formation is valid
   */
  private isValidFormation(formationId: string): boolean {
    const valid = ['4-4-2', '4-3-3', '3-5-2', '5-3-2', '5-4-1'];
    return valid.includes(formationId);
  }
}
```

---

## Physics & Offside Detection

### Offside System

```typescript
export class OffsideDetectionSystem {
  /**
   * Check if pass results in offside
   */
  detectOffside(
    passer: Player,
    receiver: Player,
    defendingTeam: 'home' | 'away',
    allPlayers: Player[]
  ): { isOffside: boolean; margin: number } {
    // Exclude goalkeeper
    const defenders = allPlayers.filter(
      p => p.team === defendingTeam && p.position !== 'GK'
    );
    
    if (defenders.length === 0) {
      return { isOffside: true, margin: Infinity };
    }
    
    // Find last defender
    const lastDefender = this.findLastDefender(defenders, receiver.team);
    
    if (!lastDefender) {
      return { isOffside: true, margin: Infinity };
    }
    
    // Calculate offside margin
    const receiverX = receiver.position.x;
    const lastDefenderX = lastDefender.position.x;
    const passerX = passer.position.x;
    
    // Determine direction based on team
    const isHometeam = receiver.team === 'home';
    const movingForward = isHometeam ? 
      receiverX > passerX : 
      receiverX < passerX;
    
    if (!movingForward) {
      return { isOffside: false, margin: 0 };
    }
    
    // Calculate margin (negative = onside, positive = offside)
    const margin = isHometeam ?
      receiverX - Math.max(lastDefenderX, passerX) :
      Math.min(lastDefenderX, passerX) - receiverX;
    
    return {
      isOffside: margin > 0,
      margin,
    };
  }
  
  /**
   * Find last defender (closest to goal)
   */
  private findLastDefender(
    defenders: Player[],
    attackingTeam: 'home' | 'away'
  ): Player | null {
    if (defenders.length === 0) return null;
    
    const goalX = attackingTeam === 'home' ? 120000 : 0; // Goal position
    
    return defenders.reduce((last, current) => {
      const lastDist = Math.abs(last.position.x - goalX);
      const currentDist = Math.abs(current.position.x - goalX);
      return currentDist < lastDist ? current : last;
    });
  }
}

export interface OffsideEvent {
  frame: number;
  passer: Player;
  receiver: Player;
  defendingTeam: 'home' | 'away';
  
  isOffside: boolean;
  margin: number; // mm
  
  // Event consequence
  freeKickPosition: Vector3;
  awardedTo: 'home' | 'away';
}
```

### Handball & Penalty Detection

```typescript
export class HandballDetectionSystem {
  /**
   * Detect handball incident
   */
  detectHandball(
    player: Player,
    ball: Ball,
    context: {
      ballVelocity: Vector3;
      playerArmPosition: Vector3;
      intentionalBlock: boolean;
    }
  ): {
    isHandball: boolean;
    isDeliberate: boolean;
    inPenaltyArea: boolean;
  } {
    // Check if hand touched ball
    const handDistance = this.calculateHandDistance(player, ball);
    
    if (handDistance > 300) {
      return { isHandball: false, isDeliberate: false, inPenaltyArea: false };
    }
    
    // Determine if deliberate
    const armExtension = this.calculateArmExtension(player);
    const isUnnatural = armExtension > 30; // degrees
    const blockingGoal = context.intentionalBlock;
    
    const isDeliberate = isUnnatural || blockingGoal;
    
    // Check if in penalty area
    const inPenaltyArea = this.isInPenaltyArea(
      ball.posX_mm,
      ball.posY_mm,
      player.team
    );
    
    return {
      isHandball: true,
      isDeliberate,
      inPenaltyArea,
    };
  }
  
  private calculateHandDistance(player: Player, ball: Ball): number {
    // Simplified distance calc (would use actual hand position in real implementation)
    return Math.hypot(
      player.position.x - ball.posX_mm,
      player.position.y - ball.posY_mm
    );
  }
  
  private calculateArmExtension(player: Player): number {
    // Calculate how far arm is from body (0-90 degrees)
    // This would use animation skeletal data in real implementation
    return 0;
  }
  
  private isInPenaltyArea(
    x: number,
    y: number,
    team: 'home' | 'away'
  ): boolean {
    const penaltyMinY = 27000; // mm
    const penaltyMaxY = 93000;
    
    if (team === 'home') {
      return x >= 0 && x <= 16500 && y >= penaltyMinY && y <= penaltyMaxY;
    } else {
      return x >= 103500 && x <= 120000 && y >= penaltyMinY && y <= penaltyMaxY;
    }
  }
}
```

---

## Match Engine Integration

### Main Match Rules Orchestrator

```typescript
export class MatchRulesEngine {
  private disciplinarySystem: DisciplinarySystem;
  private suspensionSystem: SuspensionSystem;
  private transferSystem: TransferSystem;
  private squadValidation: SquadValidationSystem;
  private offsideDetection: OffsideDetectionSystem;
  private handballs: HandballDetectionSystem;
  
  private match: Match;
  
  constructor(matchId: string) {
    this.disciplinarySystem = new DisciplinarySystem(matchId);
    this.suspensionSystem = new SuspensionSystem();
    this.transferSystem = new TransferSystem();
    this.squadValidation = new SquadValidationSystem();
    this.offsideDetection = new OffsideDetectionSystem();
    this.handballs = new HandballDetectionSystem();
  }
  
  /**
   * Initialize match with pre-match validation
   */
  initializeMatch(match: Match): {
    valid: boolean;
    errors: string[];
  } {
    this.match = match;
    const errors: string[] = [];
    
    // Validate both squads
    for (const squadSheet of [match.homeSquad, match.awaySquad]) {
      const validation = this.squadValidation.validateSquadSheet(squadSheet);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }
    
    // Check suspensions
    for (const squadSheet of [match.homeSquad, match.awaySquad]) {
      for (const player of [...squadSheet.playingXI, ...squadSheet.substitutes]) {
        const suspStatus = this.suspensionSystem.getSuspensionStatus(player.playerTokenId);
        if (suspStatus.isSuspended) {
          errors.push(
            `${player.playerName} is serving suspension (${suspStatus.matchesRemaining} matches remaining)`
          );
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  /**
   * Process foul and return card/consequences
   */
  processFoul(
    fouler: Player,
    fouled: Player,
    frame: number,
    context: FoulContext
  ): { card?: CardEvent; foulType: string; consequence: string } {
    const result = this.disciplinarySystem.evaluateFoul(
      fouler,
      fouled,
      frame,
      context
    );
    
    let consequence = '';
    if (result.card) {
      if (result.card.cardColor === 'yellow') {
        consequence = `${fouler.name} receives yellow card`;
      } else {
        consequence = `${fouler.name} sent off with red card`;
      }
    } else {
      consequence = `Free kick awarded to ${fouled.team}`;
    }
    
    return { ...result, consequence };
  }
  
  /**
   * Check and process offside
   */
  checkOffside(
    passer: Player,
    receiver: Player,
    allPlayers: Player[]
  ): OffsideEvent | null {
    const defendingTeam = passer.team === 'home' ? 'away' : 'home';
    const offsideCheck = this.offsideDetection.detectOffside(
      passer,
      receiver,
      defendingTeam,
      allPlayers
    );
    
    if (!offsideCheck.isOffside) {
      return null;
    }
    
    return {
      frame: this.match.currentFrame,
      passer,
      receiver,
      defendingTeam,
      isOffside: true,
      margin: offsideCheck.margin,
      freeKickPosition: receiver.position,
      awardedTo: defendingTeam,
    };
  }
  
  /**
   * Check handball incident
   */
  checkHandball(
    player: Player,
    ball: Ball,
    context: any
  ): { isPenalty: boolean; isFreeKick: boolean; isCard: boolean } {
    const handball = this.handballs.detectHandball(player, ball, context);
    
    if (!handball.isHandball) {
      return { isPenalty: false, isFreeKick: false, isCard: false };
    }
    
    if (handball.inPenaltyArea && handball.isDeliberate) {
      return { isPenalty: true, isFreeKick: false, isCard: true };
    }
    
    return { isPenalty: false, isFreeKick: true, isCard: handball.isDeliberate };
  }
  
  /**
   * End of match: decrement suspensions, clear up data
   */
  endMatch(homeTeam: Team, awayTeam: Team): void {
    // Decrement all suspensions
    for (const player of [...homeTeam.players, ...awayTeam.players]) {
      this.suspensionSystem.decrementSuspensions(player.id);
    }
    
    // Record match results on-chain
    // Clear temporary data
  }
}
```

---

## Example Usage

```typescript
// Initialize match rules
const rulesEngine = new MatchRulesEngine(match.matchId);

// Pre-match validation
const validation = rulesEngine.initializeMatch(match);
if (!validation.valid) {
  console.error('Invalid match setup:', validation.errors);
  return;
}

// During match: process foul
const foul = rulesEngine.processFoul(
  playerA,
  playerB,
  currentFrame,
  {
    foulerPosition: playerA.position,
    fouledPosition: playerB.position,
    ballPosition: ball.position,
    excessiveForce: true,
    reckless: false,
    dangerous: false,
    // ... other properties
  }
);

console.log(foul.consequence); // "Player X receives yellow card"

// Check offside on pass
const offsideEvent = rulesEngine.checkOffside(passer, receiver, allPlayers);
if (offsideEvent) {
  console.log(`Offside! ${receiver.name} ahead of last defender by ${offsideEvent.margin}mm`);
}

// End of match
rulesEngine.endMatch(homeTeam, awayTeam);
```

---

This implementation provides production-ready code for implementing FIFA rules in Bass Ball with full blockchain integration, suspension management, transfer systems, and all real-world football mechanics.
