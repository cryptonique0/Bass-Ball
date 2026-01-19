# FIFA Rules Implementation Checklist

**Complete implementation roadmap for Bass Ball's FIFA ruleset**

---

## Phase 1: Disciplinary System (Weeks 1-3)

### Yellow Card System
- [ ] Implement `DisciplinarySystem` class core functionality
- [ ] Hardcode yellow card offense baselines (unsporting_behavior, excessive_force, etc.)
- [ ] Create `YellowCardEvent` interface and typing
- [ ] Implement automatic red card on second yellow (2x yellow → red)
- [ ] Yellow card accumulation tracking (5 yellows = 1 match ban)
- [ ] Test: Verify yellow card issuance flow
- [ ] Test: Verify 2x yellow → red in same match
- [ ] Add event logging to match replay system

### Red Card System
- [ ] Implement direct red card offenses (violent conduct, spitting, etc.)
- [ ] Player ejection logic (immediate removal from field)
- [ ] Team adjusts to 10 players (or folded if <7)
- [ ] Create `RedCardEvent` interface
- [ ] Suspension calculation (1-5 matches based on offense)
- [ ] Test: Red card ejection changes team AI tactically
- [ ] Test: Team can't field <7 players (auto-loss if happens)
- [ ] Blockchain logging: Card recorded to `DisciplinaryRegistry` smart contract

### Yellow Accumulation Ban
- [ ] Track yellows across season (not per-match)
- [ ] 5 yellows → automatic 1-match suspension
- [ ] 10 yellows → automatic 2-match suspension
- [ ] 15 yellows → automatic 3-match suspension + committee review
- [ ] Accumulation resets at mid-season or season end
- [ ] UI: Display yellow card count on player profile
- [ ] Test: Verify ban triggers at correct thresholds

---

## Phase 2: Suspension System (Weeks 2-4)

### Suspension Enforcement
- [ ] Create `SuspensionSystem` class
- [ ] Store suspensions in persistent database (or smart contract)
- [ ] Link suspensions to card events (chain of responsibility)
- [ ] Match eligibility checker: `canPlayerParticipate(playerId, matchId)`
- [ ] Squad validation rejects ineligible players
- [ ] Test: Suspended player can't be selected in squad sheet
- [ ] Test: Suspension countdown decrements after each match

### Appeal System (Web3-Backed)
- [ ] Create appeal submission interface
- [ ] Replay clip upload to IPFS (deterministic hash)
- [ ] Smart contract appeals registry
- [ ] 5-judge voting system (random selection from verified players)
- [ ] 48-hour voting period
- [ ] Appeal voting UI (judges vote on "Overturn" / "Upheld")
- [ ] Verdict resolution: ≥3/5 = overturn suspension
- [ ] Refund 0.1 ETH + award 0.05 ETH to winner
- [ ] Record appeal outcome on-chain
- [ ] Test: Appeal workflow end-to-end
- [ ] Test: Overturned suspension removes from system
- [ ] UI: Display appeal deadline (24 hours from match end)

---

## Phase 3: Transfer Window System (Weeks 4-6)

### Transfer Window Management
- [ ] Define transfer windows (summer, winter, emergency)
- [ ] Create `TransferWindow` entities in database
- [ ] Global transfer window state (open/closed)
- [ ] Window date validation (June 1-Aug 31, etc.)
- [ ] Emergency window trigger (0 eligible players in position)
- [ ] Test: Can't transfer outside windows
- [ ] Test: Emergency window opens correctly

### Player Listing & Market
- [ ] Player listing interface (ask price, contract terms)
- [ ] Marketplace display (filterable by position, price, etc.)
- [ ] NFT metadata includes transfer eligibility flag
- [ ] Listed players appear in transfer market UI
- [ ] Auction vs fixed price options
- [ ] Test: Listed player can be viewed in marketplace

### Transfer Execution
- [ ] Squad composition validation (max 1 per position per window)
- [ ] Budget cap enforcement (500K summer, 250K winter)
- [ ] Player eligibility (26 match minimum, no suspension)
- [ ] Team minimum maintenance (must have 11+ eligible)
- [ ] NFT ownership transfer (smart contract: `TransferRegistry`)
- [ ] Transfer fee distribution (97% to seller, 3% platform)
- [ ] Contract negotiation (length: 26-130 matches, salary per match)
- [ ] Transfer status: pending → cleared → completed
- [ ] Test: Transfer process end-to-end
- [ ] Test: Budget caps enforced
- [ ] Test: Squad composition validated

### Loan Deals
- [ ] Loan agreement creation (player, borrowing team, length)
- [ ] Parent club retains NFT ownership
- [ ] Borrowing club pays salary
- [ ] Loan expiration auto-return
- [ ] Loaned players appear on borrowed team squad
- [ ] Test: Loan agreement workflow

---

## Phase 4: Squad Rules & Match Validation (Weeks 5-7)

### Squad Sheet Validation
- [ ] Create `SquadValidationSystem` class
- [ ] Formation validation (4-4-2, 4-3-3, 3-5-2, 5-3-2, 5-4-1)
- [ ] Positional requirements per formation
- [ ] 11 starting + 7 bench maximum
- [ ] Minimum eligible players check (11 total)
- [ ] Player eligibility checks:
  - [ ] Not suspended
  - [ ] Not injured
  - [ ] Contract active
  - [ ] Properly transferred
- [ ] Test: Squad validation catches all errors
- [ ] UI: Squad builder with real-time validation

### Match Eligibility
- [ ] Pre-match: Check all players in squad sheets
- [ ] Suspension count-down from previous match
- [ ] Injury status refresh (decrease injury counter)
- [ ] Contract expiry check
- [ ] Transfer clearance check (within 24 hours)
- [ ] Test: Ineligible players rejected

### Injury System
- [ ] Injury occurrence trigger (tackle collision, etc.)
- [ ] Injury probability: 2-5% base + fatigue modifier
- [ ] Severity levels: minor (3-5), moderate (7-14), serious (season-ending)
- [ ] Seeded randomness (deterministic via frame seed)
- [ ] Injury countdown (decrements each match)
- [ ] Player can't participate while injured
- [ ] UI: Display "Out Until Match X" on player profile
- [ ] Test: Injury prevents participation
- [ ] Test: Injury resolves after X matches

---

## Phase 5: Physics & Technical Rules (Weeks 6-8)

### Offside Detection
- [ ] `OffsideDetectionSystem` class
- [ ] Frame-by-frame offside check on passes
- [ ] Last defender detection (closest to own goal)
- [ ] Onside if level with defender
- [ ] Onside in own half
- [ ] Special cases: throw-in, goal kick, corner kick
- [ ] Offside margin calculation (mm precision)
- [ ] Free kick awarded to defending team
- [ ] Test: Offside detection accuracy
- [ ] Test: Special cases handled correctly
- [ ] Replay: Offside line visualization

### Handball Detection
- [ ] Hand distance calculation from ball
- [ ] Arm extension angle (natural vs unnatural)
- [ ] Intentional block detection
- [ ] Deliberate vs accidental classification
- [ ] Penalty area check (handball in box = penalty)
- [ ] Outside box = free kick
- [ ] Goalkeeper exception (can handle in penalty area)
- [ ] Card for deliberate handball (yellow or red)
- [ ] Test: Handball detection
- [ ] Test: Penalty vs free kick awarding

### Penalty Mechanics
- [ ] Penalty shot interface (force, direction, height)
- [ ] Goalkeeper positioning (on goal line)
- [ ] Taker movement rules (can't move until contact)
- [ ] Goalkeeper can advance up to half-meter
- [ ] Saved ball enters play
- [ ] Missed/post ball enters play
- [ ] Rebound handling (any player can finish)
- [ ] Test: Penalty kick physics
- [ ] Test: Edge cases (taker moves early, GK early, post hits)

### Penalty Shootout
- [ ] 5 kicks per team (alternating)
- [ ] Best of 5 wins
- [ ] Sudden death if tied after 5
- [ ] Designated taker tracking
- [ ] Can't shoot twice in row (within 5 kicks)
- [ ] Test: Shootout sequence
- [ ] Test: Sudden death logic

---

## Phase 6: Match Rules Integration (Weeks 8-10)

### Main Rules Engine
- [ ] Create `MatchRulesEngine` orchestrator class
- [ ] Pre-match validation (squad sheets, eligibility)
- [ ] During-match: Foul evaluation → card logic
- [ ] During-match: Offside checks on passes
- [ ] During-match: Handball detection
- [ ] During-match: Injury occurrence
- [ ] Post-match: Suspension decrement
- [ ] Post-match: Results recording
- [ ] Test: Full match with multiple rules applied
- [ ] Test: Rules don't conflict with each other

### League Scoring
- [ ] Win = 3 points
- [ ] Draw = 1 point each
- [ ] Loss = 0 points
- [ ] Abandoned = 0-3 loss (both teams penalized)
- [ ] Final standings calculation (points → GD → GF → H2H)
- [ ] Deterministic tiebreaker (seeded)
- [ ] Test: League table calculations

### Cup/Knockout Rules
- [ ] Extra time (2×15 min if tied)
- [ ] Golden goal rule (league-specific)
- [ ] Penalty shootout if still tied
- [ ] Progression logic
- [ ] Prize distribution
- [ ] Test: Cup tournament flow

---

## Phase 7: Blockchain Integration (Weeks 10-12)

### Smart Contract Development
- [ ] Deploy `DisciplinaryRegistry` contract
  - [ ] `issueCard(player, matchId, offense, replayHash)`
  - [ ] `createSuspension(player, startMatch, length)`
  - [ ] `appealSuspension(player, suspensionId, evidence)`
  - [ ] `canParticipateInMatch(player, matchId)`
- [ ] Deploy `TransferRegistry` contract
  - [ ] `listPlayer(playerNFT, askedPrice, windowType)`
  - [ ] `executeTransfer(player, fromTeam, toTeam, fee)`
  - [ ] `clearTransfer(transferId)`
  - [ ] Transfer fee distribution (3% platform, 2% creator royalty)
- [ ] Deploy `AppealVoting` contract
  - [ ] Judge selection (random from verified players)
  - [ ] Voting mechanism (1 judge = 1 vote)
  - [ ] Verdict calculation (≥3/5 = overturn)
  - [ ] Reward distribution (0.05 ETH to winner)
- [ ] Test: All contract functions
- [ ] Test: Gas optimization
- [ ] Audit: Security review

### Backend Integration
- [ ] Events API: Card issued → Blockchain log
- [ ] Events API: Suspension created → Smart contract call
- [ ] Events API: Appeal submitted → Blockchain recording
- [ ] Events API: Transfer completed → NFT ownership change
- [ ] Webhook: Appeals resolved by voting → Update suspension status
- [ ] Webhook: Transfer cleared → Player available next match
- [ ] Test: End-to-end blockchain flow

### Frontend Integration
- [ ] Player profile: Disciplinary tab (cards, suspensions, appeals)
- [ ] Transfer market: Listing/buying UI
- [ ] Squad builder: Eligibility indicators (red flags for ineligible players)
- [ ] Appeals dashboard: Submission UI, voting UI for judges
- [ ] Match summary: Cards issued + replay links
- [ ] Suspension calendar: "Out Until Match X"
- [ ] Test: All UI flows

---

## Phase 8: Testing & Verification (Weeks 12-14)

### Unit Tests
- [ ] `DisciplinarySystem` class tests (20+ test cases)
- [ ] `SuspensionSystem` class tests (15+ test cases)
- [ ] `TransferSystem` class tests (20+ test cases)
- [ ] `SquadValidationSystem` tests (15+ test cases)
- [ ] `OffsideDetectionSystem` tests (10+ test cases)
- [ ] `HandballDetectionSystem` tests (8+ test cases)
- [ ] Test coverage: ≥90%

### Integration Tests
- [ ] Full match with disciplinary system
- [ ] Full match with injuries
- [ ] Full match with offside incidents
- [ ] Full match with handball incidents
- [ ] Transfer window execution
- [ ] Suspension → match ineligibility → appeal → reinstatement
- [ ] Multi-match season with yellow accumulation bans

### Determinism Tests
- [ ] Same match seed = same cards issued (bit-for-bit)
- [ ] Same match seed = same offside calls
- [ ] Same match seed = same injuries
- [ ] Replay verification: Reconstructed frames match original

### Blockchain Tests
- [ ] Card recorded on-chain correctly
- [ ] Suspension created in smart contract
- [ ] Appeal voting mechanism (5 judges, 48h window)
- [ ] Transfer fee distribution calculation
- [ ] NFT ownership changes on transfer
- [ ] On-chain suspension prevents squad selection

### Performance Tests
- [ ] Match initialization <100ms
- [ ] Foul evaluation <10ms
- [ ] Offside check <5ms per pass
- [ ] Suspension query <50ms
- [ ] Smart contract calls <2s (block confirmation)

---

## Phase 9: Documentation & Deployment (Weeks 14-16)

### Developer Documentation
- [ ] API reference for all rules systems
- [ ] Smart contract ABI documentation
- [ ] Integration examples (code snippets)
- [ ] Troubleshooting guide (common issues)
- [ ] Performance tips (optimization)

### Player Documentation
- [ ] FIFA Rules Guide (in-game)
- [ ] Disciplinary system explanation
- [ ] Appeals process walkthrough
- [ ] Transfer window rules
- [ ] FAQ

### Deployment
- [ ] Testnet deployment (Sepolia/Base Goerli)
- [ ] Testnet testing (1-2 weeks)
- [ ] Production deployment (Mainnet)
- [ ] Monitoring: Card/suspension activity
- [ ] Monitoring: Transfer market volume
- [ ] Monitoring: Appeal voting participation

---

## Completion Checklist

### Code Quality
- [ ] All TypeScript compiled without errors
- [ ] ESLint passing (no style violations)
- [ ] Test coverage ≥90%
- [ ] Code review completed
- [ ] Security audit passed

### Functionality
- [ ] All 9 sections implemented
- [ ] All test cases passing
- [ ] All edge cases handled
- [ ] Determinism verified
- [ ] Blockchain integration complete

### Documentation
- [ ] API docs complete
- [ ] Smart contract docs complete
- [ ] Player guide complete
- [ ] Troubleshooting guide complete
- [ ] Video tutorial created

### Deployment
- [ ] Testnet deployed
- [ ] Mainnet deployed
- [ ] Monitoring active
- [ ] Support team trained
- [ ] Launch announced

---

## Success Metrics

| Metric | Target | Actual |
|--------|--------|--------|
| Test coverage | ≥90% | — |
| Code review approval | 100% | — |
| Zero critical bugs (launch) | 0 | — |
| Determinism verification | 100% | — |
| Smart contract gas optimization | <500k per call | — |
| Player appeal rate | <5% of cards | — |
| Market transfer volume | >50/season | — |
| Community satisfaction | ≥4.5/5 | — |

---

**Timeline**: 16 weeks (4 months)
**Team Size**: 3-4 developers, 1 QA engineer, 1 blockchain dev
**Est. Lines of Code**: 5,000-7,000
**Est. Smart Contract Code**: 2,000-3,000 lines (Solidity)

This checklist ensures complete, tested, and deployed FIFA ruleset implementation.
