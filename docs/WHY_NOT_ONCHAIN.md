# Why Not Everything On-Chain?

A pragmatic defense of hybrid architecture.

---

## The Question

"If this is Web3, why isn't everything on the blockchain?"

**Answer**: Because trustlessness ≠ everything on-chain. We solve trust problems with the minimum chain footprint required.

---

## Cost Analysis: The Impossible Economics

### Match Replay Storage (Full On-Chain)

**Scenario**: Store all 5,400 match ticks on-chain

- Bytes per tick: ~90 bytes (input + state hash)
- Total per match: 5,400 × 90 = 486 KB
- Base gas per 4KB stored: ~$0.50
- **Cost per replay**: 486 KB / 4 KB × $0.50 = **$60.75**

**At scale**:
- 50k matches/day (10k DAU × 5 matches each)
- Daily cost: 50k × $60.75 = **$3.04M/day**
- Monthly cost: **$91M/month**

**Revenue at same scale**: $130k/month

**Conclusion**: Full on-chain storage is **700x more expensive** than revenue. Economically impossible.

### Why This Matters

If Bass Ball burned $91M/month on storage, we'd:
- ❌ Need venture capital to survive (breaks Web3 principle of sustainability)
- ❌ Become dependent on token inflation (pay-to-play eventually)
- ❌ Fail before reaching profitability

---

## Trust Model: Why Hash-Based Verification Works

### Full On-Chain Storage

```
Replays on-chain
  ↓
Anyone can read
  ↓
100% auditable
```

**Cost**: $91M/month  
**Trust**: Perfect

### Hash-Based (Current)

```
Replays on IPFS (pinned 3x)
  ↓
Hash stored on-chain
  ↓
Anyone can verify: hash(replay) == onchain_hash
  ↓
Fraud detection if hash differs
```

**Cost**: $0.01/replay  
**Trust**: 99.9% (replay tampering detected instantly)

### Risk Analysis

**Scenario**: Server deletes replay, falsifies on-chain hash
- Player disputes match result
- Game provides IPFS replay
- Anyone recomputes hash
- If hash ≠ on-chain: **server is caught cheating**
- Proof is on-chain forever

**Why this works**: You can't change the on-chain hash retroactively. Blockchain is immutable.

---

## What IS On-Chain (Complete List)

Bass Ball records these on-chain:

| Data | Size | Cost | Purpose |
|------|------|------|---------|
| Match ID | 32 bytes | - | Lookup key |
| Result hash | 32 bytes | - | Proof of outcome |
| Replay hash | 32 bytes | - | Proof of execution |
| IPFS CID | 46 bytes | - | Link to full replay |
| Player stats delta | ~20 bytes | - | ELO change |
| Timestamp | 8 bytes | - | Ordering |
| **Total per match** | **170 bytes** | **~$0.01** | **Verifiable proof** |

**At 50k matches/day**: 50k × $0.01 = **$500/day** ($15k/month) ✅

---

## What is NOT On-Chain (And Why)

### Match Replay Data

- **Why not**: 486 KB/match × 50k/day = infeasible
- **Alternative**: Pinned on IPFS (3x redundancy)
- **Verification**: Hash chain-verified
- **Trust level**: 99.9% (tampering detected)

### Player Card Metadata

- **Why not**: Metadata is mutable (new art, descriptions)
- **Alternative**: Stored on IPFS, linked via ERC721 metadata URI
- **Verification**: IPFS hash in contract immutable
- **Trust level**: 100% (content addressed by hash)

### Real-Time Match State

- **Why not**: 16ms updates × 5400 ticks = 90k transactions/match
- **Alternative**: Server-authoritative with hash broadcast
- **Verification**: Replay verification after match
- **Trust level**: 100% (deterministic replay)

### Leaderboard Rankings

- **Why not**: Updates 1000x/day, would cost millions
- **Alternative**: Graph subgraph indexes on-chain events
- **Verification**: Auditable from on-chain base data
- **Trust level**: 100% (derived from chain data)

---

## The Verification Guarantee

Any player can prove any match was fair:

```bash
# 1. Download replay from IPFS
replay = ipfs.get("QmXxxx...")

# 2. Download on-chain match record
record = contract.getMatch(matchId)

# 3. Re-simulate match locally
result = engine.simulate(replay.inputs, replay.seed)

# 4. Compute hash
computed_hash = keccak256(result)

# 5. Verify
if computed_hash == record.replayHash:
  ✅ Match is valid (no server cheating)
else:
  ❌ Fraud detected (server modified result)
```

**This works because**:
- ✅ Replay hash is immutable on-chain
- ✅ Deterministic engine produces same output
- ✅ Anyone with replay file can verify
- ✅ No trust required (math proves it)

---

## Comparison with Alternatives

### Mainnet (Store Everything)

| Metric | Bass Ball | Mainnet | Difference |
|--------|-----------|---------|-----------|
| Gas cost per match | $0.01 | $65 | **6500x cheaper** |
| Replay accessibility | IPFS | On-chain | IPFS 2x availability |
| Verification | Hash-based | Direct read | Hash just as secure |
| Scalability | 50k matches/day | 5 matches/day | **10,000x better** |

### Fully Centralized

| Metric | Bass Ball | Centralized | Difference |
|--------|-----------|-------------|-----------|
| Server trust required | ❌ No | ✅ Yes | **Bass Ball wins** |
| Replay verifiable | ✅ Yes | ❌ No | **Bass Ball wins** |
| Cost | ~$3-5k/month | Similar | Neutral |
| Regulatory risk | Low | High | **Bass Ball safer** |

### Sidechain (100% Off-Chain)

| Metric | Bass Ball | Sidechain | Difference |
|--------|-----------|-----------|-----------|
| On-chain guarantees | ✅ Yes | ❌ No | **Bass Ball stronger** |
| Cost | Low | Very low | Sidechain cheaper |
| Trust assumptions | Base Chain | Sidechain validators | **Bass Ball more trustless** |

---

## Future Upgrades (Without Breaking Change)

### Phase 3: ZK Proofs

Current: Hash-based verification  
Future: ZK-compressed proofs

```
5400-tick match
  ↓
ZK circuit processes all ticks
  ↓
Single ~1KB ZK proof
  ↓
On-chain verification
  ↓
Cost: $0.001 (100x cheaper)
```

**Benefit**: Eliminate IPFS dependency  
**Timing**: When ZK tooling matures (2025-2026)  
**Compatibility**: Transparent upgrade (no player impact)

---

## The Philosophy

**Trustlessness ≠ Everything on-chain**

Trustlessness = **No single point of failure**

Bass Ball achieves this with:
1. **On-chain hash** as immutable proof
2. **IPFS replicas** for availability
3. **Deterministic engine** for verifiability
4. **Anyone can audit** at any time

This costs $15k/month instead of $91M/month.

**That's the difference between sustainable and impossible.**

---

## Questions & Answers

**Q: What if Pinata deletes the replay?**  
A: We pin on 3 systems (Pinata, Web3.Storage, ArWeave). For the match to be lost, all 3 must delete simultaneously. If they do, the on-chain hash proves the original content → player can re-pin if they downloaded the replay.

**Q: Can a server lie about the hash?**  
A: No. The hash is on-chain. To change it, they'd need to modify the blockchain (impossible without 51% attack).

**Q: What about blockchain rollback?**  
A: Base Chain is an Arbitrum optimistic rollup. Rollbacks are extremely rare and require validator consensus. In 99.99% of cases, the hash is final in ~1 minute.

**Q: Why not use Arweave instead of IPFS?**  
A: We use both. Arweave is permanent but costs $0.10/KB. IPFS is cheaper. Redundancy is the goal.

**Q: Can you upgrade this later?**  
A: Yes. The on-chain format is stable. We can add ZK proofs, change pinning strategies, or move to other networks without breaking verification.

---

## Conclusion

The hash-based model is:
- ✅ **Trustless** (verifiable without trusting anyone)
- ✅ **Economical** (sustainable at scale)
- ✅ **Auditable** (anyone can verify)
- ✅ **Upgradeable** (compatible with future improvements)
- ✅ **Secure** (immutable on-chain hash)

It's not "everything on-chain"—it's **everything verifiable**.

That's the Web3 promise. Not gas bills. Verification.
