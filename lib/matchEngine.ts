import { Team, Player, GameState } from './gameEngine';

// Match event types
export type EventType = 'goal' | 'shot' | 'tackle' | 'foul' | 'yellow_card' | 'red_card' | 'injury' | 'substitution' | 'pass' | 'possession_change';

export interface MatchEvent {
  time: number;
  type: EventType;
  team: 'home' | 'away';
  player: string;
  description: string;
  details?: any;
}

export interface MatchStats {
  homeTeam: {
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    fouls: number;
    possession: number;
  };
  awayTeam: {
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    fouls: number;
    possession: number;
  };
  events: MatchEvent[];
}

export interface PlayerCard {
  player: string;
  cardType: 'yellow' | 'red';
  minute: number;
}

/**
 * Core Match Engine
 * Handles all match mechanics: goals, fouls, cards, stamina, possession
 */
export class MatchEngine {
  private gameState: GameState;
  private matchStats: MatchStats;
  private ballPossessionTeam: 'home' | 'away' | null = null;
  private ballPossessionPlayer: string | null = null;
  private possessionStartTime = 0;
  private playerCards: Map<string, PlayerCard[]> = new Map();
  private frameCount = 0;
  private lastShotTeam: 'home' | 'away' | null = null;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.matchStats = {
      homeTeam: {
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passAccuracy: 0,
        tackles: 0,
        fouls: 0,
        possession: 0,
      },
      awayTeam: {
        shots: 0,
        shotsOnTarget: 0,
        passes: 0,
        passAccuracy: 0,
        tackles: 0,
        fouls: 0,
        possession: 0,
      },
      events: [],
    };

    // Initialize player cards
    [...gameState.homeTeam.players, ...gameState.awayTeam.players].forEach((p) => {
      this.playerCards.set(p.id, []);
    });
  }

  /**
   * Main update loop - call this every frame
   */
  public update(deltaTime: number = 0.016): void {
    if (!this.gameState.isPlaying) return;

    this.frameCount++;

    // Update every 6 frames (roughly 10 updates per second at 60fps)
    if (this.frameCount % 6 === 0) {
      this.updateBallPhysics();
      this.updatePossession();
      this.updateStamina(deltaTime);
      this.checkShooting();
      this.checkTackle();
      this.checkGoal();
      this.updateMatchTime();
    }
  }

  /**
   * Simple ball physics with RNG
   */
  private updateBallPhysics(): void {
    const ball = this.gameState;

    // Apply friction
    ball.ballVx *= 0.98;
    ball.ballVy *= 0.98;

    // Update position
    ball.ballX += ball.ballVx;
    ball.ballY += ball.ballVy;

    // Boundary collision (bouncy)
    if (ball.ballX < 0 || ball.ballX > 1050) {
      ball.ballVx *= -0.85;
      ball.ballX = Math.max(0, Math.min(1050, ball.ballX));
    }
    if (ball.ballY < 0 || ball.ballY > 680) {
      ball.ballVy *= -0.85;
      ball.ballY = Math.max(0, Math.min(680, ball.ballY));
    }

    // Gravity effect (slight downward bias)
    ball.ballVy += 0.05;
  }

  /**
   * Track possession and auto-pass/move ball
   */
  private updatePossession(): void {
    const ball = this.gameState;
    const allPlayers = [...this.gameState.homeTeam.players, ...this.gameState.awayTeam.players];

    // Find closest player to ball
    let closestPlayer: Player | null = null;
    let closestDist = Infinity;
    let closestTeam: 'home' | 'away' | null = null;

    allPlayers.forEach((p) => {
      const dist = Math.hypot(p.x - ball.ballX, p.y - ball.ballY);
      if (dist < closestDist && dist < 80) {
        closestDist = dist;
        closestPlayer = p;
        closestTeam = this.gameState.homeTeam.players.includes(p) ? 'home' : 'away';
      }
    });

    // Update possession
    if (closestPlayer && closestTeam) {
      if (this.ballPossessionPlayer !== closestPlayer.id) {
        this.ballPossessionPlayer = closestPlayer.id;
        this.ballPossessionTeam = closestTeam;
        this.possessionStartTime = this.gameState.gameTime;
      }

      // AI automatically moves ball toward opponent goal
      if (!this.gameState.selectedPlayer) {
        this.autoPossession(closestPlayer, closestTeam);
      }
    } else {
      this.ballPossessionPlayer = null;
      this.ballPossessionTeam = null;
    }

    // Update possession percentage
    const totalTime = this.gameState.gameTime || 1;
    const homeTime = this.matchStats.homeTeam.possession;
    this.matchStats.homeTeam.possession = Math.round((homeTime / totalTime) * 100);
    this.matchStats.awayTeam.possession = 100 - this.matchStats.homeTeam.possession;
  }

  /**
   * AI auto-possession: move ball toward opponent goal
   */
  private autoPossession(player: Player, team: 'home' | 'away'): void {
    const targetX = team === 'home' ? 1050 : 0;
    const targetY = this.gameState.ballY;

    const direction = Math.atan2(targetY - this.gameState.ballY, targetX - this.gameState.ballX);
    const speed = 3 + Math.random() * 2;

    this.gameState.ballVx = Math.cos(direction) * speed;
    this.gameState.ballVy = Math.sin(direction) * speed;

    // Occasional random passes
    if (Math.random() < 0.02) {
      this.attemptPass(player, team);
    }
  }

  /**
   * Stamina system - decreases during play, affects stats
   */
  private updateStamina(deltaTime: number): void {
    const allPlayers = [...this.gameState.homeTeam.players, ...this.gameState.awayTeam.players];

    allPlayers.forEach((p) => {
      // Stamina depletes during play
      const staminaDrain = p.position === 'GK' ? 0.01 : 0.05;
      p.stamina = Math.max(0, p.stamina - staminaDrain);

      // Low stamina affects player performance
      if (p.stamina < 30) {
        p.pace *= 0.85;
        p.defense *= 0.80;
        p.dribbling *= 0.80;
      }
    });
  }

  /**
   * Check if ball goes toward goal and attempt shot
   */
  private checkShooting(): void {
    const ball = this.gameState;
    const threshold = 100; // Close enough to goal to attempt shot

    // Home team shooting at away goal (x=1050)
    if (ball.ballX > 900 && this.ballPossessionTeam === 'home' && Math.random() < 0.008) {
      this.attemptShot('home');
    }

    // Away team shooting at home goal (x=0)
    if (ball.ballX < 150 && this.ballPossessionTeam === 'away' && Math.random() < 0.008) {
      this.attemptShot('away');
    }
  }

  /**
   * Attempt a shot with probability based on player stats
   */
  private attemptShot(team: 'home' | 'away'): void {
    if (!this.ballPossessionPlayer) return;

    const players = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
    const player = players.find((p) => p.id === this.ballPossessionPlayer);
    if (!player) return;

    // Success probability based on shooting stat and distance from goal
    const distance = team === 'home' ? 1050 - this.gameState.ballX : this.gameState.ballX;
    const distanceFactor = Math.max(0.2, 1 - distance / 500);
    const shotSuccess = (player.shooting / 100) * distanceFactor * (1 - Math.random() * 0.3);

    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].shots++;

    if (shotSuccess > 0.5) {
      // Shot on target
      this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].shotsOnTarget++;

      // Check if goal (add RNG)
      const goalChance = shotSuccess * 0.8 + Math.random() * 0.2;
      if (goalChance > 0.55) {
        this.scoreGoal(team, player);
        this.lastShotTeam = team;
      } else {
        this.recordEvent({
          time: this.gameState.gameTime,
          type: 'shot',
          team,
          player: player.name,
          description: `${player.name} shot saved!`,
        });
      }
    } else {
      // Shot missed
      this.recordEvent({
        time: this.gameState.gameTime,
        type: 'shot',
        team,
        player: player.name,
        description: `${player.name} shot wide!`,
      });
    }

    // Reset ball after shot
    this.resetBallAfterShot(team);
  }

  /**
   * Score a goal
   */
  private scoreGoal(team: 'home' | 'away', player: Player): void {
    if (team === 'home') {
      this.gameState.homeTeam.score++;
    } else {
      this.gameState.awayTeam.score++;
    }

    this.recordEvent({
      time: this.gameState.gameTime,
      type: 'goal',
      team,
      player: player.name,
      description: `⚽ GOAL! ${player.name} scores for ${team === 'home' ? 'HOME' : 'AWAY'}!`,
    });
  }

  /**
   * Check for tackles and fouls with RNG
   */
  private checkTackle(): void {
    if (!this.ballPossessionPlayer || !this.ballPossessionTeam) return;

    const possessionTeam = this.ballPossessionTeam;
    const defendingTeam = possessionTeam === 'home' ? 'away' : 'home';
    const defendingPlayers = defendingTeam === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;

    // Check if defender is close enough to challenge
    const possessionPlayer = [...this.gameState.homeTeam.players, ...this.gameState.awayTeam.players].find(
      (p) => p.id === this.ballPossessionPlayer
    );
    if (!possessionPlayer) return;

    defendingPlayers.forEach((defender) => {
      const distance = Math.hypot(defender.x - possessionPlayer.x, defender.y - possessionPlayer.y);

      if (distance < 100 && Math.random() < 0.01) {
        this.attemptTackle(possessionPlayer, defender, defendingTeam);
      }
    });
  }

  /**
   * Process tackle with foul probability
   */
  private attemptTackle(attacker: Player, defender: Player, defenderTeam: 'home' | 'away'): void {
    const defenseSuccess = (defender.defense / 100) * (1 - attacker.dribbling / 200);

    if (Math.random() < defenseSuccess) {
      // Successful tackle
      this.ballPossessionTeam = defenderTeam;
      this.ballPossessionPlayer = defender.id;

      this.recordEvent({
        time: this.gameState.gameTime,
        type: 'tackle',
        team: defenderTeam,
        player: defender.name,
        description: `${defender.name} wins the ball!`,
      });

      this.matchStats[defenderTeam === 'home' ? 'homeTeam' : 'awayTeam'].tackles++;
    } else if (Math.random() < 0.4) {
      // Foul committed
      this.commitFoul(defender, defenderTeam);
    }
  }

  /**
   * Commit a foul and assign cards
   */
  private commitFoul(player: Player, team: 'home' | 'away'): void {
    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].fouls++;

    // Card probability based on RNG
    const cardRng = Math.random();
    let cardType: 'yellow' | 'red' | null = null;

    if (cardRng < 0.15) {
      cardType = 'yellow';
    } else if (cardRng < 0.03) {
      cardType = 'red';
    }

    if (cardType) {
      this.assignCard(player, cardType, team);
    }

    this.recordEvent({
      time: this.gameState.gameTime,
      type: 'foul',
      team,
      player: player.name,
      description: `${player.name} commits a foul!${cardType ? ` ${cardType === 'yellow' ? '🟨' : '🔴'} ${cardType.toUpperCase()}` : ''}`,
    });
  }

  /**
   * Assign yellow or red card
   */
  private assignCard(player: Player, cardType: 'yellow' | 'red', team: 'home' | 'away'): void {
    const cards = this.playerCards.get(player.id) || [];
    const yellowCount = cards.filter((c) => c.cardType === 'yellow').length;

    if (cardType === 'red' || yellowCount >= 1) {
      // Player sent off
      this.recordEvent({
        time: this.gameState.gameTime,
        type: cardType === 'red' ? 'red_card' : 'yellow_card',
        team,
        player: player.name,
        description: `🔴 ${player.name} is sent off!`,
      });

      // Remove player from match
      const teamPlayers = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
      const idx = teamPlayers.findIndex((p) => p.id === player.id);
      if (idx > -1) {
        teamPlayers.splice(idx, 1);
      }
    } else {
      // Yellow card
      this.recordEvent({
        time: this.gameState.gameTime,
        type: 'yellow_card',
        team,
        player: player.name,
        description: `🟨 ${player.name} receives a yellow card!`,
      });

      cards.push({
        player: player.name,
        cardType: 'yellow',
        minute: Math.floor(this.gameState.gameTime),
      });
      this.playerCards.set(player.id, cards);
    }
  }

  /**
   * Attempt pass between teammates
   */
  private attemptPass(player: Player, team: 'home' | 'away'): void {
    const teammates = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
    const otherTeammates = teammates.filter((p) => p.id !== player.id);

    if (otherTeammates.length === 0) return;

    // Random teammate
    const recipient = otherTeammates[Math.floor(Math.random() * otherTeammates.length)];

    // Pass success based on passing stat and distance
    const distance = Math.hypot(recipient.x - player.x, recipient.y - player.y);
    const passSuccess = (player.passing / 100) * Math.max(0, 1 - distance / 500);

    this.matchStats[team === 'home' ? 'homeTeam' : 'awayTeam'].passes++;

    if (Math.random() < passSuccess) {
      // Successful pass
      this.ballPossessionPlayer = recipient.id;
      this.gameState.ballX = recipient.x;
      this.gameState.ballY = recipient.y;

      this.recordEvent({
        time: this.gameState.gameTime,
        type: 'pass',
        team,
        player: player.name,
        description: `${player.name} passes to ${recipient.name}`,
      });
    }
  }

  /**
   * Check if goal was scored (ball crosses goal line)
   */
  private checkGoal(): void {
    const ball = this.gameState;
    const goalLineY_min = 250;
    const goalLineY_max = 430;

    // Home team scores (ball at x=1050)
    if (ball.ballX >= 1000 && ball.ballY > goalLineY_min && ball.ballY < goalLineY_max) {
      if (this.ballPossessionTeam === 'home' && this.lastShotTeam !== 'home') {
        // Already scored, don't double count
        return;
      }
    }

    // Away team scores (ball at x=0)
    if (ball.ballX <= 50 && ball.ballY > goalLineY_min && ball.ballY < goalLineY_max) {
      if (this.ballPossessionTeam === 'away' && this.lastShotTeam !== 'away') {
        // Already scored, don't double count
        return;
      }
    }
  }

  /**
   * Reset ball position after shot
   */
  private resetBallAfterShot(team: 'home' | 'away'): void {
    this.gameState.ballX = 525; // Center
    this.gameState.ballY = 340; // Center
    this.gameState.ballVx = 0;
    this.gameState.ballVy = 0;
    this.ballPossessionTeam = team === 'home' ? 'away' : 'home';
  }

  /**
   * Update match time
   */
  private updateMatchTime(): void {
    this.gameState.gameTime += 0.1;

    // Match ends at 90 minutes
    if (this.gameState.gameTime >= 90) {
      this.gameState.isPlaying = false;
    }
  }

  /**
   * Record match event
   */
  private recordEvent(event: Omit<MatchEvent, 'details'>): void {
    this.matchStats.events.push({
      ...event,
      details: {},
    });
  }

  /**
   * Get current match stats
   */
  public getStats(): MatchStats {
    return this.matchStats;
  }

  /**
   * Get ball possession team
   */
  public getPossessionTeam(): 'home' | 'away' | null {
    return this.ballPossessionTeam;
  }

  /**
   * Manually shoot (for human player)
   */
  public manualShoot(strength: number): void {
    if (!this.gameState.selectedPlayer) return;

    const player = this.gameState.selectedPlayer;
    const team = this.gameState.homeTeam.players.includes(player) ? 'home' : 'away';
    const targetX = team === 'home' ? 1050 : 0;

    // Calculate direction and speed
    const angle = Math.atan2(this.gameState.ballY - player.y, targetX - player.x);
    const speed = Math.min(strength, 15);

    this.gameState.ballVx = Math.cos(angle) * speed;
    this.gameState.ballVy = Math.sin(angle) * speed;

    this.attemptShot(team);
  }

  /**
   * Manual pass (for human player)
   */
  public manualPass(targetX: number, targetY: number): void {
    if (!this.gameState.selectedPlayer) return;

    const player = this.gameState.selectedPlayer;
    const angle = Math.atan2(targetY - player.y, targetX - player.x);
    const speed = 5;

    this.gameState.ballX = player.x;
    this.gameState.ballY = player.y;
    this.gameState.ballVx = Math.cos(angle) * speed;
    this.gameState.ballVy = Math.sin(angle) * speed;

    this.attemptPass(player, this.gameState.homeTeam.players.includes(player) ? 'home' : 'away');
  }

  /**
   * Get AI opponent next move
   */
  public getAIMove(): { type: 'pass' | 'shoot' | 'move'; data?: any } {
    if (!this.ballPossessionPlayer || !this.ballPossessionTeam) {
      return { type: 'move' };
    }

    const team = this.ballPossessionTeam;
    const players = team === 'home' ? this.gameState.homeTeam.players : this.gameState.awayTeam.players;
    const player = players.find((p) => p.id === this.ballPossessionPlayer);

    if (!player) return { type: 'move' };

    const ballX = this.gameState.ballX;
    const isCloseToGoal = team === 'home' ? ballX > 800 : ballX < 250;

    // Decision making with RNG
    if (isCloseToGoal && Math.random() < 0.4) {
      return { type: 'shoot' };
    } else if (Math.random() < 0.5) {
      return { type: 'pass' };
    } else {
      return { type: 'move' };
    }
  }
}
