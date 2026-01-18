# 🎮 Input System & Controller UX

**Gamepad Support, Input Buffering, Latency Feedback, Custom Keybinds, and Console-Grade Controls**

Bass Ball's input system delivers Konami-level precision: responsive gamepad support, intelligent input buffering, transparent latency feedback, and fully customizable keybinds.

---

## Table of Contents

1. [Input Architecture](#input-architecture)
2. [Gamepad Support & Mapping](#gamepad-support--mapping)
3. [Input Buffering System](#input-buffering-system)
4. [Latency Feedback UI](#latency-feedback-ui)
5. [Custom Keybind Profiles](#custom-keybind-profiles)
6. [Keyboard Controls (Primary)](#keyboard-controls-primary)
7. [Accessibility Options](#accessibility-options)
8. [Implementation](#implementation)

---

## Input Architecture

### Multi-Input Layer System

```
┌──────────────────────────────────────────────────────┐
│              INPUT SYSTEM LAYERS                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  LAYER 1: Raw Input Detection                       │
│  ├─ Keyboard (KeyDown/KeyUp events)                 │
│  ├─ Gamepad (Gamepad API polling, 60 Hz)            │
│  ├─ Mouse/Trackpad (directional aim)                │
│  └─ Touch (mobile, swipe controls)                  │
│                                                      │
│  LAYER 2: Input Buffering & Queue                   │
│  ├─ Store inputs for 100ms (6 frames @ 60Hz)        │
│  ├─ Detect input conflicts (overlaps)               │
│  ├─ Prioritize high-precision inputs (holds)        │
│  └─ Handle simultaneous button presses              │
│                                                      │
│  LAYER 3: Command Interpretation                    │
│  ├─ Map raw input to game commands                  │
│  ├─ Detect combos/sequences                         │
│  ├─ Differentiate press vs hold vs release          │
│  └─ Apply custom keybind profiles                   │
│                                                      │
│  LAYER 4: Server-Authoritative Validation           │
│  ├─ Send command to server (tick-locked)            │
│  ├─ Server verifies feasibility                     │
│  ├─ Server applies to game state                    │
│  └─ Client receives authoritative result            │
│                                                      │
│  LAYER 5: Feedback Display                          │
│  ├─ Show input latency indicator                    │
│  ├─ Display button pressed animation                │
│  ├─ Show buffered input queue (debug mode)          │
│  └─ Warning if input conflicts detected             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## Gamepad Support & Mapping

### Supported Controllers

```
SUPPORTED GAMEPADS:

✅ PlayStation 5 (DualSense)
   ├─ Haptic feedback: ✓ (rumble on pass completion)
   ├─ Adaptive triggers: ✓ (resistance on shot power)
   ├─ Motion controls: ✓ (optional aim assist)
   └─ Profile: Sony Standard Gamepad

✅ Xbox Series X|S (Xbox Controller)
   ├─ Rumble: ✓ (dual motors)
   ├─ Trigger feedback: ✓ (impulse on impact)
   ├─ Gyro: ✗ (not supported on Xbox)
   └─ Profile: Standard Gamepad

✅ Nintendo Switch Pro Controller
   ├─ Rumble: ✓ (HD Rumble)
   ├─ Motion: ✓ (gyro aim)
   ├─ Buttons: ✓ (all mapped)
   └─ Profile: Standard Gamepad

✅ Generic GamepadAPI-Compatible
   ├─ Logitech F310 / F710
   ├─ SCUF Impact / Vantage 2
   ├─ 8BitDo Pro / Pro 2
   └─ Any Gamepad API compliant device

Browser Compatibility:
├─ Chrome/Edge: Full support (GamepadAPI v2)
├─ Firefox: Full support
├─ Safari: Limited (requires macOS 15.1+)
└─ Mobile: Limited (Android Chrome only)
```

### Default Button Mapping (Customizable)

```
PLAYSTATION 5 (DualSense) LAYOUT:

  △           ← SWITCH PLAYER
  ◯ ✕ ☐       ← PASS / SHOOT / SPRINT
  ◯ = Pass (Hold for more power/accuracy)
  ✕ = Shoot (Hold for power meter)
  ☐ = Sprint (Hold to accelerate)
  ◯ = Tackle/Defend (LB in defend, RB attacking)

    L1/R1          ← TEAM SELECTION / CAMERA
    L1 = Cycle team players (next)
    R1 = Cycle team players (prev)
    
    L2/R2          ← DIRECTIONAL / PRECISION
    L2 = Adjust pass power (0-100%)
    R2 = Shooting accuracy (aim)
    
    L3/R3          ← DIRECTIONAL & MOVEMENT
    L3 = Player movement (stick)
    R3 = Player facing/rotation (stick)
    
    D-Pad          ← TACTICAL COMMANDS
    ↑ = Play out from back (hold)
    ↓ = Park the bus (defensive)
    ← = Wing play (wide passing)
    → = Direct passing (aggressive)
    
    Start / Options ← MENU / PAUSE
    Start = Pause match
    Options = Open menu (Settings, Formation, etc)
    
    Share / Create  ← CAPTURE / RECORD
    Share = Screenshot
    Create = Start/stop recording

XBOX CONTROLLER LAYOUT (Similar Mapping):

Buttons:
  Y = Switch Player
  A = Pass
  X = Shoot
  B = Sprint
  
Triggers:
  LT = Adjust power
  RT = Aim/Precision
  
Sticks:
  Left = Movement
  Right = Facing/Rotation
  
Bumpers:
  LB = Team cycle (prev)
  RB = Team cycle (next)
```

### Analog Stick Sensitivity & Dead Zone

```
GAMEPAD SETTINGS:

Dead Zone Configuration:
├─ Left Stick Dead Zone: 0-20% (default: 10%)
│  ├─ Controls player movement
│  ├─ Lower = more sensitive (harder to hold straight)
│  └─ Higher = less twitchy (less precision)
│
├─ Right Stick Dead Zone: 0-20% (default: 8%)
│  ├─ Controls player facing / shot aim
│  ├─ Lower = more precise aiming
│  └─ Higher = more forgiving
│
└─ Analog Stick Acceleration:
   ├─ Linear (stick distance = exact movement)
   ├─ Curved (slight stick = small move, full stick = full move)
   └─ Aggressive (fast acceleration curve)

Trigger Sensitivity:
├─ Pass Power: How much trigger press = power %
│  ├─ Sensitive: 10% press = 50% power
│  ├─ Balanced: 10% press = 20% power (default)
│  └─ Resistant: 10% press = 10% power
│
└─ Shot Accuracy: Trigger responsiveness
   ├─ Sensitive: Small trigger = big aim change
   └─ Resistant: Big trigger = small aim change

Haptic / Rumble Settings:
├─ Feedback Intensity: 0-100% (default: 75%)
├─ Rumble on: Pass completion, tackle, goal, injury
├─ Adaptive Triggers: ✓ Enabled (DualSense only)
│  └─ Resistance increases as shot power builds
└─ Motor Balance: Left/Right rumble intensity ratio
```

---

## Input Buffering System

### Frame-Based Input Queue

```
INPUT BUFFERING WINDOW (120ms = 7 frames @ 60Hz)

Current Frame: 523 (Server Tick)

Client Timeline:
├─ Frame 520: No input
├─ Frame 521: Player holds LT (pass power) [BUFFERED]
├─ Frame 522: Player still holding LT [BUFFERED]
├─ Frame 523: Player presses X (shoot) [CURRENT]
│  └─ Server receives: Shoot command at 55% power
├─ Frame 524: Player releases LT [BUFFERED]
├─ Frame 525: No input
├─ Frame 526: Player presses Y (switch) [BUFFERED]
└─ Frame 527: No input

Server Processes:
1. Frame 523: X (Shoot) @ 55% power [Executed]
2. Frame 524: LT release [Complete power meter]
3. Frame 525-526: Idle
4. Frame 526: Y (Switch Player) [Queued for Frame 526]

Network Delay: ~50ms (3 frames @ 60Hz)
├─ Client sends input 3 frames ahead
├─ Server receives, executes, responds
├─ Total latency: 50ms + render = ~67ms (1 frame visible)
└─ Player experiences minimal input lag

Buffer Overflow Protection:
├─ Max buffer: 10 frames (166ms @ 60Hz)
├─ If exceeded: Warn player ("High latency detected")
├─ Oldest inputs discarded (prevent stale actions)
└─ Queue resets on critical action (e.g., match pause)
```

### Input Conflict Resolution

```
SIMULTANEOUS INPUT HANDLING:

Example 1: LT (Power) + X (Shoot) Simultaneously
├─ Frame 523: LT pressed (0-100ms hold)
├─ Frame 523: X pressed at 50ms into LT
├─ Interpretation: Shoot with 50% power (correct)
└─ Result: Shot executed at 50% power

Example 2: L1 (Cycle) + R1 (Cycle) Simultaneously
├─ Frame 523: L1 pressed
├─ Frame 523: R1 pressed (same frame, within 20ms)
├─ Conflict: Can't cycle both directions
├─ Resolution: R1 takes priority (most recent)
└─ Result: Cycle backwards

Example 3: L3 (Movement) + R2 (Aim) Simultaneously
├─ Frame 523: L3 pushed (left)
├─ Frame 523: R2 pressed (right stick aim)
├─ Interpretation: Move left AND aim simultaneously (allowed)
├─ No conflict (different actions)
└─ Result: Both actions execute

Priority System:
1. Critical (Pass, Shoot, Switch) - Always execute
2. Modifiers (Power, Aim, Sprint) - Execute if primary allows
3. Optional (Tactical, Camera) - Skip if conflicts
```

---

## Latency Feedback UI

### Real-Time Latency Indicator

```
IN-MATCH LATENCY DISPLAY (Top-Right Corner)

┌──────────────────────────────┐
│ LATENCY: 45ms  🟢 Excellent   │
│                               │
│ Network: ▁▂▃▄▅ Stable         │
│ Frames: 60 FPS ✓ Smooth       │
│ Buffer: 1/10 inputs queued    │
│                               │
│ [Details ▼]                   │
└──────────────────────────────┘

Color Coding:
🟢 Green (< 50ms): Excellent - No noticeable lag
🟡 Yellow (50-100ms): Good - Slight input delay
🟠 Orange (100-150ms): Fair - Noticeable lag
🔴 Red (150ms+): Poor - Significant delay

Status Descriptions:
├─ Excellent: Input feels immediate
├─ Good: Acceptable for competitive play
├─ Fair: Playable but challenging
└─ Poor: Consider closing background apps / switching internet
```

### Network Statistics Panel (Debug Mode)

```
ADVANCED NETWORK STATS (Settings → Network):

┌──────────────────────────────┐
│ NETWORK DIAGNOSTICS          │
├──────────────────────────────┤
│                              │
│ RTT (Round Trip Time):       │
│ ├─ Average: 45ms            │
│ ├─ Min: 42ms                │
│ ├─ Max: 78ms                │
│ └─ Stability: ▂▃▂▂▃▂ (Good)  │
│                              │
│ Packet Loss:                 │
│ ├─ Current: 0.2%            │
│ ├─ Session: 0.5%            │
│ └─ Status: ✓ Negligible     │
│                              │
│ Jitter (Latency Variance):   │
│ ├─ Current: 8ms             │
│ ├─ Average: 12ms            │
│ └─ Status: ✓ Acceptable     │
│                              │
│ Upload Speed:                │
│ ├─ Current: 2.3 Mbps        │
│ ├─ Average: 2.5 Mbps        │
│ └─ Status: ✓ Sufficient     │
│                              │
│ Input Queue:                 │
│ ├─ Buffered: 1 input        │
│ ├─ Max reached: Never       │
│ └─ Status: ✓ Low queue      │
│                              │
│ Server Region:               │
│ ├─ Current: US-East         │
│ ├─ Distance: 250 miles      │
│ └─ Recommended: US-East ✓   │
│                              │
└──────────────────────────────┘
```

### Input Lag Warning System

```
LATENCY WARNINGS (Triggered Automatically):

Warning 1: "High Input Latency"
├─ Trigger: Latency > 100ms for 10+ seconds
├─ Display: Orange badge + notification
├─ Recommendation: "Consider pausing or checking internet"
├─ Action: Optional pause / forfeit option
└─ Disappears when latency < 75ms

Warning 2: "Packet Loss Detected"
├─ Trigger: Packet loss > 5% in 30-second window
├─ Display: Red badge + warning tone
├─ Recommendation: "Network unstable - may disconnect"
├─ Action: Automatic pause (give time to stabilize)
└─ Auto-resume when stable (< 1% loss)

Warning 3: "Input Buffer Full"
├─ Trigger: 7+ inputs queued (110ms+)
├─ Display: Yellow warning + queue visualization
├─ Recommendation: "Too many buffered inputs - try fewer commands"
├─ Action: Show buffer queue (debug mode)
└─ Clears when queue drains

Disconnection Fallback:
├─ Connection lost for 3+ seconds
├─ Display: "Reconnecting..." with countdown (30 sec)
├─ Option: Manually reconnect or forfeit
├─ Upon reconnection: Resume from last confirmed state
└─ No XP/ranking penalty if reconnect within 30 sec
```

---

## Custom Keybind Profiles

### Keybind Editor Interface

```
SETTINGS → CONTROLS → KEYBINDS

┌─────────────────────────────────────────────┐
│ KEYBOARD KEYBIND CUSTOMIZATION              │
├─────────────────────────────────────────────┤
│                                             │
│ PROFILE: [Default] ▼                        │
│ ├─ Default (Konami-style)                  │
│ ├─ Esports (Standard)                      │
│ ├─ LPad Only (left-handed)                 │
│ ├─ RPad Only (right-handed)                │
│ └─ [+ Create New Profile]                  │
│                                             │
│ MOVEMENT:                                   │
│ ├─ Forward:  [W] ↔ Change ✎                │
│ ├─ Backward: [S] ↔ Change ✎                │
│ ├─ Left:     [A] ↔ Change ✎                │
│ └─ Right:    [D] ↔ Change ✎                │
│                                             │
│ ACTIONS:                                    │
│ ├─ Pass:     [E] ↔ Change ✎                │
│ ├─ Shoot:    [Q] ↔ Change ✎                │
│ ├─ Sprint:   [Space] ↔ Change ✎            │
│ ├─ Switch:   [R] ↔ Change ✎                │
│ └─ Tackle:   [F] ↔ Change ✎                │
│                                             │
│ MODIFIERS:                                  │
│ ├─ Power/Aim: [Shift] ↔ Change ✎           │
│ ├─ Precision: [Ctrl] ↔ Change ✎            │
│ └─ Hold Pass: [Alt] ↔ Change ✎             │
│                                             │
│ TACTICAL:                                   │
│ ├─ Cycle Team +: [Tab] ↔ Change ✎          │
│ ├─ Cycle Team -: [Shift+Tab] ↔ Change ✎    │
│ ├─ Build Up:     [U] ↔ Change ✎            │
│ └─ Defensive:    [I] ↔ Change ✎            │
│                                             │
│ [Save] [Reset to Default] [Export] [Import]│
│                                             │
└─────────────────────────────────────────────┘

When Clicking [Change ✎]:
┌──────────────────────────┐
│ Press any key...         │
│ (Press ESC to cancel)    │
│                          │
│ Current: [W]             │
└──────────────────────────┘
```

### Preset Profiles

```
PRESET PROFILES:

1. KONAMI DEFAULT (Factory Preset)
   ├─ Movement: WASD
   ├─ Actions: Q (Shoot), E (Pass), Space (Sprint)
   ├─ Power: Shift (hold)
   └─ Precision: Ctrl (hold)
   └─ Style: Traditional soccer game

2. ESPORTS COMPETITIVE
   ├─ Movement: ESDF (left hand)
   ├─ Actions: W (Shoot), R (Pass), Q (Sprint)
   ├─ Power: Shift
   └─ Precision: Ctrl
   └─ Style: Fast, one-handed possible

3. LEGACY / FIFA-STYLE
   ├─ Movement: Arrow Keys
   ├─ Actions: Z (Shoot), X (Pass), C (Sprint)
   ├─ Power: Shift
   └─ Precision: Ctrl
   └─ Style: Familiar to FIFA players

4. LEFT-HANDED (LPAD)
   ├─ Movement: IJKL
   ├─ Actions: U (Shoot), O (Pass), P (Sprint)
   ├─ Power: Shift (right hand)
   └─ Precision: Ctrl (right hand)
   └─ Style: Left hand movement + right hand actions

5. RIGHT-HANDED (RPAD)
   ├─ Movement: WASD
   ├─ Actions: Right Mouse Button (Shoot)
   ├─ Power: Right Mouse Hold
   └─ Precision: Middle Mouse
   └─ Style: Primarily mouse-based

6. ACCESSIBILITY (Large Keys)
   ├─ Movement: Numeric Pad (8/2/4/6)
   ├─ Actions: Space (Pass), Enter (Shoot), Tab (Sprint)
   ├─ Power: Spacebar hold
   └─ Precision: Shift
   └─ Style: Larger, more-spaced keys
```

### Profile Export / Import

```
EXPORT PROFILE FOR SHARING:

┌──────────────────────────────┐
│ EXPORT KEYBINDS              │
├──────────────────────────────┤
│ Profile: My Competitive Setup │
│                              │
│ [Copy to Clipboard]          │
│ [Download as File]           │
│ [Upload to Community]        │
│                              │
│ Exported Format:             │
│ movement:                    │
│   forward: W                 │
│   backward: S                │
│   left: A                    │
│   right: D                   │
│ actions:                     │
│   pass: E                    │
│   shoot: Q                   │
│   sprint: Space              │
│ ... (JSON format)            │
│                              │
└──────────────────────────────┘

IMPORT PROFILE:

┌──────────────────────────────┐
│ IMPORT KEYBINDS              │
├──────────────────────────────┤
│ [Paste Profile Code]         │
│ [Load from File]             │
│ [Browse Community Profiles]  │
│                              │
│ [Preview] [Import] [Cancel]  │
│                              │
│ Imported Profile:            │
│ ├─ Name: Competitive Setup   │
│ ├─ Author: ProPlayer123      │
│ ├─ Downloads: 1,234          │
│ ├─ Rating: ⭐⭐⭐⭐⭐           │
│ └─ [Import] [Download PDF]   │
│                              │
└──────────────────────────────┘
```

---

## Keyboard Controls (Primary)

### Full Keyboard Mapping

```
STANDARD KEYBOARD LAYOUT (WASD + Q/E):

                    ┌───┐
                    │ Q │ SHOOT
                    ├───┤
                ┌───┤ W ├───┐
                │ A │ S │ D │
                ├───┼───┼───┤
                │ E │ R │ F │
                └───┴───┴───┘
             PASS SWITCH TACKLE

DETAILED MAPPING:

Movement (Directional):
├─ W = Move forward
├─ S = Move backward  
├─ A = Move left
└─ D = Move right

Primary Actions:
├─ Q = Shoot (hold for power meter)
├─ E = Pass (hold for power/precision)
├─ Space = Sprint (hold for acceleration)
├─ F = Tackle / Defend
└─ R = Switch player

Modifiers:
├─ Shift = Hold for power/aim adjustment
├─ Ctrl = Hold for precision dribbling
└─ Alt = Hold for through ball (advanced pass)

Tactical Commands:
├─ U = Play out from back (defensive)
├─ I = Park the bus (ultra-defensive)
├─ O = Wing play (wide passing)
├─ P = Direct passing (aggressive)
├─ K = Call for pass (teammate)
└─ L = Offside trap (risky defense)

Camera / UI:
├─ C = Change camera angle
├─ Z = Zoom in/out
├─ T = Team tactics menu
└─ V = Formation adjustment

Menu / Navigation:
├─ Escape = Pause / Exit menu
├─ Tab = Player list / Stats
├─ Enter = Confirm / Select
└─ Backspace = Cancel / Go back

Macro / Quick Commands:
├─ 1-9 = Quick team presets
├─ Ctrl+S = Screenshot
└─ Ctrl+R = Restart match (training only)
```

---

## Accessibility Options

### Input Accessibility Features

```
ACCESSIBILITY SETTINGS:

Button Remapping:
├─ Allow key repeating (for pressed keys)
├─ Delay before repeat: 500-2000ms
├─ Repeat rate: 50-200ms interval
└─ Enable single-switch access (one key = context menu)

Latency Compensation:
├─ Auto-adjust buffer based on ping
├─ Slower connections get more buffer (up to 200ms)
├─ Faster connections get less buffer (minimum 50ms)
└─ Manual override available

Hold Time Adjustment:
├─ Default power meter: 0-500ms duration
├─ Extended power meter: 0-1000ms duration
├─ Instant power (no hold required): On/Off
└─ Allow power selection via multiple short presses

Aim Assistance:
├─ Auto-aim snap to nearest player: On/Off
├─ Aim slowdown (reduced rotation speed): On/Off
├─ Aim magnetism (sticky on targets): 0-50% strength
└─ Aim assist type: Soft / Medium / Hard

Visual Accessibility:
├─ High contrast mode: On/Off
├─ Colorblind mode: Deuteranopia / Protanopia / Tritanopia
├─ UI scaling: 75% - 150%
├─ Font size: Small / Normal / Large / Extra Large
├─ Screen reader support: On/Off
└─ Flashing warning: On/Off (photosensitivity)

Audio Accessibility:
├─ Visual input feedback (animations): On/Off
├─ Haptic feedback intensity: 0-100%
├─ Controller vibration: On/Off
├─ Button press audio cues: On/Off
└─ Beep on input confirmation: On/Off

Controller Accessibility:
├─ Enable one-handed play: On/Off
├─ Simplified button layout (fewer actions): On/Off
├─ Button press duration indicator: On/Off (shows hold time)
├─ Gyro sensitivity: 0-100%
└─ Custom adaptive controller mapping: [+ Create]
```

---

## Implementation

### InputController Class

```typescript
class InputController {
  private keyboardState: Map<string, boolean> = new Map();
  private gamepadState: GamepadState = {};
  private inputBuffer: InputCommand[] = [];
  private bufferMaxSize: number = 10;
  private customKeybinds: KeybindProfile = this.loadDefaultKeybinds();
  private latencyDisplay: LatencyUI;
  
  constructor() {
    this.initializeKeyboardListener();
    this.initializeGamepadPoller();
    this.setupLatencyMonitoring();
  }
  
  // Keyboard input handling
  private initializeKeyboardListener(): void {
    document.addEventListener('keydown', (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      this.keyboardState.set(key, true);
      
      // Get command from keybinds
      const command = this.mapKeyToCommand(key);
      if (command) {
        this.bufferInput(command);
      }
      
      event.preventDefault();
    });
    
    document.addEventListener('keyup', (event: KeyboardEvent) => {
      const key = event.key.toUpperCase();
      this.keyboardState.set(key, false);
      
      // Handle key release (e.g., complete power meter)
      const releaseCommand = this.mapKeyReleaseToCommand(key);
      if (releaseCommand) {
        this.bufferInput(releaseCommand);
      }
    });
  }
  
  // Gamepad polling (60 Hz)
  private initializeGamepadPoller(): void {
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads();
      
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;
        
        // Poll buttons (0-15)
        for (let j = 0; j < gamepad.buttons.length; j++) {
          const button = gamepad.buttons[j];
          const pressed = button.pressed;
          const previousState = this.gamepadState[`gamepad_${i}_button_${j}`];
          
          // Detect press/release
          if (pressed && !previousState) {
            const command = this.mapGamepadButtonToCommand(i, j);
            if (command) {
              this.bufferInput(command);
            }
          }
          
          this.gamepadState[`gamepad_${i}_button_${j}`] = pressed;
        }
        
        // Poll analog sticks
        const leftStick = {
          x: gamepad.axes[0],
          y: gamepad.axes[1],
        };
        const rightStick = {
          x: gamepad.axes[2],
          y: gamepad.axes[3],
        };
        
        // Apply dead zone
        this.applyDeadZone(leftStick, 0.1);
        this.applyDeadZone(rightStick, 0.08);
        
        // Map to commands
        const movementCommand = this.mapStickToMovement(leftStick);
        const aimCommand = this.mapStickToAim(rightStick);
        
        if (movementCommand) this.bufferInput(movementCommand);
        if (aimCommand) this.bufferInput(aimCommand);
        
        // Poll triggers (L2/R2 = axes[4]/[5])
        const l2Value = gamepad.axes[4];
        const r2Value = gamepad.axes[5];
        
        // L2 = adjust power (0-100%)
        if (l2Value > 0.1) {
          this.bufferInput({
            type: 'power',
            value: (l2Value + 1) / 2 * 100, // Convert [-1,1] to [0,100]
          });
        }
      }
      
      requestAnimationFrame(pollGamepad);
    };
    
    pollGamepad();
  }
  
  // Input buffering
  private bufferInput(command: InputCommand): void {
    // Check for conflicts
    const conflicts = this.detectConflicts(command);
    if (conflicts.length > 0) {
      this.resolveConflicts(command, conflicts);
    }
    
    // Add to buffer
    if (this.inputBuffer.length < this.bufferMaxSize) {
      this.inputBuffer.push({
        ...command,
        timestamp: Date.now(),
        frame: this.getCurrentFrame(),
      });
    } else {
      // Warn player about full buffer
      this.showBufferWarning();
      
      // Discard oldest input
      this.inputBuffer.shift();
      this.inputBuffer.push(command);
    }
    
    // Display buffered inputs (debug mode)
    if (this.isDebugMode) {
      this.displayBufferQueue();
    }
  }
  
  // Flush buffer to server
  flushBufferToServer(): void {
    if (this.inputBuffer.length === 0) return;
    
    const commands = this.inputBuffer.splice(0, this.inputBuffer.length);
    
    // Send to server (tick-locked)
    this.sendCommandsToServer(commands, {
      latency: this.currentLatency,
      timestamp: Date.now(),
    });
  }
  
  // Latency monitoring
  private setupLatencyMonitoring(): void {
    // Measure RTT every 5 seconds
    setInterval(() => {
      const startTime = Date.now();
      
      this.pingServer().then(() => {
        const rtt = Date.now() - startTime;
        this.currentLatency = rtt;
        
        // Update UI
        this.latencyDisplay.updateLatency(rtt);
        
        // Warn if high latency
        if (rtt > 100) {
          this.showLatencyWarning(rtt);
        }
      });
    }, 5000);
  }
  
  // Custom keybind loading
  private loadDefaultKeybinds(): KeybindProfile {
    return {
      movement: {
        forward: 'W',
        backward: 'S',
        left: 'A',
        right: 'D',
      },
      actions: {
        shoot: 'Q',
        pass: 'E',
        sprint: 'SPACE',
        switch: 'R',
        tackle: 'F',
      },
      modifiers: {
        power: 'SHIFT',
        precision: 'CTRL',
        throughBall: 'ALT',
      },
      tactical: {
        buildUp: 'U',
        defensive: 'I',
        wingPlay: 'O',
        direct: 'P',
      },
    };
  }
  
  // Load custom profile
  loadKeybindProfile(profileName: string): void {
    const profile = this.getProfileFromStorage(profileName);
    if (profile) {
      this.customKeybinds = profile;
      this.showNotification(`Loaded profile: ${profileName}`);
    }
  }
  
  // Save custom profile
  saveKeybindProfile(profileName: string): void {
    this.storeProfileToStorage(profileName, this.customKeybinds);
    this.showNotification(`Saved profile: ${profileName}`);
  }
  
  // Apply dead zone to analog stick
  private applyDeadZone(
    stick: { x: number; y: number },
    deadZone: number
  ): void {
    const magnitude = Math.sqrt(stick.x * stick.x + stick.y * stick.y);
    
    if (magnitude < deadZone) {
      stick.x = 0;
      stick.y = 0;
    } else {
      // Rescale to remove dead zone
      const normalizedMagnitude = (magnitude - deadZone) / (1 - deadZone);
      stick.x = (stick.x / magnitude) * normalizedMagnitude;
      stick.y = (stick.y / magnitude) * normalizedMagnitude;
    }
  }
  
  // Map key to command
  private mapKeyToCommand(key: string): InputCommand | null {
    // Search custom keybinds
    for (const [action, boundKey] of Object.entries(this.customKeybinds)) {
      if (boundKey === key) {
        return { type: action, value: 1 };
      }
    }
    
    return null;
  }
  
  // Detect input conflicts
  private detectConflicts(command: InputCommand): InputCommand[] {
    return this.inputBuffer.filter(existing => {
      // E.g., can't press both pass and shoot simultaneously
      return this.isConflict(existing.type, command.type);
    });
  }
  
  // Resolve conflicts with priority system
  private resolveConflicts(
    newCommand: InputCommand,
    conflicts: InputCommand[]
  ): void {
    const priority = {
      'shoot': 10,
      'pass': 9,
      'switch': 8,
      'power': 5,
      'aim': 4,
      'tactical': 2,
    };
    
    if ((priority[newCommand.type] || 0) > (priority[conflicts[0].type] || 0)) {
      // New command has priority, remove conflict
      this.inputBuffer = this.inputBuffer.filter(
        cmd => cmd !== conflicts[0]
      );
    }
    // Otherwise, ignore new command (existing has priority)
  }
}
```

---

## Input System Summary

✅ **Multi-Input Support**: Keyboard, gamepad (PS5/Xbox/Switch), mouse  
✅ **Input Buffering**: 100-200ms queue for smooth gameplay  
✅ **Latency Transparency**: Real-time latency display + network diagnostics  
✅ **Custom Keybinds**: 6 preset profiles + unlimited custom profiles  
✅ **Gamepad Precision**: Dead zone control, analog sensitivity, haptic feedback  
✅ **Accessibility**: High contrast, colorblind modes, button remapping, hold time adjustment  
✅ **Console Grade**: Responsive, lag-compensated, tournament-quality  

---

**Status**: Fully Designed, Implementation Ready  
**Last Updated**: January 18, 2026  
**Control Feel**: ✅ Konami Professional Grade
