# Bass Ball Governance & DAO - Quick Reference

## Governance Tokens

| Token | Symbol | Chain | Voting Weight |
|-------|--------|-------|---------------|
| Optimism | OP | Optimism (10) | 1x (default) |
| Arbitrum | ARB | Arbitrum (42161) | 1x (default) |
| Aave | AAVE | Ethereum (1) | 1x (default) |

### Get Token Info
```typescript
import { getGovernanceToken } from '@/lib/web3/governance-dao';
const op = getGovernanceToken('OP');
```

---

## Governance Functions

### Proposals (5 functions)
- `createProposal()` - Create new proposal
- `castVote()` - Vote on proposal
- `getProposalStatus()` - Get current status
- `getVotingParticipation()` - Get participation %
- `predictProposalOutcome()` - Predict outcome

### Voting Power (2 functions)
- `calculateVotingPower()` - Calculate from holdings
- `formatVotingPower()` - Format for display

### Delegation (3 functions)
- `delegateVotingPower()` - Delegate to address
- `revokeDelegation()` - Revoke delegation
- `getDelegationChain()` - Follow delegation

### Treasury (5 functions)
- `createTreasuryAccount()` - Create treasury
- `proposeTreasuryTransaction()` - Propose spending
- `approveTreasuryTransaction()` - Approve
- `executeTreasuryTransaction()` - Execute
- `getTreasuryBalance()` - Get balance

### Snapshot (3 functions)
- `createSnapshotProposal()` - Create Snapshot
- `voteOnSnapshot()` - Vote on Snapshot
- `getSnapshotWinner()` - Get winner

### Analytics (3 functions)
- `getGovernanceMetrics()` - Get metrics
- `analyzeVotingPattern()` - Analyze voting
- `getDAOMemberProfile()` - Get member info

---

## React Components (6)

1. **ProposalBrowser** - Browse & filter proposals
2. **VotingInterface** - Cast votes
3. **DelegationManager** - Manage delegations
4. **TreasuryDashboard** - Treasury management
5. **GovernanceMetrics** - Display metrics
6. **TokenHoldersRanking** - Top holders

---

## Proposal Types

### Text Proposal
```typescript
createProposal(
  'Question for DAO',
  'Description',
  proposer,
  'text'
);
```

### Executable Proposal
```typescript
createProposal(
  'Update Parameter',
  'Change contract state',
  proposer,
  'executable',
  [{ target, functionSignature, params }]
);
```

### Economic & Operational
```typescript
createProposal(title, description, proposer, 'economic');
createProposal(title, description, proposer, 'operational');
```

---

## Voting

### Cast Vote
```typescript
const { proposal, vote } = castVote(
  proposal,
  '0xVoter...',
  150,        // voting power
  2,          // 0=abstain, 1=against, 2=for
  'Reason...' // optional
);
```

### Vote Choices
- `0` = Abstain
- `1` = Against
- `2` = For

---

## Delegation

### Delegate Power
```typescript
delegateVotingPower(
  '0xDelegator...',
  '0xDelegatee...',
  100,  // power amount
  'OP'  // token
);
```

### Revoke
```typescript
revokeDelegation('0xDelegator...', '0xDelegatee...', 'OP');
```

---

## Treasury

### Create Account
```typescript
createTreasuryAccount(
  'Main Treasury',
  'DAO operations',
  '0xUSDC...',
  '0xMultisig...',
  ['0xSigner1...', '0xSigner2...']
);
```

### Propose Transaction
```typescript
proposeTreasuryTransaction(
  treasuryId,
  50000,  // amount
  '0xUSDC...',
  '0xRecipient...',
  'Purpose'
);
```

### Approve & Execute
```typescript
let tx = transaction;
tx = approveTreasuryTransaction(tx, '0xSigner1...');
tx = approveTreasuryTransaction(tx, '0xSigner2...');
tx = executeTreasuryTransaction(tx, 2); // required sigs
```

---

## Snapshot Integration

### Create Proposal
```typescript
createSnapshotProposal(
  'Should we add feature X?',
  'Description',
  ['Yes', 'No', 'Maybe'],
  '0xProposer...',
  startTime,
  endTime
);
```

### Vote
```typescript
voteOnSnapshot(proposal, 0, 150); // choice, power
```

### Results
```typescript
const winner = getSnapshotWinner(proposal);
// { choice: 'Yes', votes: 15000 }
```

---

## Analytics

### Get Metrics
```typescript
const metrics = getGovernanceMetrics(proposals, holders, balance);
// totalProposals, activeProposals, successRate, etc.
```

### Analyze Voting
```typescript
const pattern = analyzeVotingPattern(proposal);
// { consensus: 82, engagement: 61, sentiment: 'strongly-for' }
```

### Predict Outcome
```typescript
const prediction = predictProposalOutcome(proposal, timeLeft, totalPower);
// { passProability: 0.95, quorumLikelihood: 0.89, recommendation: '...' }
```

### Member Profile
```typescript
const member = getDAOMemberProfile(address, holdings, delegations, proposals, votes);
// { votingPower, level, participationRate, etc. }
```

---

## UI Components Usage

### Proposal Browser
```typescript
<ProposalBrowser
  proposals={proposals}
  totalVotingPower={100000}
  onVote={(proposal) => handleVote(proposal)}
/>
```

### Voting Interface
```typescript
<VotingInterface
  proposal={activeProposal}
  userVotingPower={150}
  onSubmitVote={(choice) => castVote(proposal, voter, 150, choice)}
/>
```

### Delegation Manager
```typescript
<DelegationManager
  currentUser="0xUser..."
  votingPower={150}
  delegations={delegations}
  onDelegate={(delegatee, power) => delegateVotingPower(...)}
/>
```

### Treasury Dashboard
```typescript
<TreasuryDashboard
  balance={1500000}
  transactions={treasuryTxs}
  onProposeTx={() => showTreasuryForm()}
/>
```

### Governance Metrics
```typescript
<GovernanceMetrics
  totalProposals={45}
  activeProposals={3}
  successfulProposals={35}
  uniqueVoters={2847}
  averageParticipation={68.5}
  treasuryBalance={1500000}
/>
```

### Token Holders Ranking
```typescript
<TokenHoldersRanking
  holders={holders}
  limit={10}
/>
```

---

## Voting Participation Levels

| Participation | Quality |
|---------------|---------|
| < 30% | Low engagement |
| 30-50% | Moderate participation |
| 50-70% | Good participation |
| 70%+ | Excellent participation |

---

## Proposal Status Flow

```
pending → active → succeeded/defeated
           ↓
        cancelled
           ↓
        expired
           ↓
        executed
```

---

## Time Functions

### Get Time Remaining
```typescript
const time = getTimeRemaining(endBlock);
// { days: 3, hours: 12, minutes: 45 }
```

### Format Voting Power
```typescript
formatVotingPower(150);      // "150"
formatVotingPower(1500000);  // "1.50M"
```

---

## Governance Requirements

### Proposal Creation
- Minimum voting power (varies by DAO)
- ≥ 25,000 tokens for text
- ≥ 100,000 tokens for executable

### Voting
- Hold governance tokens
- Participate during voting window
- Submit vote on-chain or via Snapshot

### Quorum
- Minimum participation: 40%
- Support required: 50%+
- Can be adjusted by governance

---

## Common Patterns

### Complete Voting Flow
```typescript
// 1. Get active proposals
const active = proposals.filter(p => p.status === 'active');

// 2. Analyze proposal
const pattern = analyzeVotingPattern(proposal);

// 3. Cast vote
const { proposal: updated } = castVote(proposal, voter, power, choice);

// 4. Monitor until completion
const final = getProposalStatus(updated, totalPower);
```

### Delegation Strategy
```typescript
// Delegate to expert for each token
delegateVotingPower(user, expertOP, opPower, 'OP');
delegateVotingPower(user, expertARB, arbPower, 'ARB');
delegateVotingPower(user, expertAAVE, aavePower, 'AAVE');
```

### Treasury Workflow
```typescript
// 1. Create account
const treasury = createTreasuryAccount('name', 'purpose', usdc, multisig, signers);

// 2. Propose transaction
const tx = proposeTreasuryTransaction(treasury.id, amount, usdc, recipient, purpose);

// 3. Get approvals
let tx2 = approveTreasuryTransaction(tx, signer1);
let tx3 = approveTreasuryTransaction(tx2, signer2);

// 4. Execute
const executed = executeTreasuryTransaction(tx3, 2);
```

---

## Contribution Levels

| Level | Required Power |
|-------|---|
| Bronze | 0-10K |
| Silver | 10K-100K |
| Gold | 100K-500K |
| Diamond | 500K-1M |
| Founder | 1M+ |

---

**Total Functions**: 25+ exported  
**Components**: 6 production-ready  
**Type Safe**: 100% TypeScript  
**Status**: ✅ Production Ready
