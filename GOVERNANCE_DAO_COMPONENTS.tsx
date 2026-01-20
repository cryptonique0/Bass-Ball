/**
 * Bass Ball Governance & DAO Components
 * React components for proposals, voting, delegation, and treasury management
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  getProposalStatus,
  getVotingParticipation,
  analyzeVotingPattern,
  predictProposalOutcome,
  formatVotingPower,
  getProposalStatusColor,
  getVotingChoiceName,
  getTimeRemaining,
  type Proposal,
  type ProposalVote,
  type DelegationEvent,
  type GovernanceTokenHolder,
  type DAOTreasuryTransaction,
} from '@/lib/web3/governance-dao';

// ============================================================================
// 1. PROPOSAL BROWSER COMPONENT
// ============================================================================

interface ProposalBrowserProps {
  proposals: Proposal[];
  totalVotingPower: number;
  onVote?: (proposal: Proposal) => void;
}

export const ProposalBrowser: React.FC<ProposalBrowserProps> = ({
  proposals,
  totalVotingPower,
  onVote,
}) => {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'ending-soon' | 'trending'>('newest');

  const filtered = useMemo(() => {
    let result = [...proposals];
    
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'ending-soon') return a.endBlock - b.endBlock;
      if (sortBy === 'trending') return b.votingStats.totalVotes - a.votingStats.totalVotes;
      return 0;
    });

    return result;
  }, [proposals, filterStatus, sortBy]);

  const statuses = ['pending', 'active', 'succeeded', 'defeated', 'executed'];

  return (
    <div style={styles.browserContainer}>
      <h3 style={styles.heading}>Proposals</h3>

      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          <label>Status:</label>
          {statuses.map(status => (
            <button
              key={status}
              style={{
                ...styles.filterButton,
                ...(filterStatus === status && styles.filterButtonActive),
              }}
              onClick={() => setFilterStatus(filterStatus === status ? null : status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={styles.sortGroup}>
          <label>Sort:</label>
          <select
            style={styles.select}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="newest">Newest</option>
            <option value="ending-soon">Ending Soon</option>
            <option value="trending">Trending</option>
          </select>
        </div>
      </div>

      <div style={styles.proposalsList}>
        {filtered.map(proposal => {
          const timeLeft = getTimeRemaining(proposal.endBlock);
          const pattern = analyzeVotingPattern(proposal);
          const statusColor = getProposalStatusColor(proposal.status);

          return (
            <div
              key={proposal.id}
              style={{
                ...styles.proposalCard,
                borderLeftColor: statusColor,
              }}
            >
              <div style={styles.proposalHeader}>
                <h4 style={styles.proposalTitle}>{proposal.title}</h4>
                <span style={{ ...styles.badge, background: statusColor }}>
                  {proposal.status.toUpperCase()}
                </span>
              </div>

              <div style={styles.proposalStats}>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Voting</span>
                  <span style={styles.statValue}>
                    {timeLeft.days}d {timeLeft.hours}h
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>For</span>
                  <span style={styles.statValue}>
                    {proposal.votingStats.forPercentage.toFixed(0)}%
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Against</span>
                  <span style={styles.statValue}>
                    {proposal.votingStats.againstPercentage.toFixed(0)}%
                  </span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statLabel}>Participation</span>
                  <span style={styles.statValue}>
                    {proposal.votingStats.votingPercentage.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div style={styles.votingBar}>
                <div
                  style={{
                    ...styles.voteBar,
                    width: `${proposal.votingStats.forPercentage}%`,
                    background: '#27ae60',
                  }}
                />
                <div
                  style={{
                    ...styles.voteBar,
                    width: `${proposal.votingStats.againstPercentage}%`,
                    background: '#e74c3c',
                  }}
                />
              </div>

              <div style={styles.proposalFooter}>
                <span style={styles.consensus}>
                  {pattern.consensus > 75 ? '🟢 Strong' : pattern.consensus > 60 ? '🟡 Moderate' : '🔴 Divided'}
                  {' '}Consensus
                </span>
                <button
                  style={styles.voteButton}
                  onClick={() => onVote?.(proposal)}
                >
                  {proposal.status === 'active' ? 'Vote' : 'View'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 2. VOTING INTERFACE COMPONENT
// ============================================================================

interface VotingInterfaceProps {
  proposal: Proposal;
  userVotingPower: number;
  onSubmitVote?: (choice: number) => void;
}

export const VotingInterface: React.FC<VotingInterfaceProps> = ({
  proposal,
  userVotingPower,
  onSubmitVote,
}) => {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const choices = [
    { id: 1, name: 'Against', icon: '👎', color: '#e74c3c' },
    { id: 0, name: 'Abstain', icon: '➖', color: '#95a5a6' },
    { id: 2, name: 'For', icon: '👍', color: '#27ae60' },
  ];

  const prediction = predictProposalOutcome(
    proposal,
    proposal.votingStats.timeRemaining,
    100000 // Assume 100k total power
  );

  return (
    <div style={styles.votingContainer}>
      <h3 style={styles.heading}>Cast Your Vote</h3>

      <div style={styles.votingPowerBox}>
        <div style={styles.votingPowerLabel}>Your Voting Power</div>
        <div style={styles.votingPowerValue}>{formatVotingPower(userVotingPower)}</div>
      </div>

      <div style={styles.choicesGrid}>
        {choices.map(choice => (
          <button
            key={choice.id}
            style={{
              ...styles.choiceButton,
              ...(selectedChoice === choice.id && {
                ...styles.choiceButtonActive,
                background: choice.color,
              }),
            }}
            onClick={() => setSelectedChoice(choice.id)}
          >
            <div style={styles.choiceIcon}>{choice.icon}</div>
            <div style={styles.choiceName}>{choice.name}</div>
            <div style={styles.choiceVotes}>
              {choice.id === 2
                ? proposal.votingStats.forVotes
                : choice.id === 1
                ? proposal.votingStats.againstVotes
                : proposal.votingStats.abstainVotes}
            </div>
          </button>
        ))}
      </div>

      <div style={styles.reasonBox}>
        <label style={styles.reasonLabel}>Your Reasoning (optional)</label>
        <textarea
          style={styles.reasonInput}
          placeholder="Explain why you're voting this way..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
      </div>

      <div style={styles.predictionBox}>
        <h4 style={{ margin: '0 0 10px 0' }}>Outcome Prediction</h4>
        <div style={styles.predictionItem}>
          <span>Pass Probability:</span>
          <span style={{ color: '#27ae60', fontWeight: 'bold' }}>
            {(prediction.passProability * 100).toFixed(0)}%
          </span>
        </div>
        <div style={styles.predictionItem}>
          <span>Quorum Likelihood:</span>
          <span>{(prediction.quorumLikelihood * 100).toFixed(0)}%</span>
        </div>
        <div style={styles.predictionRecommendation}>
          💡 {prediction.recommendation}
        </div>
      </div>

      <button
        style={{
          ...styles.submitButton,
          opacity: selectedChoice !== null ? 1 : 0.5,
          cursor: selectedChoice !== null ? 'pointer' : 'not-allowed',
        }}
        onClick={() => selectedChoice !== null && onSubmitVote?.(selectedChoice)}
        disabled={selectedChoice === null}
      >
        {selectedChoice !== null ? `Submit Vote (${selectedChoice === 2 ? 'FOR' : selectedChoice === 1 ? 'AGAINST' : 'ABSTAIN'})` : 'Select a Vote'}
      </button>
    </div>
  );
};

// ============================================================================
// 3. DELEGATION MANAGER COMPONENT
// ============================================================================

interface DelegationManagerProps {
  currentUser: string;
  votingPower: number;
  delegations: DelegationEvent[];
  onDelegate?: (delegatee: string, power: number) => void;
}

export const DelegationManager: React.FC<DelegationManagerProps> = ({
  currentUser,
  votingPower,
  delegations,
  onDelegate,
}) => {
  const [delegateeAddress, setDelegateeAddress] = useState('');
  const [powerAmount, setPowerAmount] = useState(votingPower);

  const delegatedTo = delegations.find(
    d => d.delegator === currentUser && d.votingPower > 0
  );

  const receivingDelegations = delegations.filter(
    d => d.delegatee === currentUser && d.votingPower > 0
  );

  return (
    <div style={styles.delegationContainer}>
      <h3 style={styles.heading}>Voting Power Delegation</h3>

      <div style={styles.delegationStats}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Your Voting Power</div>
          <div style={styles.statValue}>{formatVotingPower(votingPower)}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Delegated To</div>
          <div style={styles.statValue}>
            {delegatedTo ? delegatedTo.delegatee.slice(0, 10) + '...' : 'Self'}
          </div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Delegators</div>
          <div style={styles.statValue}>{receivingDelegations.length}</div>
        </div>
      </div>

      {delegatedTo && (
        <div style={styles.currentDelegationBox}>
          <div>Currently delegating {formatVotingPower(delegatedTo.votingPower)} to {delegatedTo.delegatee}</div>
          <button style={styles.revokeButton}>Revoke</button>
        </div>
      )}

      <div style={styles.delegationForm}>
        <div style={styles.formGroup}>
          <label>Delegate To Address</label>
          <input
            style={styles.input}
            placeholder="0x..."
            value={delegateeAddress}
            onChange={(e) => setDelegateeAddress(e.target.value)}
          />
        </div>

        <div style={styles.formGroup}>
          <label>Amount to Delegate</label>
          <div style={styles.powerSlider}>
            <input
              type="range"
              min="0"
              max={votingPower}
              value={powerAmount}
              onChange={(e) => setPowerAmount(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={styles.powerValue}>{formatVotingPower(powerAmount)}</div>
          </div>
        </div>

        <button
          style={styles.delegateButton}
          onClick={() => onDelegate?.(delegateeAddress, powerAmount)}
        >
          Delegate Voting Power
        </button>
      </div>

      {receivingDelegations.length > 0 && (
        <div style={styles.delegatorsBox}>
          <h4>Delegations to You</h4>
          {receivingDelegations.map((d, idx) => (
            <div key={idx} style={styles.delegationItem}>
              <span>{d.delegator.slice(0, 10)}...</span>
              <span>{formatVotingPower(d.votingPower)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. TREASURY DASHBOARD COMPONENT
// ============================================================================

interface TreasuryDashboardProps {
  balance: number;
  transactions: DAOTreasuryTransaction[];
  onProposeTx?: () => void;
}

export const TreasuryDashboard: React.FC<TreasuryDashboardProps> = ({
  balance,
  transactions,
  onProposeTx,
}) => {
  const executed = transactions.filter(t => t.status === 'executed');
  const pending = transactions.filter(t => t.status === 'pending');
  const approved = transactions.filter(t => t.status === 'approved');

  const monthlySpend = executed
    .filter(t => t.executedAt && Date.now() - t.executedAt < 30 * 24 * 60 * 60 * 1000)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div style={styles.treasuryContainer}>
      <h3 style={styles.heading}>Treasury</h3>

      <div style={styles.treasuryStats}>
        <div style={styles.treasuryStat}>
          <div style={styles.treasuryLabel}>Balance</div>
          <div style={styles.treasuryValue}>${balance.toLocaleString()}</div>
        </div>
        <div style={styles.treasuryStat}>
          <div style={styles.treasuryLabel}>Monthly Spend</div>
          <div style={styles.treasuryValue}>${monthlySpend.toLocaleString()}</div>
        </div>
        <div style={styles.treasuryStat}>
          <div style={styles.treasuryLabel}>Pending</div>
          <div style={styles.treasuryValue}>${pending.reduce((s, t) => s + t.amount, 0).toLocaleString()}</div>
        </div>
      </div>

      <div style={styles.transactionTabs}>
        <div style={styles.tabContent}>
          <h4>Recent Transactions</h4>
          <div style={styles.transactionsList}>
            {executed.slice(-5).map((tx, idx) => (
              <div key={idx} style={styles.transactionItem}>
                <div>
                  <div style={styles.txPurpose}>{tx.purpose}</div>
                  <div style={styles.txRecipient}>{tx.recipient.slice(0, 10)}...</div>
                </div>
                <div style={{ ...styles.txAmount, color: '#27ae60' }}>
                  ${tx.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {pending.length > 0 && (
          <div style={styles.tabContent}>
            <h4>Pending Approvals ({pending.length})</h4>
            <div style={styles.transactionsList}>
              {pending.map((tx, idx) => (
                <div key={idx} style={styles.transactionItem}>
                  <div>
                    <div style={styles.txPurpose}>{tx.purpose}</div>
                    <div style={styles.txApprovals}>
                      {tx.approvals.length} approvals
                    </div>
                  </div>
                  <div style={{ color: '#f39c12' }}>⏳</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button style={styles.proposeButton} onClick={onProposeTx}>
        + Propose Transaction
      </button>
    </div>
  );
};

// ============================================================================
// 5. GOVERNANCE METRICS COMPONENT
// ============================================================================

interface GovernanceMetricsProps {
  totalProposals: number;
  activeProposals: number;
  successfulProposals: number;
  uniqueVoters: number;
  averageParticipation: number;
  treasuryBalance: number;
}

export const GovernanceMetrics: React.FC<GovernanceMetricsProps> = ({
  totalProposals,
  activeProposals,
  successfulProposals,
  uniqueVoters,
  averageParticipation,
  treasuryBalance,
}) => {
  const successRate = totalProposals > 0 ? (successfulProposals / totalProposals) * 100 : 0;

  return (
    <div style={styles.metricsContainer}>
      <h3 style={styles.heading}>Governance Overview</h3>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📋</div>
          <div style={styles.metricLabel}>Total Proposals</div>
          <div style={styles.metricValue}>{totalProposals}</div>
          <div style={styles.metricDetail}>{activeProposals} active</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>✅</div>
          <div style={styles.metricLabel}>Success Rate</div>
          <div style={styles.metricValue}>{successRate.toFixed(1)}%</div>
          <div style={styles.metricDetail}>{successfulProposals} passed</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>👥</div>
          <div style={styles.metricLabel}>Governance Members</div>
          <div style={styles.metricValue}>{uniqueVoters.toLocaleString()}</div>
          <div style={styles.metricDetail}>Active participants</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>📊</div>
          <div style={styles.metricLabel}>Avg Participation</div>
          <div style={styles.metricValue}>{averageParticipation.toFixed(1)}%</div>
          <div style={styles.metricDetail}>Of voting power</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>💰</div>
          <div style={styles.metricLabel}>Treasury Balance</div>
          <div style={styles.metricValue}>${(treasuryBalance / 1000000).toFixed(1)}M</div>
          <div style={styles.metricDetail}>Available funds</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricIcon}>🔐</div>
          <div style={styles.metricLabel}>System Health</div>
          <div style={{ ...styles.metricValue, color: '#27ae60' }}>✅ Healthy</div>
          <div style={styles.metricDetail}>All systems operational</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. TOKEN HOLDERS RANKING COMPONENT
// ============================================================================

interface TokenHoldersRankingProps {
  holders: GovernanceTokenHolder[];
  limit?: number;
}

export const TokenHoldersRanking: React.FC<TokenHoldersRankingProps> = ({
  holders,
  limit = 10,
}) => {
  const sorted = [...holders].sort((a, b) => b.votingPower - a.votingPower).slice(0, limit);
  const totalPower = holders.reduce((sum, h) => sum + h.votingPower, 0);

  return (
    <div style={styles.rankingContainer}>
      <h3 style={styles.heading}>Top Token Holders</h3>

      <div style={styles.rankingList}>
        {sorted.map((holder, idx) => {
          const percentage = (holder.votingPower / totalPower) * 100;
          return (
            <div key={idx} style={styles.rankingItem}>
              <div style={styles.rankPosition}>#{idx + 1}</div>
              <div style={styles.rankAddress}>{holder.address.slice(0, 12)}...</div>
              <div style={styles.rankBar}>
                <div
                  style={{
                    ...styles.rankBarFill,
                    width: `${percentage * 2}%`,
                  }}
                />
              </div>
              <div style={styles.rankPower}>{formatVotingPower(holder.votingPower)}</div>
              <div style={styles.rankPercentage}>{percentage.toFixed(2)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  browserContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  heading: {
    margin: '0 0 16px 0',
    color: '#ecf0f1',
    fontSize: '18px',
  } as React.CSSProperties,

  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  } as React.CSSProperties,

  filterButton: {
    padding: '6px 12px',
    background: '#0f3460',
    color: '#ecf0f1',
    border: '1px solid #16213e',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  } as React.CSSProperties,

  filterButtonActive: {
    background: '#3498db',
    borderColor: '#3498db',
    color: 'white',
  } as React.CSSProperties,

  sortGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  } as React.CSSProperties,

  select: {
    padding: '6px 10px',
    background: '#0f3460',
    color: '#ecf0f1',
    border: '1px solid #16213e',
    borderRadius: '6px',
    fontSize: '12px',
  } as React.CSSProperties,

  proposalsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  } as React.CSSProperties,

  proposalCard: {
    background: '#0f3460',
    border: '1px solid #16213e',
    borderLeft: '4px solid #3498db',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  proposalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,

  proposalTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ecf0f1',
  } as React.CSSProperties,

  badge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 'bold',
    color: 'white',
  } as React.CSSProperties,

  proposalStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '8px',
    marginBottom: '12px',
  } as React.CSSProperties,

  statItem: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  statLabel: {
    fontSize: '11px',
    color: '#95a5a6',
    marginBottom: '2px',
  } as React.CSSProperties,

  statValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ecf0f1',
  } as React.CSSProperties,

  votingBar: {
    display: 'flex',
    height: '6px',
    borderRadius: '3px',
    background: '#1a1a2e',
    marginBottom: '12px',
    overflow: 'hidden',
  } as React.CSSProperties,

  voteBar: {
    height: '100%',
  } as React.CSSProperties,

  proposalFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  consensus: {
    fontSize: '12px',
    color: '#95a5a6',
  } as React.CSSProperties,

  voteButton: {
    padding: '6px 12px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  votingContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
  } as React.CSSProperties,

  votingPowerBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  votingPowerLabel: {
    fontSize: '12px',
    color: '#95a5a6',
    marginBottom: '4px',
  } as React.CSSProperties,

  votingPowerValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#27ae60',
  } as React.CSSProperties,

  choicesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  choiceButton: {
    background: '#0f3460',
    border: '2px solid #16213e',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    color: '#ecf0f1',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,

  choiceButtonActive: {
    borderColor: '#3498db',
  } as React.CSSProperties,

  choiceIcon: {
    fontSize: '32px',
  } as React.CSSProperties,

  choiceName: {
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  choiceVotes: {
    fontSize: '12px',
    color: '#95a5a6',
  } as React.CSSProperties,

  reasonBox: {
    marginBottom: '16px',
  } as React.CSSProperties,

  reasonLabel: {
    display: 'block',
    fontSize: '13px',
    marginBottom: '6px',
    color: '#ecf0f1',
  } as React.CSSProperties,

  reasonInput: {
    width: '100%',
    background: '#0f3460',
    color: '#ecf0f1',
    border: '1px solid #16213e',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '13px',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  predictionBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    fontSize: '13px',
  } as React.CSSProperties,

  predictionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  } as React.CSSProperties,

  predictionRecommendation: {
    marginTop: '8px',
    padding: '8px',
    background: '#1a1a2e',
    borderRadius: '4px',
    fontSize: '12px',
  } as React.CSSProperties,

  submitButton: {
    width: '100%',
    padding: '12px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,

  delegationContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  delegationStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  statBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  currentDelegationBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  revokeButton: {
    padding: '6px 12px',
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  } as React.CSSProperties,

  delegationForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  input: {
    background: '#0f3460',
    color: '#ecf0f1',
    border: '1px solid #16213e',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '13px',
  } as React.CSSProperties,

  powerSlider: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  } as React.CSSProperties,

  powerValue: {
    minWidth: '80px',
    fontSize: '13px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  delegateButton: {
    padding: '10px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,

  delegatorsBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  delegationItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #16213e',
    fontSize: '12px',
  } as React.CSSProperties,

  treasuryContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  treasuryStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  treasuryStat: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  treasuryLabel: {
    fontSize: '12px',
    color: '#95a5a6',
    marginBottom: '4px',
  } as React.CSSProperties,

  treasuryValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#27ae60',
  } as React.CSSProperties,

  transactionTabs: {
    marginBottom: '16px',
  } as React.CSSProperties,

  tabContent: {
    marginBottom: '12px',
  } as React.CSSProperties,

  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  transactionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #16213e',
    fontSize: '12px',
  } as React.CSSProperties,

  txPurpose: {
    fontWeight: 'bold',
    marginBottom: '2px',
  } as React.CSSProperties,

  txRecipient: {
    fontSize: '11px',
    color: '#95a5a6',
  } as React.CSSProperties,

  txAmount: {
    fontWeight: 'bold',
  } as React.CSSProperties,

  txApprovals: {
    fontSize: '11px',
    color: '#95a5a6',
  } as React.CSSProperties,

  proposeButton: {
    width: '100%',
    padding: '10px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  } as React.CSSProperties,

  metricsContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,

  metricCard: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    textAlign: 'center',
  } as React.CSSProperties,

  metricIcon: {
    fontSize: '28px',
    marginBottom: '6px',
  } as React.CSSProperties,

  metricLabel: {
    fontSize: '12px',
    color: '#95a5a6',
    marginBottom: '4px',
  } as React.CSSProperties,

  metricValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ecf0f1',
    marginBottom: '4px',
  } as React.CSSProperties,

  metricDetail: {
    fontSize: '11px',
    color: '#7f8c8d',
  } as React.CSSProperties,

  rankingContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,

  rankingItem: {
    display: 'grid',
    gridTemplateColumns: '30px 100px 1fr 100px 70px',
    gap: '12px',
    alignItems: 'center',
    background: '#0f3460',
    padding: '10px 12px',
    borderRadius: '6px',
    fontSize: '12px',
  } as React.CSSProperties,

  rankPosition: {
    fontWeight: 'bold',
    color: '#3498db',
  } as React.CSSProperties,

  rankAddress: {
    color: '#95a5a6',
  } as React.CSSProperties,

  rankBar: {
    background: '#1a1a2e',
    height: '4px',
    borderRadius: '2px',
    overflow: 'hidden',
  } as React.CSSProperties,

  rankBarFill: {
    background: '#3498db',
    height: '100%',
  } as React.CSSProperties,

  rankPower: {
    fontWeight: 'bold',
    textAlign: 'right',
  } as React.CSSProperties,

  rankPercentage: {
    color: '#27ae60',
    fontWeight: 'bold',
  } as React.CSSProperties,
};
