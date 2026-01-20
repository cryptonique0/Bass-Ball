# Bass Ball Governance & DAO Support Guide

## Overview

Bass Ball governance enables decentralized platform management through DAO structures, governance tokens, and community voting. The system integrates with Snapshot for off-chain voting and supports multiple governance tokens (OP, ARB, AAVE).

**Core Features:**
- 🪙 **Governance Tokens** - OP, ARB, AAVE integration
- 📋 **Proposal Management** - Create, track, and vote on proposals
- 🤝 **Vote Delegation** - Delegate voting power to other members
- 📊 **Treasury Management** - Multi-sig treasury with proposal-based spending
- 🔗 **Snapshot Integration** - Off-chain voting with on-chain enforcement

---

## Part 1: Governance Tokens

### Overview

Three governance tokens integrate into Bass Ball DAO:

| Token | Symbol | Chain | Use Case |
|-------|--------|-------|----------|
| Optimism | OP | Optimism (L2) | OP Stack governance, Layer 2 decisions |
| Arbitrum | ARB | Arbitrum (L2) | Arbitrum governance, Protocol changes |
| Aave | AAVE | Ethereum | DeFi governance, Economic parameters |

### Get Token Information

```typescript
import { getGovernanceToken, GOVERNANCE_TOKENS } from '@/lib/web3/governance-dao';

// Get single token
const op = getGovernanceToken('OP');
console.log({
  symbol: op.symbol,
  contract: op.contractAddress,
  totalSupply: op.totalSupply,
  circulating: op.circulating,
});

// Get all tokens
Object.values(GOVERNANCE_TOKENS).forEach(token => {
  console.log(`${token.symbol}: ${token.circulating} circulating`);
});
```

### Token Details

**Optimism (OP)**
- Address: `0x4200000000000000000000000000000000000042`
- Chain: Optimism (10)
- Total Supply: 4.29B tokens
- Circulating: 2B tokens
- Purpose: Govern Optimism protocol decisions

**Arbitrum (ARB)**
- Address: `0x912CE59144191c1204E64559FE8253a0e108FF4e`
- Chain: Arbitrum (42161)
- Total Supply: 10B tokens
- Circulating: 1.26B tokens
- Purpose: Arbitrum protocol governance

**Aave (AAVE)**
- Address: `0x7Fc66500c84A76Ad7e9c93437E434122A1f9AcDe`
- Chain: Ethereum (1)
- Total Supply: 16M tokens
- Circulating: 14.6M tokens
- Purpose: Aave protocol and risk governance

### Calculate Voting Power

```typescript
import { calculateVotingPower } from '@/lib/web3/governance-dao';

// User holds 100 OP, 50 ARB, 5 AAVE
const holdings = {
  'OP': 100,
  'ARB': 50,
  'AAVE': 5,
};

// Equal weight voting power
const votingPower = calculateVotingPower(holdings);
// Result: 155 units

// Custom weights (favor Aave)
const weights = {
  'OP': 1,
  'ARB': 1,
  'AAVE': 10, // 10x weight
};

const weightedPower = calculateVotingPower(holdings, weights);
// Result: 100 + 50 + 50 = 200 units
```

---

## Part 2: Proposal System

### Create a Proposal

```typescript
import { createProposal, ProposalAction } from '@/lib/web3/governance-dao';

// Define proposal actions (for executable proposals)
const actions: ProposalAction[] = [
  {
    id: 'action-1',
    target: '0x...' // Contract to call
    functionSignature: 'setRewardMultiplier(uint256)',
    params: ['150'], // 1.5x multiplier
    value: 0,
    description: 'Increase match rewards by 50%',
  },
];

// Create proposal
const proposal = createProposal(
  'Increase Match Rewards',
  `
    ## Summary
    Increase base match rewards by 50% to improve player engagement.
    
    ## Rationale
    Current rewards are too low compared to competitors.
    
    ## Actions
    - Set reward multiplier to 1.5x for 30 days
    - Monitor player engagement
    - Adjust based on metrics
  `,
  '0xProposer...',
  'executable', // Type
  actions // Action list
);

console.log({
  id: proposal.id,
  title: proposal.title,
  status: proposal.status, // 'pending'
  votingStarts: new Date(proposal.startBlock * 12000),
  votingEnds: new Date(proposal.endBlock * 12000),
});
```

### Proposal Types

```typescript
// 1. Text Proposal (no on-chain execution)
const textProposal = createProposal(
  'Should we add seasonal cosmetics?',
  'Vote on whether to add cosmetics that change by season',
  proposer,
  'text'
);

// 2. Executable Proposal (runs contract actions)
const execProposal = createProposal(
  'Update Tournament Prize Pool',
  'Increase tournament prize pools by 25%',
  proposer,
  'executable',
  [
    {
      id: 'action-1',
      target: '0xTournament...',
      functionSignature: 'setPrizeMultiplier(uint256)',
      params: ['125'],
      value: 0,
      description: 'Set multiplier to 1.25x',
    },
  ]
);

// 3. Economic Proposal (affects token economics)
const economicProposal = createProposal(
  'Adjust Gas Fee Revenue Split',
  'Change revenue sharing: 60% treasury, 40% stakers',
  proposer,
  'economic'
);

// 4. Operational Proposal (operational decisions)
const operationalProposal = createProposal(
  'Hire Community Manager',
  'Hire @alice as full-time community manager',
  proposer,
  'operational'
);
```

### Track Active Proposals

```typescript
// Filter proposals by status
const activeProposals = proposals.filter(p => p.status === 'active');
const votingProposals = proposals.filter(p => 
  p.status === 'pending' || p.status === 'active'
);

// Show proposal details
activeProposals.forEach(proposal => {
  const timeLeft = getTimeRemaining(proposal.endBlock);
  const voting = proposal.votingStats;
  
  console.log({
    title: proposal.title,
    status: proposal.status,
    timeRemaining: `${timeLeft.days}d ${timeLeft.hours}h`,
    forVotes: voting.forVotes,
    againstVotes: voting.againstVotes,
    participation: voting.votingPercentage.toFixed(1) + '%',
    leading: voting.forPercentage > 50 ? 'Passing' : 'Failing',
  });
});
```

### Vote on a Proposal

```typescript
import { castVote } from '@/lib/web3/governance-dao';

// Cast vote
const { proposal: updatedProposal, vote } = castVote(
  proposal,
  '0xVoter...',      // Voter address
  150,               // Voting power (tokens)
  2,                 // Choice: 0=abstain, 1=against, 2=for
  'I support this because...' // Optional reason
);

console.log({
  voter: vote.voter,
  choice: vote.choice === 2 ? 'FOR' : vote.choice === 1 ? 'AGAINST' : 'ABSTAIN',
  power: vote.votingPower,
  newStats: updatedProposal.votingStats,
});

// Example voting stats after vote
console.log({
  forVotes: 45000,
  againstVotes: 15000,
  abstainVotes: 5000,
  forPercentage: 75,
  againstPercentage: 25,
  votingPercentage: 82, // % of total voting power
});
```

---

## Part 3: Vote Delegation

### Delegate Voting Power

```typescript
import { delegateVotingPower, getTotalDelegatedPower } from '@/lib/web3/governance-dao';

// Delegate to another member
const delegation = delegateVotingPower(
  '0xAlice...',     // Delegator
  '0xBob...',       // Delegatee (who gets voting power)
  100,              // Voting power amount
  'OP'              // Token ID
);

console.log({
  delegator: delegation.delegator,
  delegatee: delegation.delegatee,
  power: delegation.votingPower,
  token: delegation.tokenId,
  txHash: delegation.txHash,
});

// Check delegated power received
const delegateeTotal = getTotalDelegatedPower('0xBob...', delegations);
console.log(`Bob has ${delegateeTotal} voting power delegated to him`);
```

### Trace Delegation Chain

```typescript
import { getDelegationChain } from '@/lib/web3/governance-dao';

// Follow delegation chain
const chain = getDelegationChain('0xAlice...', delegations);
// Returns: ['0xAlice...', '0xBob...', '0xCharlie...', ...]
// (Carol delegates to Bob, Bob delegates to Charlie, etc.)

console.log('Delegation chain:');
chain.forEach((address, index) => {
  console.log(`  ${index}: ${address}`);
});
```

### Revoke Delegation

```typescript
import { revokeDelegation } from '@/lib/web3/governance-dao';

// Stop delegating
const revocation = revokeDelegation(
  '0xAlice...',  // Delegator
  '0xBob...',    // Was delegating to
  'OP'           // Token
);

console.log(`Revoked ${revocation.votingPower} power from ${revocation.delegatee}`);
```

### Delegation Strategy Example

```typescript
// Multi-token delegation with different delegatees
const delegations = [
  {
    token: 'OP',
    delegatee: '0xDelegateOP...',  // Expert in Optimism
    power: 100,
  },
  {
    token: 'ARB',
    delegatee: '0xDelegateARB...',  // Expert in Arbitrum
    power: 50,
  },
  {
    token: 'AAVE',
    delegatee: '0xDelegateAAVE...', // Expert in Aave
    power: 5,
  },
];

// Delegate based on expertise
delegations.forEach(d => {
  delegateVotingPower(
    '0xUser...',
    d.delegatee,
    d.power,
    d.token
  );
});
```

---

## Part 4: Treasury Management

### Create Treasury Account

```typescript
import { 
  createTreasuryAccount, 
  getTreasuryBalance 
} from '@/lib/web3/governance-dao';

// Main treasury
const mainTreasury = createTreasuryAccount(
  'Bass Ball DAO Treasury',
  'Main DAO treasury for operational expenses',
  '0xUSDC...', // Token address
  '0xMultisig...', // Multisig address
  [
    '0xSigner1...',
    '0xSigner2...',
    '0xSigner3...',
  ]
);

// Ecosystem fund
const ecosystemFund = createTreasuryAccount(
  'Ecosystem Fund',
  'Grants and incentives for developers',
  '0xUSDC...',
  '0xEcosystemMultisig...',
  ['0xSigner1...', '0xSigner2...']
);

console.log({
  mainTreasury: mainTreasury.address,
  ecosystemFund: ecosystemFund.address,
  requiredSignatures: mainTreasury.requiredSignatures, // 2 of 3
});
```

### Propose Treasury Spending

```typescript
import { proposeTreasuryTransaction } from '@/lib/web3/governance-dao';

// Propose payment to contributor
const transaction = proposeTreasuryTransaction(
  mainTreasury.address,
  50000, // 50,000 USDC
  '0xUSDC...',
  '0xContributor...',
  'Q1 Development Work - 500 engineering hours'
);

console.log({
  id: transaction.id,
  amount: transaction.amount,
  recipient: transaction.recipient,
  status: transaction.status, // 'pending'
  purpose: transaction.purpose,
});
```

### Approve & Execute Transactions

```typescript
import { 
  approveTreasuryTransaction,
  executeTreasuryTransaction 
} from '@/lib/web3/governance-dao';

// Signers approve transaction
let tx = transaction;
tx = approveTreasuryTransaction(tx, '0xSigner1...');
tx = approveTreasuryTransaction(tx, '0xSigner2...');

console.log(`Approvals: ${tx.approvals.length} / 2`);

// Once enough signatures, execute
if (tx.approvals.length >= 2) {
  tx = executeTreasuryTransaction(tx, 2);
  
  console.log({
    status: tx.status,     // 'executed'
    txHash: tx.txHash,
    executedAt: new Date(tx.executedAt),
  });
}
```

### Treasury Reporting

```typescript
// Get treasury balance
const transactions = [tx1, tx2, tx3, /* ... */];
const balance = getTreasuryBalance(transactions);

console.log({
  balance: balance,
  deposits: transactions.filter(t => t.amount > 0 && t.status === 'executed').length,
  withdrawals: transactions.filter(t => t.amount < 0 && t.status === 'executed').length,
  pending: transactions.filter(t => t.status === 'pending').length,
});

// Treasury allocation
const allocations = {
  'Operations': 250000,
  'Development': 400000,
  'Marketing': 150000,
  'Grants': 200000,
  'Reserve': 200000,
};

const total = Object.values(allocations).reduce((a, b) => a + b, 0);
Object.entries(allocations).forEach(([category, amount]) => {
  const percentage = (amount / total) * 100;
  console.log(`${category}: $${amount.toLocaleString()} (${percentage.toFixed(1)}%)`);
});
```

---

## Part 5: Snapshot Integration

### Create Snapshot Proposal

```typescript
import { createSnapshotProposal, voteOnSnapshot } from '@/lib/web3/governance-dao';

const now = Date.now();
const proposal = createSnapshotProposal(
  'Should we launch on Polygon?',
  `
    ## Question
    Should Bass Ball expand to Polygon mainnet?
    
    ## Options
    - Yes, launch immediately
    - Wait for gas optimization
    - No, focus on Base Chain only
  `,
  [
    'Yes, launch immediately',
    'Wait for gas optimization',
    'No, focus on Base Chain only',
  ],
  '0xProposer...',
  now + 1 * 60 * 1000,  // Starts in 1 minute
  now + 7 * 24 * 60 * 60 * 1000 // Ends in 7 days
);

console.log({
  title: proposal.title,
  link: proposal.link,
  choices: proposal.choices,
  state: proposal.state, // 'pending'
});
```

### Vote on Snapshot

```typescript
// User votes with their token balance
const updatedProposal = voteOnSnapshot(
  proposal,
  1, // Choice index (Wait for gas optimization)
  150 // Voting power
);

console.log({
  scores: updatedProposal.scores,
  // [leading, 150, other]
  votes: updatedProposal.votes,
  state: updatedProposal.state, // 'active'
});
```

### Get Snapshot Results

```typescript
import { getSnapshotWinner } from '@/lib/web3/governance-dao';

// After voting closes
const winner = getSnapshotWinner(closedProposal);

console.log({
  winningChoice: winner.choice,
  votes: winner.votes,
  percentage: (winner.votes / closedProposal.scores.reduce((a, b) => a + b)) * 100,
});

// Show all results
closedProposal.choices.forEach((choice, index) => {
  const votes = closedProposal.scores[index];
  const percentage = (votes / closedProposal.scores.reduce((a, b) => a + b)) * 100;
  console.log(`${choice}: ${votes} votes (${percentage.toFixed(1)}%)`);
});
```

---

## Part 6: Governance Analytics

### Get Governance Metrics

```typescript
import { getGovernanceMetrics } from '@/lib/web3/governance-dao';

const metrics = getGovernanceMetrics(proposals, holders, treasuryBalance);

console.log({
  totalProposals: 45,
  activeProposals: 3,
  successfulProposals: 35,
  failedProposals: 7,
  uniqueVoters: 2847,
  averageParticipation: 68.5,
  averageQuorum: 41.2,
  treasuryBalance: 1500000,
  governanceTokens: {
    OP: 2000000000,
    ARB: 1260000000,
    AAVE: 14600000,
  },
});
```

### Analyze Proposal Voting

```typescript
import { analyzeVotingPattern } from '@/lib/web3/governance-dao';

const pattern = analyzeVotingPattern(proposal);

console.log({
  consensus: pattern.consensus.toFixed(1) + '%',
  // How unified voters are (75%+ is strong consensus)
  
  engagement: pattern.engagement.toFixed(1) + '%',
  // % of total voting power that participated
  
  sentiment: pattern.sentiment,
  // 'strongly-for', 'for', 'neutral', 'against', 'strongly-against'
});

// Example outputs:
// - Consensus: 82.3% (strong agreement)
// - Engagement: 61.5% (good participation)
// - Sentiment: strongly-for (clear winner)
```

### Predict Proposal Outcome

```typescript
import { predictProposalOutcome, getTimeRemaining } from '@/lib/web3/governance-dao';

const timeLeft = getTimeRemaining(proposal.endBlock);
const prediction = predictProposalOutcome(
  proposal,
  timeLeft.days * 24 * 60 * 60 * 1000 +
  timeLeft.hours * 60 * 60 * 1000 +
  timeLeft.minutes * 60 * 1000,
  100000 // Total voting power in system
);

console.log({
  passProability: (prediction.passProability * 100).toFixed(0) + '%',
  quorumLikelihood: (prediction.quorumLikelihood * 100).toFixed(0) + '%',
  recommendation: prediction.recommendation,
  // Examples:
  // "Likely to pass" - 95% prob, 89% quorum
  // "Likely to fail" - 25% prob, 82% quorum
  // "May fail due to low participation"
});
```

### Member Profile

```typescript
import { getDAOMemberProfile, formatVotingPower } from '@/lib/web3/governance-dao';

const member = getDAOMemberProfile(
  '0xAlice...',
  { 'OP': 100, 'ARB': 50, 'AAVE': 5 },
  delegations,
  proposals,
  votes
);

console.log({
  address: member.address,
  level: member.contributionLevel,
  // 'bronze', 'silver', 'gold', 'diamond', 'founder'
  
  votingPower: formatVotingPower(member.governance.votingPower),
  // "155" for example above
  
  delegatedFrom: member.governance.delegatedFrom,
  // How many addresses delegate to this member
  
  proposalsCreated: member.governance.proposalsCreated,
  votesParticipated: member.governance.votesParticipated,
  participationRate: member.governance.participationRate.toFixed(1) + '%',
});
```

---

## Part 7: Governance Dashboard Examples

### Active Proposals View

```typescript
// Show all active proposals with voting status
activeProposals.forEach(p => {
  const timeLeft = getTimeRemaining(p.endBlock);
  const stats = p.votingStats;
  
  console.log(`
    ${p.title}
    Status: ${p.status}
    Time Left: ${timeLeft.days}d ${timeLeft.hours}h
    
    Votes:
    For: ${stats.forVotes} (${stats.forPercentage.toFixed(1)}%)
    Against: ${stats.againstVotes} (${stats.againstPercentage.toFixed(1)}%)
    Abstain: ${stats.abstainVotes}
    
    Participation: ${stats.votingPercentage.toFixed(1)}%
    Status: ${stats.forPercentage > 50 ? '✅ Passing' : '❌ Failing'}
  `);
});
```

### Voting Power Breakdown

```typescript
// Show member's voting power by token
const member = holders['0xAlice...'];

console.log('Voting Power Breakdown:');
Object.entries(member.tokens).forEach(([token, balance]) => {
  const token_obj = GOVERNANCE_TOKENS[token];
  console.log(`  ${token}: ${balance} tokens`);
});

console.log(`\nTotal Voting Power: ${formatVotingPower(member.votingPower)}`);

if (member.delegatedTo) {
  console.log(`Delegated to: ${member.delegatedTo}`);
}

console.log(`Receiving delegations: ${member.delegatedFrom.length} members`);
```

### Treasury Report

```typescript
// Generate treasury status report
const report = {
  timestamp: new Date().toISOString(),
  accounts: [
    {
      name: 'Main Treasury',
      balance: 1500000,
      allocation: {
        operations: 30,
        development: 40,
        marketing: 15,
        grants: 10,
        reserve: 5,
      },
    },
  ],
  recentTransactions: treasuryTxs
    .filter(t => t.status === 'executed')
    .slice(-10)
    .map(t => ({
      date: new Date(t.createdAt).toISOString(),
      amount: t.amount,
      recipient: t.recipient,
      purpose: t.purpose,
    })),
  spendingMetrics: {
    monthlyBurn: 125000,
    monthlyIncome: 150000,
    runway: '12 months',
  },
};

console.log(report);
```

---

## Part 8: API Reference

### Governance Token Functions

```typescript
getGovernanceToken(symbol: string): GovernanceToken | undefined
// Get token details by symbol

calculateVotingPower(
  holdings: Record<string, number>,
  weights?: Record<string, number>
): number
// Calculate total voting power from token holdings
```

### Proposal Functions

```typescript
createProposal(
  title: string,
  description: string,
  proposer: string,
  proposalType?: 'text' | 'executable' | 'economic' | 'operational',
  actions?: ProposalAction[]
): Proposal
// Create new proposal

castVote(
  proposal: Proposal,
  voter: string,
  votingPower: number,
  choice: number,
  reason?: string
): { proposal: Proposal; vote: ProposalVote }
// Cast vote on proposal

getProposalStatus(
  proposal: Proposal,
  totalVotingPower: number
): Proposal['status']
// Get current proposal status

getVotingParticipation(proposal: Proposal, totalVotingPower: number): number
// Get % participation
```

### Delegation Functions

```typescript
delegateVotingPower(
  delegator: string,
  delegatee: string,
  votingPower: number,
  tokenId: string
): DelegationEvent
// Delegate voting power

revokeDelegation(
  delegator: string,
  delegatee: string,
  tokenId: string
): DelegationEvent
// Revoke delegation

getTotalDelegatedPower(
  delegatee: string,
  delegations: DelegationEvent[]
): number
// Get total delegated to address

getDelegationChain(
  address: string,
  delegations: DelegationEvent[]
): string[]
// Follow delegation chain
```

### Treasury Functions

```typescript
createTreasuryAccount(
  name: string,
  purpose: string,
  tokenAddress: string,
  multisigAddress?: string,
  signers?: string[]
): DAOTreasuryAccount
// Create treasury account

proposeTreasuryTransaction(
  treasuryId: string,
  amount: number,
  tokenAddress: string,
  recipient: string,
  purpose: string
): DAOTreasuryTransaction
// Propose spending

approveTreasuryTransaction(
  transaction: DAOTreasuryTransaction,
  signer: string
): DAOTreasuryTransaction
// Approve transaction

executeTreasuryTransaction(
  transaction: DAOTreasuryTransaction,
  requiredSignatures: number
): DAOTreasuryTransaction
// Execute approved transaction

getTreasuryBalance(transactions: DAOTreasuryTransaction[]): number
// Get treasury balance
```

### Snapshot Functions

```typescript
createSnapshotProposal(
  title: string,
  body: string,
  choices: string[],
  proposer: string,
  startTime: number,
  endTime: number
): SnapshotProposal
// Create Snapshot proposal

voteOnSnapshot(
  proposal: SnapshotProposal,
  choice: number,
  votingPower: number
): SnapshotProposal
// Vote on Snapshot

getSnapshotWinner(proposal: SnapshotProposal): { choice: string; votes: number }
// Get winning choice
```

### Analytics Functions

```typescript
getGovernanceMetrics(
  proposals: Proposal[],
  holders: GovernanceTokenHolder[],
  treasuryBalance: number
): GovernanceMetrics
// Get overall metrics

analyzeVotingPattern(proposal: Proposal): {
  consensus: number;
  engagement: number;
  sentiment: string;
}
// Analyze proposal voting

predictProposalOutcome(
  proposal: Proposal,
  timeRemaining: number,
  totalVotingPower: number
): { passProability: number; quorumLikelihood: number; recommendation: string }
// Predict outcome

getDAOMemberProfile(
  address: string,
  holdings: Record<string, number>,
  delegations: DelegationEvent[],
  proposals: Proposal[],
  votes: ProposalVote[]
): DAOMember
// Get member profile
```

### Utility Functions

```typescript
formatVotingPower(power: number): string
// Format voting power (155 → "155", 1500000 → "1.50M")

getProposalStatusColor(status: Proposal['status']): string
// Get status color for UI

getVotingChoiceName(choice: number): string
// Get choice name ("For", "Against", "Abstain")

getTimeRemaining(endBlock: number): { days: number; hours: number; minutes: number }
// Get time until voting ends
```

---

## Summary

The governance system provides:

- ✅ Multi-token governance (OP, ARB, AAVE)
- ✅ Proposal creation and voting
- ✅ Vote delegation
- ✅ Multi-sig treasury management
- ✅ Snapshot integration
- ✅ Comprehensive analytics
- ✅ Outcome prediction

Ready for decentralized platform management!
