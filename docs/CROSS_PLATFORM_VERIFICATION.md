# Cross-Platform Replay Verification Tool

## Vision

Replay verification is currently **platform-locked**: a match on PlayStation is only verifiable on PlayStation. This creates fragmentation and limits who can verify disputes.

**Cross-platform verification** breaks this barrier. A replay recorded on PC, verified on mobile, challenged on console. Verification proof travels **everywhere**, making Bass Ball truly decentralized.

The tool is: **One replay format. One verification standard. Any device can verify.**

---

## 1. Universal Replay Format

### 1.1 Current Problem

Different platforms store replays differently:

| Platform | Format | Issue |
|----------|--------|-------|
| PC | Custom .bsb | Only works on PC |
| Console | Proprietary binary | Requires console to read |
| Mobile | Compressed JSON | Different precision than console |
| Web | WebAssembly bytecode | Incompatible with native verification |

**Result**: A dispute can't be verified across platforms. Guardian arbiters are stuck.

### 1.2 Universal Replay Specification

Create a **platform-agnostic replay format**:

```typescript
interface UniversalReplay {
  // Metadata
  metadata: {
    replayId: string;               // UUID
    version: string;                // "1.0"
    platform: string;               // "pc" | "console" | "mobile" | "web"
    recordedAt: number;             // Unix timestamp
    
    // Hardware details (for cheating detection)
    hardwareFingerprint: string;    // Hash of device specs
    networkRegion: string;          // "us-east", "eu-west", etc
    
    // Match metadata
    matchId: string;
    playerId: string;
    opponentId: string;
    
    // Determinism verification
    physicsEngineVersion: string;   // "1.2.3"
    inputFrameRate: number;         // 60 FPS standard
    tickRate: number;               // 128 ticks/sec
    
    checksums: {
      contentHash: string;          // SHA-256 of match data
      physicsHash: string;          // SHA-256 of physics simulation
      inputHash: string;            // SHA-256 of all inputs
    };
  };

  // Match state (universal encoding)
  matchData: {
    duration: number;               // seconds
    finalScore: { team1: number, team2: number };
    
    // Frame-by-frame recording
    frames: MatchFrame[];
    
    // Event log (goal, foul, etc)
    events: MatchEvent[];
    
    // Player inputs
    inputs: PlayerInput[];
  };

  // Verification artifacts
  verificationData: {
    // Server anchor points (unchangeable reference)
    serverAnchors: ServerAnchorPoint[];
    
    // Physics constants used
    physicsConstants: PhysicsConstants;
    
    // Network packets (for latency analysis)
    networkPackets: NetworkPacketLog[];
  };

  // Signature chain (tamper detection)
  signatures: {
    clientSignature: string;        // Signed by client at match end
    serverTimestamp: number;        // When server confirmed
    serverSignature: string;        // Server validation
    blockchainAnchor: string;       // Hash on blockchain
  };
}

interface MatchFrame {
  frameNumber: number;
  timestamp: number;
  
  // Game state at this frame
  ballPosition: Vector3;
  ballVelocity: Vector3;
  
  playerPositions: {
    [playerId: string]: {
      position: Vector3;
      velocity: Vector3;
      rotation: number;
      animation: string;
    }
  };
  
  // Physics-relevant data
  touchData?: {
    playerTouched: string;
    ballVelocityBefore: Vector3;
    ballVelocityAfter: Vector3;
  };
}

interface ServerAnchorPoint {
  frame: number;
  ballPosition: Vector3;
  timestamp: number;
  confirmed: boolean;  // Server verified this frame
  signature: string;
  
  // Allows replaying from this point forward
  // If someone claims: "I didn't kick the ball here"
  // We can verify: "Server confirms you did"
}

interface PhysicsConstants {
  gravity: number;
  ballMass: number;
  ballDrag: number;
  playerAcceleration: number;
  maxPlayerSpeed: number;
  friction: number;
  spin: {
    coefficient: number;
    decayRate: number;
  };
}
```

### 1.3 Serialization

Compact, cross-platform encoding:

```typescript
class UniversalReplaySerializer {
  // Encode to binary (small file size)
  serialize(replay: UniversalReplay): Uint8Array {
    const encoder = new UniversalReplayEncoder();
    
    // Metadata (compressed)
    encoder.writeMetadata(replay.metadata);
    
    // Frame-by-frame (delta compression)
    // Only store differences from previous frame
    encoder.writeDeltaFrames(replay.matchData.frames);
    
    // Events (sparse, efficient)
    encoder.writeEvents(replay.matchData.events);
    
    // Verification data
    encoder.writeVerificationData(replay.verificationData);
    
    // Signatures
    encoder.writeSignatures(replay.signatures);
    
    return encoder.toBuffer();
  }

  // Decode from binary (works on any platform)
  deserialize(buffer: Uint8Array): UniversalReplay {
    const decoder = new UniversalReplayDecoder(buffer);
    
    return {
      metadata: decoder.readMetadata(),
      matchData: {
        duration: decoder.readDuration(),
        finalScore: decoder.readScore(),
        frames: decoder.readDeltaFrames(),    // Reconstruct from deltas
        events: decoder.readEvents(),
        inputs: decoder.readInputs(),
      },
      verificationData: decoder.readVerificationData(),
      signatures: decoder.readSignatures(),
    };
  }

  // Export to standard formats for tools
  exportToJSON(replay: UniversalReplay): string {
    return JSON.stringify(replay, null, 2);
  }

  exportToCSV(replay: UniversalReplay): string {
    // Frame-by-frame CSV for analysts
    return this.framesToCSV(replay.matchData.frames);
  }
}
```

---

## 2. Cross-Platform Verification Architecture

### 2.1 Verification Service

Single service, any platform:

```typescript
interface CrossPlatformVerificationService {
  // Input: replay (any format)
  async verifyReplay(replayData: UniversalReplay): Promise<VerificationResult> {
    // 1. Format check
    const formatValid = this.validateFormat(replayData);
    if (!formatValid) {
      return { valid: false, error: "Invalid replay format" };
    }

    // 2. Signature verification
    const signatureValid = await this.verifySignatures(replayData);
    if (!signatureValid) {
      return { valid: false, error: "Signatures don't match. Possible tampering." };
    }

    // 3. Physics simulation
    const physicsValid = await this.runPhysicsVerification(replayData);
    if (!physicsValid.valid) {
      return { valid: false, error: physicsValid.error };
    }

    // 4. Input validation
    const inputsValid = await this.validateInputs(replayData);
    if (!inputsValid.valid) {
      return { valid: false, error: inputsValid.error };
    }

    // 5. Hardware fingerprint check
    const hardwareValid = await this.checkHardwareFingerprint(replayData);

    // 6. Network packet analysis
    const networkValid = await this.analyzeNetworkPackets(replayData);

    return {
      valid: true,
      physicsCheck: physicsValid,
      inputCheck: inputsValid,
      hardwareCheck: hardwareValid,
      networkCheck: networkValid,
      forensicReport: this.generateForensicReport(replayData),
    };
  }
}
```

### 2.2 Physics Verification (Cross-Platform)

Deterministic replay simulation on any device:

```typescript
class DeterministicPhysicsSimulator {
  private physicsEngine: PhysicsEngine;
  
  async simulateReplay(replay: UniversalReplay): Promise<SimulationResult> {
    // Initialize with recorded match data
    const initialState = this.reconstructInitialState(replay);
    const recordedFrames = replay.matchData.frames;
    
    // Apply inputs frame-by-frame
    for (let i = 0; i < recordedFrames.length; i++) {
      const recordedFrame = recordedFrames[i];
      const input = replay.matchData.inputs[i];
      
      // Simulate this frame
      const simulatedFrame = this.physicsEngine.simulate(
        initialState,
        input,
        replay.verificationData.physicsConstants
      );
      
      // Compare with recorded frame
      const frameMismatch = this.compareFrames(simulatedFrame, recordedFrame);
      
      if (frameMismatch.distance > PHYSICS_TOLERANCE) {
        return {
          valid: false,
          error: `Physics mismatch at frame ${i}`,
          frame: i,
          mismatch: frameMismatch,
        };
      }
      
      // Update state for next iteration
      initialState = simulatedFrame.nextState;
    }
    
    return {
      valid: true,
      distance: 0,
      message: "Physics simulation matches recorded replay",
    };
  }

  private compareFrames(
    simulated: MatchFrame,
    recorded: MatchFrame
  ): FrameMismatch {
    // Compare ball position
    const ballDist = Vector3.distance(
      simulated.ballPosition,
      recorded.ballPosition
    );
    
    // Compare player positions
    const playerDists = [];
    for (const [playerId, sim] of Object.entries(simulated.playerPositions)) {
      const rec = recorded.playerPositions[playerId];
      playerDists.push(Vector3.distance(sim.position, rec.position));
    }
    
    return {
      ballDistance: ballDist,
      playerDistances: playerDists,
      distance: Math.max(ballDist, ...playerDists),
    };
  }
}

const PHYSICS_TOLERANCE = 0.01;  // 1cm tolerance for floating point errors
```

### 2.3 Input Validation (Cross-Platform)

```typescript
class InputValidator {
  async validateInputs(replay: UniversalReplay): Promise<InputValidationResult> {
    const inputs = replay.matchData.inputs;
    
    // Check 1: Input timing
    const timingValid = this.validateInputTiming(inputs);
    if (!timingValid.valid) {
      return { valid: false, error: "Input timing anomaly detected", ...timingValid };
    }
    
    // Check 2: Controller constraints
    const constraintsValid = this.validatePhysicalConstraints(inputs);
    if (!constraintsValid.valid) {
      return { valid: false, error: "Impossible input sequence", ...constraintsValid };
    }
    
    // Check 3: Pattern analysis (inhuman inputs)
    const patternAnalysis = this.analyzeInputPatterns(inputs);
    if (patternAnalysis.suspicionScore > 0.8) {
      return {
        valid: false,
        error: "Input pattern suggests bot or controller modification",
        suspicionScore: patternAnalysis.suspicionScore,
      };
    }
    
    return { valid: true };
  }

  private validateInputTiming(inputs: PlayerInput[]): TimingValidationResult {
    // Each input frame should be ~16.67ms apart (60 FPS)
    const expectedDelta = 1000 / 60;  // ~16.67ms
    
    for (let i = 1; i < inputs.length; i++) {
      const timeDelta = inputs[i].timestamp - inputs[i - 1].timestamp;
      
      // Allow ±5% variance (input lag, frame drop)
      if (Math.abs(timeDelta - expectedDelta) > expectedDelta * 0.05) {
        return {
          valid: false,
          anomalyAt: i,
          expectedDelta,
          actualDelta: timeDelta,
        };
      }
    }
    
    return { valid: true };
  }

  private validatePhysicalConstraints(inputs: PlayerInput[]): ConstraintValidationResult {
    // Human can't:
    // - Press 5 buttons simultaneously (controller limit)
    // - Rotate 180° in one frame (physical limit)
    // - Accelerate from 0-max speed in <200ms
    
    for (const input of inputs) {
      // Check button count
      const buttonsPressed = Object.values(input.buttons).filter(b => b).length;
      if (buttonsPressed > 5) {
        return { valid: false, error: "Impossible button count", input };
      }
      
      // Check rotation speed
      if (input.rotation && this.lastInput) {
        const rotationDelta = Math.abs(input.rotation - this.lastInput.rotation);
        if (rotationDelta > 180 * (1/60)) {  // >180° per frame
          return { valid: false, error: "Impossible rotation speed", input };
        }
      }
      
      this.lastInput = input;
    }
    
    return { valid: true };
  }

  private analyzeInputPatterns(inputs: PlayerInput[]): PatternAnalysis {
    // ML model trained on pro player inputs
    // If inputs look machine-generated, flag them
    
    const features = this.extractInputFeatures(inputs);
    const anomalyScore = this.mlModel.predict(features);  // 0-1
    
    return {
      suspicionScore: anomalyScore,
      analysis: anomalyScore > 0.7 ? "Likely bot inputs" : "Normal human input",
    };
  }
}
```

---

## 3. Verification on Any Device

### 3.1 Web-Based Verifier

No installation needed:

```typescript
// web/verifier.ts
import { UniversalReplayDeserializer } from "./replay-format";
import { CrossPlatformVerificationService } from "./verification";

class WebReplayVerifier {
  private service: CrossPlatformVerificationService;

  async verifyFromFile(file: File): Promise<VerificationResult> {
    // 1. Read file
    const buffer = await file.arrayBuffer();
    
    // 2. Deserialize (works on any platform)
    const replay = UniversalReplayDeserializer.deserialize(
      new Uint8Array(buffer)
    );
    
    // 3. Verify
    return this.service.verifyReplay(replay);
  }

  async verifyFromIPFS(ipfsHash: string): Promise<VerificationResult> {
    // Download from IPFS
    const response = await fetch(`https://ipfs.io/ipfs/${ipfsHash}`);
    const buffer = await response.arrayBuffer();
    
    // Deserialize and verify
    const replay = UniversalReplayDeserializer.deserialize(
      new Uint8Array(buffer)
    );
    return this.service.verifyReplay(replay);
  }

  async verifyFromBlockchain(txHash: string): Promise<VerificationResult> {
    // Retrieve from on-chain reference
    const ipfsHash = await this.blockchain.getIPFSHashFromTx(txHash);
    return this.verifyFromIPFS(ipfsHash);
  }
}

// Frontend component
export const ReplayVerifier = () => {
  const [result, setResult] = React.useState<VerificationResult | null>(null);

  const handleVerify = async (file: File) => {
    const verifier = new WebReplayVerifier();
    const result = await verifier.verifyFromFile(file);
    setResult(result);
  };

  return (
    <div>
      <input
        type="file"
        accept=".bsr"  // Bass Ball Replay format
        onChange={(e) => handleVerify(e.target.files[0])}
      />
      
      {result && (
        <div>
          <h2>{result.valid ? "✅ Valid" : "❌ Invalid"}</h2>
          {result.valid ? (
            <div>
              <p>Physics: ✅</p>
              <p>Inputs: ✅</p>
              <p>Hardware: ✅</p>
              <p>Network: ✅</p>
            </div>
          ) : (
            <p>{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
};
```

### 3.2 Mobile Verifier App

Native app for iOS/Android:

```swift
// iOS: ReplayVerifier.swift
import Foundation

class MobileReplayVerifier {
    let service: CrossPlatformVerificationService

    func verifyReplay(fileURL: URL) async -> VerificationResult {
        do {
            // Read file
            let data = try Data(contentsOf: fileURL)
            
            // Deserialize
            let replay = try UniversalReplayDeserializer.deserialize(data)
            
            // Verify
            return await service.verifyReplay(replay)
        } catch {
            return VerificationResult(
                valid: false,
                error: "Failed to load replay: \(error.localizedDescription)"
            )
        }
    }

    func verifyFromIPFS(hash: String) async -> VerificationResult {
        // Download and verify
        let url = URL(string: "https://ipfs.io/ipfs/\(hash)")!
        
        do {
            let data = try Data(contentsOf: url)
            let replay = try UniversalReplayDeserializer.deserialize(data)
            return await service.verifyReplay(replay)
        } catch {
            return VerificationResult(valid: false, error: error.localizedDescription)
        }
    }
}

// SwiftUI component
struct ReplayVerifierView: View {
    @StateObject var verifier = MobileReplayVerifier()
    @State var result: VerificationResult?
    @State var showFilePicker = false

    var body: some View {
        VStack {
            Button("Select Replay") {
                showFilePicker = true
            }
            .filePicker(isPresented: $showFilePicker) { fileURL in
                Task {
                    result = await verifier.verifyReplay(fileURL: fileURL)
                }
            }

            if let result = result {
                if result.valid {
                    Label("Valid", systemImage: "checkmark.circle.fill")
                        .foregroundColor(.green)
                } else {
                    Label(result.error ?? "Invalid", systemImage: "xmark.circle.fill")
                        .foregroundColor(.red)
                }
            }
        }
    }
}
```

### 3.3 Console Verifier

Works on PlayStation, Xbox, etc:

```cpp
// console/ReplayVerifier.cpp
#include "replay_format.h"
#include "verification_service.h"

class ConsoleReplayVerifier {
    CrossPlatformVerificationService* service;

public:
    VerificationResult VerifyReplay(const std::vector<uint8_t>& replayData) {
        // Deserialize (platform-agnostic)
        UniversalReplay replay;
        UniversalReplayDeserializer deserializer;
        
        if (!deserializer.Deserialize(replayData, replay)) {
            return VerificationResult{
                false,
                "Failed to deserialize replay"
            };
        }

        // Verify (deterministic, platform-independent)
        return service->VerifyReplay(replay);
    }

    VerificationResult VerifyFromFileSystem(const wchar_t* filePath) {
        // Load file
        std::vector<uint8_t> data = LoadFileFromStorage(filePath);
        return VerifyReplay(data);
    }
};
```

---

## 4. Verification Proof Portability

### 4.1 Universal Verification Certificate

```typescript
interface VerificationCertificate {
  certificateId: string;
  replayId: string;
  
  // What was verified
  verifiedAt: number;
  verifiedBy: string;  // "blockchain", "guardian", "api"
  
  // Result
  result: "valid" | "invalid";
  issues: string[];
  
  // Proof
  publicKey: string;          // Who signed this
  signature: string;          // Signature of verification result
  
  // Portability
  ipfsHash: string;           // Where verification is stored
  blockchainHash: string;     // Anchor on blockchain
  
  // Can be re-verified
  reVerifiable: true;
  
  // Expiry (certificates can expire, requiring re-verification)
  expiresAt: number;
}

// Guardian uses certificate from web verifier on blockchain
const certificateFromWeb = await webVerifier.getVerificationCertificate(replayId);
const certificateFromBlockchain = await blockchain.getCertificate(replayId);
// Both are the same ✓
```

### 4.2 Replay Portability Workflow

```typescript
class ReplayPortability {
  // Player records on PlayStation
  async recordOnConsole(match: Match): Promise<ReplayReference> {
    const replay = match.createReplay();
    const universalFormat = UniversalReplaySerializer.serialize(replay);
    
    // Upload to IPFS (decentralized storage)
    const ipfsHash = await ipfs.upload(universalFormat);
    
    // Anchor on blockchain
    const txHash = await blockchain.submitIPFSHash(ipfsHash);
    
    return {
      replayId: replay.id,
      ipfsHash,
      blockchainTx: txHash,
      platform: "console",
    };
  }

  // Guardian verifies on PC
  async verifyOnPC(replayRef: ReplayReference): Promise<VerificationResult> {
    // Download from IPFS
    const data = await ipfs.download(replayRef.ipfsHash);
    
    // Deserialize (cross-platform)
    const replay = UniversalReplayDeserializer.deserialize(data);
    
    // Verify (PC is just another verifier)
    return this.verificationService.verifyReplay(replay);
  }

  // Attacker disputes on mobile
  async challengeOnMobile(replayRef: ReplayReference): Promise<DisputeResponse> {
    // Can also verify on mobile
    const data = await ipfs.download(replayRef.ipfsHash);
    const replay = UniversalReplayDeserializer.deserialize(data);
    
    // Challenge with evidence
    return {
      challengeReason: "Physics inconsistency",
      evidence: await this.findAnomalies(replay),
    };
  }
}
```

---

## 5. Open Verification API

### 5.1 Public API Endpoint

```typescript
// api/replay-verification

app.post("/api/verify/replay", async (req, res) => {
  const { replayFile, ipfsHash, blockchainTx } = req.body;

  let replayData;
  
  if (replayFile) {
    replayData = Buffer.from(replayFile, 'base64');
  } else if (ipfsHash) {
    replayData = await ipfs.download(ipfsHash);
  } else if (blockchainTx) {
    const hash = await blockchain.getIPFSHashFromTx(blockchainTx);
    replayData = await ipfs.download(hash);
  }

  const replay = UniversalReplayDeserializer.deserialize(replayData);
  const result = await verificationService.verifyReplay(replay);

  // Return verification certificate
  const certificate = await issueVerificationCertificate(result, replay.id);

  res.json({
    valid: result.valid,
    result,
    certificate,
  });
});

// Get verification by ID
app.get("/api/verify/:replayId", async (req, res) => {
  const certificate = await database.getVerificationCertificate(req.params.replayId);
  res.json(certificate);
});

// Batch verify multiple replays
app.post("/api/verify/batch", async (req, res) => {
  const { replayIds } = req.body;
  
  const results = await Promise.all(
    replayIds.map(id => verificationService.verifyReplay(id))
  );

  res.json(results);
});
```

### 5.2 Verification API Usage Examples

```typescript
// Analyst wants to verify a replay
const response = await fetch("https://bassball.io/api/verify/replay", {
  method: "POST",
  body: JSON.stringify({
    blockchainTx: "0x1234...abcd",  // From dispute transaction
  }),
});

const { valid, result, certificate } = await response.json();

console.log(`Replay is ${valid ? "valid" : "INVALID"}`);
console.log(certificate);  // Reusable across platforms

// Developer integrates into their tool
const verifyReplay = async (ipfsHash: string) => {
  const res = await fetch("https://bassball.io/api/verify/replay", {
    method: "POST",
    body: JSON.stringify({ ipfsHash }),
  });
  return res.json();
};
```

---

## 6. Implementation Architecture

### 6.1 Replay Format Library

```typescript
// replay-format.ts
export class UniversalReplayFormat {
  static MAGIC_NUMBER = 0xB5BA; // "B5BA" = "Bass Ball"
  static VERSION = 1;
  static FRAME_COMPRESSION = "delta";

  static serialize(replay: UniversalReplay): Uint8Array {
    const buffer = new BinaryWriter();

    // Header
    buffer.writeUint16(this.MAGIC_NUMBER);
    buffer.writeUint8(this.VERSION);
    
    // Metadata
    buffer.writeString(replay.metadata.replayId);
    buffer.writeUint32(replay.metadata.recordedAt);
    buffer.writeString(replay.metadata.platform);

    // Checksum (for integrity)
    const checksumPosition = buffer.position();
    buffer.writeUint32(0); // Placeholder

    // Content
    buffer.writeUint32(replay.matchData.frames.length);
    for (const frame of replay.matchData.frames) {
      this.writeFrameDelta(buffer, frame, this.lastFrame);
      this.lastFrame = frame;
    }

    // Write actual checksum
    const checksum = this.calculateChecksum(buffer.data());
    buffer.writeAtPosition(checksumPosition, checksum);

    // Signatures
    buffer.writeString(replay.signatures.clientSignature);
    buffer.writeString(replay.signatures.serverSignature);

    return buffer.data();
  }

  static deserialize(data: Uint8Array): UniversalReplay {
    const reader = new BinaryReader(data);

    // Verify header
    const magic = reader.readUint16();
    if (magic !== this.MAGIC_NUMBER) {
      throw new Error("Invalid replay format");
    }

    const version = reader.readUint8();
    if (version !== this.VERSION) {
      throw new Error(`Unsupported version: ${version}`);
    }

    // Read metadata
    const metadata = {
      replayId: reader.readString(),
      recordedAt: reader.readUint32(),
      platform: reader.readString(),
      // ... other metadata
    };

    // Read frames
    const frameCount = reader.readUint32();
    const frames: MatchFrame[] = [];
    let lastFrame: MatchFrame | null = null;

    for (let i = 0; i < frameCount; i++) {
      const frame = this.readFrameDelta(reader, lastFrame);
      frames.push(frame);
      lastFrame = frame;
    }

    // Read signatures
    const signatures = {
      clientSignature: reader.readString(),
      serverSignature: reader.readString(),
    };

    return {
      metadata,
      matchData: { frames, /* ... */ },
      signatures,
    };
  }
}
```

### 6.2 Database Schema

```sql
CREATE TABLE universal_replays (
  id UUID PRIMARY KEY,
  match_id UUID REFERENCES matches(id),
  
  -- Serialized replay data (binary)
  replay_data BYTEA,
  
  -- Metadata (indexed for search)
  platform VARCHAR(50),
  recorded_at TIMESTAMP,
  
  -- Hashes (for integrity)
  content_hash VARCHAR(64),
  physics_hash VARCHAR(64),
  input_hash VARCHAR(64),
  
  -- Signatures (for verification)
  client_signature TEXT,
  server_signature TEXT,
  
  -- Storage locations
  ipfs_hash VARCHAR(100),
  blockchain_tx VARCHAR(100),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE verification_certificates (
  id UUID PRIMARY KEY,
  replay_id UUID REFERENCES universal_replays(id),
  
  -- Verification result
  valid BOOLEAN,
  issues JSONB,
  
  -- Proof
  verified_at TIMESTAMP,
  verified_by VARCHAR(50),  -- "web", "mobile", "api", etc
  
  -- Signature of this certificate
  signature TEXT,
  public_key TEXT,
  
  -- IPFS/blockchain storage
  ipfs_hash VARCHAR(100),
  blockchain_anchor VARCHAR(100),
  
  -- Expiry
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_verification_replay ON verification_certificates(replay_id);
CREATE INDEX idx_universal_ipfs ON universal_replays(ipfs_hash);
```

---

## 7. Why This Matters

**Cross-platform verification breaks the platform-lock jail:**

1. **Decentralized Verification**: Anyone can verify replays anywhere
2. **Content Creator Tools**: YouTubers can analyze matches in detail
3. **Third-Party Integration**: External analytics platforms can verify
4. **Guardian Independence**: Arbiters don't trust one platform vendor
5. **Long-Term Accessibility**: Replays survive platform changes

---

## 8. Roadmap

### Phase 1: Format Specification (Month 1)
- [ ] Universal replay format design
- [ ] Serialization library
- [ ] Test vectors (ensure consistency)

### Phase 2: Verification Implementation (Months 2-3)
- [ ] Physics verification engine
- [ ] Input validation system
- [ ] Hardware fingerprinting

### Phase 3: Cross-Platform Tools (Months 4-5)
- [ ] Web verifier
- [ ] Mobile apps (iOS/Android)
- [ ] Console integration

### Phase 4: API & Integration (Months 6+)
- [ ] Public verification API
- [ ] Third-party integrations
- [ ] Content creator tools

---

## Conclusion

Cross-platform replay verification is the **infrastructure pillar** that enables ecosystem trust without central authority. It ensures:

- Replays are portable
- Verification is universal
- No single platform controls proof
- Guardians can verify on any device
- Content creators can build tools

By 2027, a replay recorded on PlayStation can be verified on iOS, analyzed on PC, and anchored on Ethereum—**all proving the same truth**.

