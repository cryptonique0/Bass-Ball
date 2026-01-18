# Bass Ball Anti-Pay-To-Win Guarantee

**A Public Pledge**

---

## The Guarantee

Bass Ball will **never** have stat-affecting purchases. Period.

This document outlines what that means, how we enforce it, and what happens if we break it.

---

## What This Means

### ✅ ALLOWED (No Competitive Advantage)

Players can pay for:

| Item | Type | Competitive Impact | Example |
|------|------|-------------------|---------|
| Cosmetic Jersey | Visual | ❌ None | Red vs Blue team skin |
| Player Card Pack | Tradeable | ❌ None (same stats as free) | Rare cosmetic variation |
| Tournament Entry | Gate (skill filter) | ❌ None | $10 entry = $100 prize |
| Emotes & Celebrations | Cosmetic | ❌ None | Victory animations |
| Team Name/Logo | Customization | ❌ None | Custom branding |
| Season Pass (cosmetics) | Battle pass | ❌ None | Skins only, no gameplay |

**Key principle**: If it doesn't affect matchmaking or gameplay stats, it's fair game.

### ❌ FORBIDDEN (Even If Profitable)

Players cannot purchase:

| Item | Why Forbidden | Penalty |
|------|---------------|---------|
| Stat boosts (+2 Speed) | Breaks fairness | Permanent ban |
| Stamina potions | Extends gameplay advantage | Permanent ban |
| Ability cooldown reduction | Changes gameplay balance | Permanent ban |
| ELO boost (+100 rating) | Artificial ranking inflation | Account reset + ban |
| Card stat variations | "Gold 99 SPD" vs "Silver 95 SPD" | Immediate delisting |
| RNG manipulation (rigged odds) | Cheating | Permanent ban + lawsuit |
| AI difficulty adjustment | Pay for easy matches | Permanent ban |

**Red line**: If it affects who wins, we don't sell it.

---

## How We Enforce It

### 1. Code Architecture (The Hard Stop)

**Separation of systems**:
```typescript
// This file is IMMUTABLE (no upgrade path)
const STAT_FORMULA = {
  speed: 75,        // Cannot be changed via governance
  acceleration: 4.2, // Hardcoded in contract
  maxStamina: 100,   // No boost possible
}

// This file CAN be upgraded (cosmetics only)
interface CosmeticNFT {
  jerseyColor: string,      // Visual
  celebrationAnimation: URL, // Visual
  // NO STATS HERE
}
```

**Why it works**: The stat formula is in an immutable contract. Even if we wanted to add stat boosts, we'd need to:
1. Deploy a new contract
2. Migrate all players
3. Everyone sees it coming

It's not sneaky. It's architectural.

### 2. Smart Contract Enforcement

```solidity
// IMMUTABLE STAT CALCULATION
contract BassBallStats {
  // This cannot be upgraded via proxy
  function calculatePlayerStats(address player) 
    public pure returns (Stats memory) {
    
    // Stats based only on:
    // 1. Card rarity (same for all holders)
    // 2. Player skill (ELO rating)
    // 3. Cosmetics (visual ONLY)
    
    // NO input for "purchasedBoosts" or "paymentTier"
  }
}
```

**Audit guarantee**: Anyone can read the contract and verify there's no payment lever on stats.

### 3. Governance Guardrails

**Players vote on**:
- Seasonal rewards ✅
- Tournament formats ✅
- Cosmetic themes ✅

**Players CANNOT vote on**:
- Stat formulas ❌ (immutable)
- Match physics ❌ (immutable)
- Pay-to-win policies ❌ (immutable)

**Enforcement**: These are literally blocked in the contract code. Governance transactions that try to modify immutable vars will revert.

### 4. Revenue Alignment

**Our incentives are aligned** with players:

| Scenario | Pay-to-Win? | Revenue | Player Retention | Our Outcome |
|----------|-------------|---------|------------------|-------------|
| Pure skill-based | ❌ | $130k/month | ✅ High | ✅ Sustainable |
| With stat boosts | ✅ | $300k/month (short-term) | ❌ Crashes | ❌ Game dies |

We make MORE money long-term by staying fair. Why would we cheat?

---

## Verification Checklist

**Before Every Release**

```
□ Stat formula unchanged (compare hash)
□ No new purchasable stat multipliers
□ Cosmetics-only marketplace items
□ Zero payment references in calculation code
□ Community audit passed (Immunefi program)
□ Governance cannot override immutable contracts
□ New card rarities have statistical parity
□ RNG sources use blockhash (not purchasable)
```

**Failed even one?** → Rollback to previous version, post-mortem published.

---

## What Happens If We Break It

### Detection

Player reports: "Found a way to buy +10 Speed"

### Investigation

1. **Engineering audit** (same day)
2. **Code review** (push to Github, public log)
3. **Reproduce exploit** (in staging)
4. **Identify vector** (where did it come from?)

### Resolution

**If it's a bug**:
- Fix code
- Issue new contract
- Migrate players
- Refund affected players
- Public post-mortem

**If it's intentional**:
- Team member fired
- Company structure review
- DAO vote on trust restoration
- All player accounts audited

### Accountability

**Public record**:
- Every change is on Github (immutable)
- Every contract deployment logged
- Every governance vote public
- Every financial transaction traceable

You can't hide pay-to-win in blockchain. Everything is auditable forever.

---

## Independent Verification

### Annual Audits

**Immunefi Bug Bounty Program**:
- $10k bounty for pay-to-win exploits
- Hackers have incentive to find and report
- If it exists, someone will find it

### Community Monitoring

**Public repositories**:
- Stat formulas: https://github.com/web3joker/Bass-Ball/blob/main/src/lib/playerStats.ts
- Smart contracts: https://github.com/web3joker/Bass-Ball/tree/main/contracts
- Governance rules: https://github.com/web3joker/Bass-Ball/blob/main/docs/GOVERNANCE.md

Anyone can clone, audit, and report findings.

### Third-Party Reviews

- **Openzeppelin contract audit** (planned Q2)
- **Trail of Bits security review** (planned Q3)
- **Community-organized independent review** (Immunefi bounty)

Every finding is public.

---

## The Legal Commitment

### To Players

"Bass Ball will never introduce pay-to-win mechanics. If we do, you have the right to:

1. **Refund**: Full refund of any purchase related to stat boosts
2. **Lawsuit**: Sue us for fraud under consumer protection laws
3. **Exit**: Withdraw NFTs to your own wallet (we don't have access)"

### To Regulators

"Bass Ball operates under a clear anti-fraud policy:

1. **No false claims** about stat origins (skill vs money)
2. **No hidden payments** affecting gameplay
3. **Full transparency** on all mechanics
4. **User control** of assets (NFTs)"

### To Investors

"Pay-to-win would kill the game. We optimize for 10-year sustainability, not quarterly metrics."

---

## The Test

**How to verify we mean this:**

1. **Read the code** (it's public)
2. **Run the audit** (Immunefi is open)
3. **Check the contract** (address on BaseScan)
4. **Play the game** (money ≠ skill)
5. **Watch governance** (DAO can't override)

If any of these fail, we've broken the pledge. Call us out. We deserve it.

---

## FAQ

**Q: What about cosmetics that make you harder to see (tactical advantage)?**  
A: Banned. We define cosmetics as "no functional difference." Dark jerseys that reduce visibility = removed.

**Q: What if players pay for better coaching/training?**  
A: That's not our sale. If a third party coaches players, that's player-to-player. We don't touch it. Skill IS the point.

**Q: What about card rarity affecting stats?**  
A: All rarities have the same base stats. Rarity is cosmetic (visual flair). A "Legendary" card is identical in gameplay to a "Common" card.

**Q: What if we need to monetize more aggressively?**  
A: We'd raise capital instead. We have explicit VC interest. Better to fundraise than betray players.

**Q: Can you promise this forever?**  
A: We can promise it while the company exists. If Bass Ball is acquired, the acquiring company inherits this pledge or faces immediate player revolt (they own the NFTs). Either way, players are protected.

---

## Signature

**Bass Ball Team**  
January 18, 2026

This pledge is binding. We welcome scrutiny. We encourage you to prove us wrong (you won't).

**Verify us. Trust by verification, not by words.**
