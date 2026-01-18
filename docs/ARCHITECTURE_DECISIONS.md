# Architecture Decision Records (ADR)

This document tracks major architectural decisions and their rationale.

---

## ADR-001: Server-Authoritative Match Engine

**Status**: Accepted (Jan 2026)

### Context
- Real-time competitive gameplay requires low latency
- Client-side calculations can be hacked (memory dumps, packet injection)
- Web3 games often try full client prediction → enables cheating

### Decision
Implement **server-authoritative** match engine:
- Clients send inputs only (MOVE, PASS, SHOOT, etc.)
- Server simulates all physics, collision, scoring
- Server broadcasts game state hash (not full state)
- Clients render from server-provided state

### Consequences
- **Pro**: Impossible to hack stats, cheat physics
- **Pro**: Deterministic → verifiable replays
- **Con**: 60Hz network requirement (manageable on Base)
- **Con**: No offline play (acceptable trade for fairness)

### Alternatives Considered
- Full client-side simulation: Rejected (enables cheating)
- Hybrid validation: Rejected (complexity without security gain)
- Blockchain-recorded ticks: Rejected (too expensive: 5400 ticks/match × 20k gas = infeasible)

---

## ADR-002: Deterministic RNG via Blockhash

**Status**: Accepted (Jan 2026)

### Context
- Traditional RNG (Math.random()) is hackable on client
- Blockchain RNG (Chainlink VRF) costs $0.25 per request
- Need reproducibility for replays: same seed = same random sequence

### Decision
Seed match RNG with **Base blockhash** at match start:
```typescript
const seed = keccak256(blockhash(blockNumber)) + matchId
const rng = seededRandom(seed) // Deterministic sequence
```

### Consequences
- **Pro**: Zero cost (blockhash is free on-chain)
- **Pro**: Verifiable (anyone can reproduce)
- **Pro**: Cannot be manipulated (locked to Ethereum PoW)
- **Con**: Small predictability window (but too expensive to exploit)

### Alternatives Considered
- Chainlink VRF: Too expensive at scale ($0.25 × 50k matches/day = $12.5k/day)
- Oracle-based: Centralized trust point
- Client-side + server validation: Doesn't actually prevent RNG hacks

---

## ADR-003: IPFS for Replay Storage (Not On-Chain)

**Status**: Accepted (Jan 2026)

### Context
- Full match replay = ~500KB (5400 ticks × 90 bytes/tick)
- Base gas cost = $0.50 per 4KB stored → $62.50/replay on-chain
- At 50k matches/day = $3.1M/day (unsustainable)

### Decision
Store replays on **IPFS via Pinata**, record only **hash on-chain**:
- Replay saved to IPFS → CID returned
- Match record stores: `{ replayHash, resultHash, ipfsCid, timestamp }`
- Cost: ~$0.01/replay (IPFS pinning) vs $62.50 (on-chain storage)

### Consequences
- **Pro**: 6,000x cheaper ($0.01 vs $62.50)
- **Pro**: Replays still verifiable (hash on-chain proves integrity)
- **Pro**: Auditable (hash can't change without detection)
- **Con**: IPFS availability risk (mitigated by 3x pinning: Pinata, Web3.Storage, ArWeave)

### Alternatives Considered
- Full on-chain storage: Rejected (economically infeasible)
- Centralized server: Rejected (breaks trustlessness)
- State channels: Rejected (complexity for one-time use)

---

## ADR-004: ERC-4337 Paymaster for Gasless UX

**Status**: Accepted (Jan 2026)

### Context
- New players have 0 ETH → can't pay gas
- Asking for wallet setup before first match kills adoption
- Traditional faucets are capital inefficient

### Decision
Deploy **ERC-4337 Paymaster** to sponsor gas:
- Player plays as guest (no wallet needed)
- Match result recorded → paymaster covers tx gas
- Free limit: 1 NFT mint per account (prevents abuse)

### Consequences
- **Pro**: Zero friction onboarding (instant play)
- **Pro**: ERC-4337 standard (future-proof)
- **Pro**: Capturable via gameplay (not pure subsidy)
- **Con**: $48k/month at 10k DAU (business cost)
- **Con**: Requires trusted Paymaster (we run it, could be DAO-governed)

### Alternatives Considered
- Traditional faucet: Less transparent, worse UX
- Require MetaMask: Kills 80% of potential players
- Batch payments (let users save gas): Still requires initial wallet

---

## ADR-005: 7-Layer Input Validation (No Single Point)

**Status**: Accepted (Jan 2026)

### Context
- Single validation layer is bypassable (bugs happen)
- Network packets can be replayed or modified
- Bot farms try thousands of variations

### Decision
Implement **7 independent validation layers**:
1. Timestamp bounds (±200ms from server time)
2. Tick monotonicity (ticks never decrease)
3. Action type enum (MOVE, PASS, etc. only)
4. Parameter bounds (speed 0-100, angle 0-360, etc.)
5. Rate limiting (max 10 inputs/100ms)
6. Physics feasibility (can't move 500px in 1 frame)
7. Bot pattern detection (statistical timing analysis)

Each layer is independently sufficient to block cheating. No single bug breaks security.

### Consequences
- **Pro**: Defense in depth
- **Pro**: One layer can fail without system compromise
- **Con**: Slight performance overhead (mitigated by early-exit)

---

## ADR-006: Tick-Based Anti-Cheat (Not Real-Time)

**Status**: Accepted (Jan 2026)

### Context
- Real-time validation (per-input) is noisy and prone to false positives
- Deterministic engine repeats ticks → can analyze patterns
- Humans play in ~100ms windows; bots play in <10ms (detectable)

### Decision
Validate at **tick granularity** (16ms windows, not per-input):
- Max 5 inputs per 12-tick window (80ms)
- Analyze timing distribution (bots are regular, humans are noisy)
- Flag accounts with <2% timing jitter

### Consequences
- **Pro**: Fewer false positives (humans have natural variance)
- **Pro**: Works offline (validate after match)
- **Pro**: Provable (tick-based analysis is reproducible)
- **Con**: Slight delay in catching extreme cheaters (acceptable)

---

## ADR-007: Governance Safety Rails (Immutable Core)

**Status**: Accepted (Jan 2026)

### Context
- DAO governance can be captured (1-whale, 1-vote attacks)
- Pay-to-win proposals are profitable for whales but destroy game
- Some parameters MUST be immutable

### Decision
Partition contract state into **Mutable** and **Immutable** tiers:

**Immutable** (DAO cannot change):
- Match physics (accel, max speed, etc.)
- Player stat formulas
- Anti-cheat thresholds
- RNG sources

**Mutable** (DAO can vote on):
- Tournament formats
- Cosmetic themes
- Seasonal rewards
- Team partnerships

Immutable tier enforced in code (no upgrade path).

### Consequences
- **Pro**: Prevents governance capture
- **Pro**: Builds player trust
- **Con**: Requires careful design upfront (can't fix bad physics later)

---

## ADR-008: Deterministic Simulation Over ZK Proofs (Phase 1)

**Status**: Accepted (Jan 2026)

### Context
- ZK proofs would eliminate replay storage cost
- But ZK infrastructure is immature (Circom, slow proof generation)
- Deterministic replays are good enough for now

### Decision
Ship Phase 1 with **replay hashes**. Add ZK proofs in Phase 3 when:
- ZK tooling matures (Risc0, Polygon Miden)
- We have real usage data
- Cost savings justify engineering effort

### Consequences
- **Pro**: Simpler, faster to launch
- **Pro**: Replay hashes are still trustless
- **Pro**: Can upgrade to ZK without breaking compatibility
- **Con**: Higher storage costs in Phase 1 (but manageable)

---

## ADR-009: Base Chain (Not Mainnet)

**Status**: Accepted (Jan 2026)

### Context
- Mainnet gas: $50+ per transaction
- Arbitrum/Optimism: $0.10-0.20 per transaction
- Base: $0.05-0.10 per transaction + Coinbase ecosystem

### Decision
Launch on **Base** as primary chain:
- Lowest gas costs (benefits players)
- Coinbase integration (mainstream audience)
- Strong community support

Prepare for multi-chain in Phase 4 (Arbitrum, Optimism, Polygon).

### Consequences
- **Pro**: Lowest player costs
- **Pro**: Marketing tie-in with Coinbase
- **Con**: Basechain risk (though minimal, Arbitrum-based)

---

## ADR-010: Incremental Feature Shipping (Not Big Bang)

**Status**: Accepted (Jan 2026)

### Context
- Big-bang releases have catastrophic downside (launch bugs)
- Incremental shipping allows learning from real players
- Web3 infrastructure evolves quickly

### Decision
Follow **Phase 1 → 5** plan:
1. Core gameplay (done)
2. Governance (Q2)
3. Competitive (Q3)
4. Social (Q4)
5. Mobile + expansion (2025)

Each phase is independent and shippable.

### Consequences
- **Pro**: Reduces risk
- **Pro**: Capital efficient (learn before investing in advanced features)
- **Pro**: Team can iterate based on feedback
- **Con**: Market sees roadmap not launch (but more credible)

---

## Future ADRs

- ADR-011: Multi-validator consensus (Phase 3)
- ADR-012: ZK match proofs (Phase 3)
- ADR-013: Cross-chain identity (Phase 4)
- ADR-014: Decentralized match hosting (Phase 5)
