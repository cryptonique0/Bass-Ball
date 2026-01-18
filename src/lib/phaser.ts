// Phaser game integration setup with optimized rendering
import Phaser from 'phaser';
import { MatchState, PlayerInput } from '@/types/match';
import { sendPlayerInput } from './socket';

export interface GameSceneData {
  matchState: MatchState;
  playerId: string;
  playerTeam: 'home' | 'away';
}

export class MatchScene extends Phaser.Scene {
  declare load: Phaser.Loader.LoaderPlugin;
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare make: Phaser.GameObjects.GameObjectCreator;
  declare physics: Phaser.Physics.Arcade.ArcadePhysics;
  declare input: Phaser.Input.InputManager;

  private matchState: MatchState | null = null;
  private playerId: string = '';
  private playerTeam: 'home' | 'away' = 'home';
  private ballSprite: Phaser.Physics.Arcade.Sprite | null = null;
  private homePlayerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private awayPlayerSprites: Map<string, Phaser.Physics.Arcade.Sprite> = new Map();
  private controlsActive: boolean = false;
  private selectedPlayerIndex: number = 0;
  private lastUpdateTick: number = 0;
  private spritePool: Phaser.Physics.Arcade.Sprite[] = []; // Object pooling for sprites

  constructor() {
    super({ key: 'MatchScene' });
  }

  init(data: GameSceneData) {
    this.matchState = data.matchState;
    this.playerId = data.playerId;
    this.playerTeam = data.playerTeam;
  }

  preload() {
    // Load assets - in production, load actual sprites
    this.load.image('ball', '/assets/ball.png');
    this.load.image('player-home', '/assets/player-home.png');
    this.load.image('player-away', '/assets/player-away.png');
    this.load.image('field', '/assets/field.png');
  }

  create() {
    if (!this.matchState) return;

    // Create field background (optimized: simple graphics, no physics)
    const fieldWidth = 1024;
    const fieldHeight = 576;
    
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x1a5f1a, 1);
    graphics.fillRect(0, 0, fieldWidth, fieldHeight);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.strokeRect(0, 0, fieldWidth, fieldHeight);
    graphics.strokeRect(fieldWidth / 2 - 1, 0, 2, fieldHeight);
    graphics.generateTexture('field', fieldWidth, fieldHeight);
    graphics.destroy();

    this.add.image(fieldWidth / 2, fieldHeight / 2, 'field').setDepth(0);

    // Create ball with optimized physics
    this.ballSprite = this.physics.add.sprite(
      this.matchState.ball.x || fieldWidth / 2,
      this.matchState.ball.y || fieldHeight / 2,
      'ball'
    );
    this.ballSprite.setScale(0.5);
    this.ballSprite.setCollideWorldBounds(true);
    this.ballSprite.setBounce(0.8);
    this.ballSprite.setDepth(10);
    // Disable physics update frequency (update every other frame to save CPU)
    this.ballSprite.body?.setMaxSpeed(500);

    // Create home team players with sprite pooling
    this.matchState.homeTeam.players.forEach((player: any, idx: number) => {
      const sprite = this.physics.add.sprite(player.position.x, player.position.y, 'player-home');
      sprite.setScale(0.4);
      sprite.setTint(0xff0000);
      sprite.setDepth(5);
      sprite.setMaxVelocity(300, 300);
      sprite.setDrag(0.99, 0.99); // High drag for realistic movement
      this.homePlayerSprites.set(player.id, sprite);
    });

    // Create away team players
    this.matchState.awayTeam.players.forEach((player: any, idx: number) => {
      const sprite = this.physics.add.sprite(player.position.x, player.position.y, 'player-away');
      sprite.setScale(0.4);
      sprite.setTint(0x0000ff);
      sprite.setDepth(5);
      sprite.setMaxVelocity(300, 300);
      sprite.setDrag(0.99, 0.99);
      this.awayPlayerSprites.set(player.id, sprite);
    });

    // Setup input handling
    this.setupControls();

    this.controlsActive = true;
  }

  private setupControls() {
    if (!this.input.keyboard) return;

    // WASD or Arrow keys for movement
    this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
      const lowerKey = event.key.toLowerCase();

      if (lowerKey === 'w' || event.key === 'ArrowUp') {
        this.emitPlayerInput('MOVE', { y: -1 });
      } else if (lowerKey === 's' || event.key === 'ArrowDown') {
        this.emitPlayerInput('MOVE', { y: 1 });
      } else if (lowerKey === 'a' || event.key === 'ArrowLeft') {
        this.emitPlayerInput('MOVE', { x: -1 });
      } else if (lowerKey === 'd' || event.key === 'ArrowRight') {
        this.emitPlayerInput('MOVE', { x: 1 });
      } else if (lowerKey === ' ') {
        event.preventDefault();
        this.emitPlayerInput('SHOOT', { power: 85, angle: 0 });
      } else if (lowerKey === 'p') {
        this.emitPlayerInput('PASS', { power: 50, angle: 0 });
      } else if (lowerKey === 't') {
        this.emitPlayerInput('TACKLE', { targetId: '' });
      } else if (lowerKey === 'shift') {
        this.emitPlayerInput('SPRINT', {});
      }
    });
  }

  private emitPlayerInput(
    action: 'MOVE' | 'PASS' | 'SHOOT' | 'TACKLE' | 'SPRINT' | 'SKILL',
    params: Record<string, any>
  ) {
    if (!this.controlsActive || !this.matchState) return;

    const input: PlayerInput = {
      tick: this.matchState.tick,
      action,
      params,
      timestamp: Date.now(),
    };

    sendPlayerInput(input);
  }

  update(time: number, delta: number) {
    if (!this.matchState) return;

    // Optimize: Only update sprites every other frame (30Hz instead of 60Hz display)
    // Server sends 60Hz state, but rendering can be optimized
    if (this.lastUpdateTick % 2 !== 0) {
      this.lastUpdateTick++;
      return;
    }
    this.lastUpdateTick++;

    // Update ball position (delta update, not full state)
    if (this.ballSprite) {
      // Use tween for smooth ball movement instead of instant updates
      if (
        Math.abs(this.ballSprite.x - this.matchState.ball.x) > 2 ||
        Math.abs(this.ballSprite.y - this.matchState.ball.y) > 2
      ) {
        // Significant change, update immediately
        this.ballSprite.setPosition(this.matchState.ball.x, this.matchState.ball.y);
      }
    }

    // Update player positions with culling (only visible players)
    const viewport = {
      minX: -100,
      maxX: 1124,
      minY: -100,
      maxY: 676,
    };

    // Update home team (with frustum culling)
    this.matchState.homeTeam.players.forEach((player: any) => {
      const sprite = this.homePlayerSprites.get(player.id);
      if (sprite && this.isInViewport(player.position.x, player.position.y, viewport)) {
        sprite.setPosition(player.position.x, player.position.y);
        sprite.setActive(true).setVisible(true);
      } else if (sprite) {
        sprite.setActive(false).setVisible(false); // Disable rendering for offscreen sprites
      }
    });

    // Update away team
    this.matchState.awayTeam.players.forEach((player: any) => {
      const sprite = this.awayPlayerSprites.get(player.id);
      if (sprite && this.isInViewport(player.position.x, player.position.y, viewport)) {
        sprite.setPosition(player.position.x, player.position.y);
        sprite.setActive(true).setVisible(true);
      } else if (sprite) {
        sprite.setActive(false).setVisible(false);
      }
    });
  }

  /**
   * Check if position is within viewport (frustum culling)
   */
  private isInViewport(x: number, y: number, viewport: any): boolean {
    return x >= viewport.minX && x <= viewport.maxX && y >= viewport.minY && y <= viewport.maxY;
  }

  shutdown() {
    this.controlsActive = false;
    this.homePlayerSprites.clear();
    this.awayPlayerSprites.clear();
  }
}

export const createGameConfig = (): Phaser.Types.Core.GameConfig => ({
  type: Phaser.AUTO,
  width: 1024,
  height: 576,
  parent: 'phaser-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
      enableBody: true,
      enableStaticBody: true,
      // Optimize physics: use spatial hashing
      fps: 60,
      timeScale: 1,
    },
  },
  scene: MatchScene,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    resizeInterval: 100, // Reduce resize checks
  },
  render: {
    pixelArt: false,
    antialias: true,
    // Performance optimizations
    batchSize: 4096, // Optimize WebGL batch size
    maxLights: 8, // Limit lights for performance
  },
});

export const initializeGame = (containerId: string): Phaser.Game => {
  const config = createGameConfig();
  config.parent = containerId;

  return new Phaser.Game(config);
};
