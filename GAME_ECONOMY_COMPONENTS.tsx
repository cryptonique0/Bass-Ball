/**
 * Bass Ball Game Economy Components
 * React components for match rewards, tournaments, NFTs, and marketplace
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  calculateMatchReward,
  getRewardBracketByMMR,
  getTournamentStats,
  getMarketplaceMetrics,
  getPlayerEconomyMetrics,
  formatReward,
  getRarityColor,
  type MatchReward,
  type Tournament,
  type MarketplaceItem,
  type MarketplaceOrder,
  type Player,
  type PlayerStatsNFT,
  type Achievement,
} from '@/lib/web3/game-economy-adapters';

// ============================================================================
// 1. MATCH REWARD DISPLAY COMPONENT
// ============================================================================

interface MatchRewardDisplayProps {
  reward: MatchReward;
  playerMMR: number;
  showBreakdown?: boolean;
}

export const MatchRewardDisplay: React.FC<MatchRewardDisplayProps> = ({
  reward,
  playerMMR,
  showBreakdown = true,
}) => {
  const bracket = getRewardBracketByMMR(playerMMR);
  const baseAmount = 
    reward.rewardType === 'win' ? bracket.winReward :
    reward.rewardType === 'draw' ? bracket.drawReward :
    bracket.lossReward;

  return (
    <div style={styles.rewardCard}>
      <div style={styles.rewardHeader}>
        <span style={styles.rewardTitle}>
          {reward.rewardType === 'win' && '🏆 Victory'}
          {reward.rewardType === 'loss' && '💔 Defeat'}
          {reward.rewardType === 'draw' && '🤝 Draw'}
        </span>
        <span style={styles.rewardAmount}>
          {formatReward(reward.finalReward)}
        </span>
      </div>

      {showBreakdown && (
        <div style={styles.breakdown}>
          <div style={styles.breakdownRow}>
            <span>Base Reward ({bracket.level})</span>
            <span>{formatReward(baseAmount)}</span>
          </div>
          <div style={styles.breakdownRow}>
            <span>Multiplier</span>
            <span>{reward.multiplier.toFixed(2)}x</span>
          </div>
          <div style={styles.breakdownDivider} />
          <div style={styles.breakdownRow}>
            <span style={{ fontWeight: 'bold' }}>Total</span>
            <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
              {formatReward(reward.finalReward)}
            </span>
          </div>
        </div>
      )}

      <div style={styles.status}>
        {reward.distributed ? (
          <>✅ Claimed to wallet {reward.txHash?.slice(0, 10)}...</>
        ) : (
          <>⏳ Pending distribution</>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 2. REWARD HISTORY COMPONENT
// ============================================================================

interface RewardHistoryProps {
  rewards: MatchReward[];
  playerId: string;
  limit?: number;
}

export const RewardHistory: React.FC<RewardHistoryProps> = ({
  rewards,
  playerId,
  limit = 10,
}) => {
  const playerRewards = rewards
    .filter(r => r.playerId === playerId)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);

  const totalEarned = playerRewards.reduce((sum, r) => sum + r.finalReward, 0);
  const weekTotal = playerRewards
    .filter(r => r.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000)
    .reduce((sum, r) => sum + r.finalReward, 0);

  return (
    <div style={styles.historyContainer}>
      <h3 style={styles.heading}>Recent Rewards</h3>

      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Earned</div>
          <div style={styles.statValue}>{formatReward(totalEarned)}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>This Week</div>
          <div style={styles.statValue}>{formatReward(weekTotal)}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Avg Per Match</div>
          <div style={styles.statValue}>
            {formatReward(playerRewards.length > 0 ? totalEarned / playerRewards.length : 0)}
          </div>
        </div>
      </div>

      <div style={styles.rewardsList}>
        {playerRewards.map((reward, idx) => (
          <div key={idx} style={styles.rewardItem}>
            <span style={styles.rewardItemIcon}>
              {reward.rewardType === 'win' ? '✅' : reward.rewardType === 'draw' ? '➖' : '❌'}
            </span>
            <span style={styles.rewardItemType}>{reward.rewardType.toUpperCase()}</span>
            <span style={styles.rewardItemAmount}>{formatReward(reward.finalReward)}</span>
            <span style={styles.rewardItemDate}>
              {new Date(reward.timestamp).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 3. TOURNAMENT ESCROW MANAGER COMPONENT
// ============================================================================

interface TournamentEscrowManagerProps {
  tournament: Tournament;
  escrowAmount: number;
  participantCount: number;
}

export const TournamentEscrowManager: React.FC<TournamentEscrowManagerProps> = ({
  tournament,
  escrowAmount,
  participantCount,
}) => {
  const stats = getTournamentStats(tournament);

  return (
    <div style={styles.tournamentCard}>
      <div style={styles.tournamentHeader}>
        <h3 style={styles.heading}>{tournament.name}</h3>
        <span style={styles.badge}>
          {tournament.format.toUpperCase().replace('-', ' ')}
        </span>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Players</div>
          <div style={styles.statValue}>{participantCount}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Entry Fee</div>
          <div style={styles.statValue}>${tournament.entryFee}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Prize Pool</div>
          <div style={styles.statValue}>${escrowAmount}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Prize Per Capita</div>
          <div style={styles.statValue}>${stats.prizePerCapita.toFixed(2)}</div>
        </div>
      </div>

      <div style={styles.escrowStatus}>
        <div style={styles.statusBar}>
          <div style={{ ...styles.statusFill, width: `${(participantCount / tournament.maxPlayers) * 100}%` }} />
        </div>
        <div style={styles.statusText}>
          {participantCount} / {tournament.maxPlayers} spots filled
        </div>
      </div>

      <div style={styles.prizeBreakdown}>
        <h4 style={{ margin: '10px 0', fontSize: '14px' }}>Prize Distribution</h4>
        <div style={styles.prizeRow}>
          <span>🥇 1st Place</span>
          <span>${(escrowAmount * (tournament.prizeDistribution?.[0] || 0.5)).toFixed(2)}</span>
        </div>
        <div style={styles.prizeRow}>
          <span>🥈 2nd Place</span>
          <span>${(escrowAmount * (tournament.prizeDistribution?.[1] || 0.3)).toFixed(2)}</span>
        </div>
        <div style={styles.prizeRow}>
          <span>🥉 3rd Place</span>
          <span>${(escrowAmount * (tournament.prizeDistribution?.[2] || 0.2)).toFixed(2)}</span>
        </div>
      </div>

      <button style={styles.button}>
        {tournament.status === 'registration' ? 'Enter Tournament' : 'View Details'}
      </button>
    </div>
  );
};

// ============================================================================
// 4. PLAYER STATS NFT COMPONENT
// ============================================================================

interface PlayerStatsNFTDisplayProps {
  nft: PlayerStatsNFT;
}

export const PlayerStatsNFTDisplay: React.FC<PlayerStatsNFTDisplayProps> = ({
  nft,
}) => {
  const rarityColor = getRarityColor(nft.rarity);

  return (
    <div style={{ ...styles.nftCard, borderColor: rarityColor }}>
      <div style={{ ...styles.nftHeader, background: `linear-gradient(135deg, ${rarityColor}40 0%, transparent 100%)` }}>
        <div style={styles.nftTitle}>
          {nft.playerName}
          <div style={styles.nftSeason}>Season {nft.season}</div>
        </div>
        <div style={{ ...styles.rarityBadge, background: rarityColor }}>
          {nft.rarity.toUpperCase()}
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Win Rate</div>
          <div style={styles.statValue}>{nft.stats.winRate.toFixed(1)}%</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>MMR</div>
          <div style={styles.statValue}>{nft.stats.currentMMR}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Matches</div>
          <div style={styles.statValue}>{nft.stats.totalMatches}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Earnings</div>
          <div style={styles.statValue}>${nft.stats.totalEarnings.toFixed(0)}</div>
        </div>
      </div>

      <div style={styles.achievements}>
        <h4 style={{ margin: '10px 0', fontSize: '14px' }}>Achievements ({nft.achievements.length})</h4>
        <div style={styles.achievementsList}>
          {nft.achievements.slice(0, 5).map((achievement, idx) => (
            <div key={idx} style={styles.achievement}>
              <span>{achievement.icon}</span>
              <span title={achievement.name}>{achievement.name.slice(0, 15)}</span>
            </div>
          ))}
          {nft.achievements.length > 5 && (
            <div style={styles.achievement}>
              <span>+{nft.achievements.length - 5}</span>
            </div>
          )}
        </div>
      </div>

      <button style={styles.button}>View on Explorer</button>
    </div>
  );
};

// ============================================================================
// 5. MARKETPLACE BROWSER COMPONENT
// ============================================================================

interface MarketplaceBrowserProps {
  items: MarketplaceItem[];
  onPurchase?: (item: MarketplaceItem) => void;
}

export const MarketplaceBrowser: React.FC<MarketplaceBrowserProps> = ({
  items,
  onPurchase,
}) => {
  const [selectedRarity, setSelectedRarity] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const filtered = items.filter(
    item =>
      (!selectedRarity || item.rarity === selectedRarity) &&
      (!selectedType || item.type === selectedType)
  );

  const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const types = ['formation', 'cosmetic', 'consumable'];

  return (
    <div style={styles.marketplaceContainer}>
      <h3 style={styles.heading}>Marketplace</h3>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label>Type:</label>
          {types.map(type => (
            <button
              key={type}
              style={{
                ...styles.filterButton,
                ...(selectedType === type && styles.filterButtonActive),
              }}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={styles.filterGroup}>
          <label>Rarity:</label>
          {rarities.map(rarity => (
            <button
              key={rarity}
              style={{
                ...styles.filterButton,
                ...(selectedRarity === rarity && styles.filterButtonActive),
                background: getRarityColor(rarity),
              }}
              onClick={() => setSelectedRarity(selectedRarity === rarity ? null : rarity)}
            >
              {rarity}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.itemsGrid}>
        {filtered.map(item => (
          <div key={item.id} style={{ ...styles.itemCard, borderColor: getRarityColor(item.rarity) }}>
            <div style={styles.itemImage}>{item.image}</div>
            <h4 style={styles.itemName}>{item.name}</h4>
            <p style={styles.itemDescription}>{item.description}</p>

            {item.stats && (
              <div style={styles.itemStats}>
                {Object.entries(item.stats).map(([key, value]) => (
                  <div key={key} style={styles.itemStat}>
                    <span>{key}:</span> <span>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {item.limited && (
              <div style={styles.limitedBadge}>
                Limited: {item.currentSupply}/{item.totalSupply}
              </div>
            )}

            <div style={styles.itemFooter}>
              <span style={styles.itemPrice}>${item.price}</span>
              <button
                style={styles.button}
                onClick={() => onPurchase?.(item)}
              >
                Buy
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 6. MARKETPLACE ORDER HISTORY COMPONENT
// ============================================================================

interface MarketplaceOrderHistoryProps {
  orders: MarketplaceOrder[];
  userWallet?: string;
}

export const MarketplaceOrderHistory: React.FC<MarketplaceOrderHistoryProps> = ({
  orders,
  userWallet,
}) => {
  const metrics = getMarketplaceMetrics(orders);
  const userOrders = userWallet
    ? orders.filter(o => o.seller === userWallet || o.buyer === userWallet)
    : [];

  return (
    <div style={styles.historyContainer}>
      <h3 style={styles.heading}>Marketplace Activity</h3>

      <div style={styles.statsRow}>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Total Volume</div>
          <div style={styles.statValue}>${metrics.totalVolume.toFixed(0)}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Active Listings</div>
          <div style={styles.statValue}>{metrics.activeListings}</div>
        </div>
        <div style={styles.statBox}>
          <div style={styles.statLabel}>Avg Price</div>
          <div style={styles.statValue}>${metrics.averagePrice.toFixed(2)}</div>
        </div>
      </div>

      <div style={styles.rewardsList}>
        <h4 style={{ margin: '10px 0' }}>Your Orders</h4>
        {userOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#7f8c8d' }}>No orders yet</p>
        ) : (
          userOrders.map((order, idx) => (
            <div key={idx} style={styles.rewardItem}>
              <span>{order.orderType === 'listing' ? '📦' : '💰'}</span>
              <span>{order.status.toUpperCase()}</span>
              <span>${order.price}</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 7. PLAYER ECONOMY DASHBOARD COMPONENT
// ============================================================================

interface PlayerEconomyDashboardProps {
  player: Player;
  rewards: MatchReward[];
  orders: MarketplaceOrder[];
}

export const PlayerEconomyDashboard: React.FC<PlayerEconomyDashboardProps> = ({
  player,
  rewards,
  orders,
}) => {
  const metrics = getPlayerEconomyMetrics(player, rewards, orders);

  return (
    <div style={styles.dashboardContainer}>
      <h2 style={styles.heading}>{player.username}'s Economy</h2>

      <div style={styles.metricsGrid}>
        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>💰</div>
          <div style={styles.metricLabel}>Total Earned</div>
          <div style={styles.metricValue}>${metrics.totalEarned.toFixed(2)}</div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>📈</div>
          <div style={styles.metricLabel}>This Week</div>
          <div style={styles.metricValue}>${metrics.earnedThisWeek.toFixed(2)}</div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>⚽</div>
          <div style={styles.metricLabel}>Avg Per Match</div>
          <div style={styles.metricValue}>${metrics.averageRewardPerMatch.toFixed(2)}</div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>🛍️</div>
          <div style={styles.metricLabel}>Items Purchased</div>
          <div style={styles.metricValue}>{metrics.itemsPurchased}</div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>💸</div>
          <div style={styles.metricLabel}>Total Spent</div>
          <div style={styles.metricValue}>${metrics.itemsSpent.toFixed(2)}</div>
        </div>

        <div style={styles.metricBox}>
          <div style={styles.metricIcon}>💎</div>
          <div style={styles.metricLabel}>Net Economy</div>
          <div style={{ ...styles.metricValue, color: metrics.netEconomy > 0 ? '#27ae60' : '#e74c3c' }}>
            ${metrics.netEconomy.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={styles.breakdownGrid}>
        <div style={styles.breakdownBox}>
          <h4>Income Sources</h4>
          <div style={styles.breakdownItem}>
            <span>Match Rewards</span>
            <span>${metrics.totalEarned.toFixed(2)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Tournaments</span>
            <span>Pending...</span>
          </div>
        </div>

        <div style={styles.breakdownBox}>
          <h4>Spending</h4>
          <div style={styles.breakdownItem}>
            <span>Marketplace Items</span>
            <span>${metrics.itemsSpent.toFixed(2)}</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Tournament Entries</span>
            <span>Pending...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 8. ECONOMY STATS DISPLAY COMPONENT
// ============================================================================

interface EconomyStatsDisplayProps {
  totalMatches: number;
  totalRewards: number;
  totalTournamentVolume: number;
  totalMarketplaceVolume: number;
  activePlayers: number;
}

export const EconomyStatsDisplay: React.FC<EconomyStatsDisplayProps> = ({
  totalMatches,
  totalRewards,
  totalTournamentVolume,
  totalMarketplaceVolume,
  activePlayers,
}) => {
  const totalVolume = totalRewards + totalTournamentVolume + totalMarketplaceVolume;
  const avgRewardPerMatch = totalMatches > 0 ? totalRewards / totalMatches : 0;

  return (
    <div style={styles.statsContainer}>
      <h2 style={styles.heading}>Economy Overview</h2>

      <div style={styles.statsGrid}>
        <div style={styles.largeStat}>
          <div style={styles.largeStatValue}>${totalVolume.toFixed(0)}</div>
          <div style={styles.largeStatLabel}>Total Volume</div>
        </div>

        <div style={styles.largeStat}>
          <div style={styles.largeStatValue}>{activePlayers.toLocaleString()}</div>
          <div style={styles.largeStatLabel}>Active Players</div>
        </div>

        <div style={styles.largeStat}>
          <div style={styles.largeStatValue}>{totalMatches.toLocaleString()}</div>
          <div style={styles.largeStatLabel}>Total Matches</div>
        </div>

        <div style={styles.largeStat}>
          <div style={styles.largeStatValue}>${avgRewardPerMatch.toFixed(2)}</div>
          <div style={styles.largeStatLabel}>Avg Reward/Match</div>
        </div>
      </div>

      <div style={styles.breakdownGrid}>
        <div style={styles.breakdownBox}>
          <h4>Volume Breakdown</h4>
          <div style={styles.breakdownItem}>
            <span>Match Rewards</span>
            <span>${totalRewards.toFixed(0)} ({((totalRewards / totalVolume) * 100).toFixed(1)}%)</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Tournaments</span>
            <span>${totalTournamentVolume.toFixed(0)} ({((totalTournamentVolume / totalVolume) * 100).toFixed(1)}%)</span>
          </div>
          <div style={styles.breakdownItem}>
            <span>Marketplace</span>
            <span>${totalMarketplaceVolume.toFixed(0)} ({((totalMarketplaceVolume / totalVolume) * 100).toFixed(1)}%)</span>
          </div>
        </div>

        <div style={styles.breakdownBox}>
          <h4>Health Indicators</h4>
          <div style={styles.healthBar}>
            <div style={{ ...styles.healthFill, width: '85%' }} />
          </div>
          <div style={styles.healthLabel}>System Healthy - 85%</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  rewardCard: {
    background: '#1a1a2e',
    border: '1px solid #16213e',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    color: '#ecf0f1',
  } as React.CSSProperties,

  rewardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    fontWeight: 'bold',
    fontSize: '16px',
  } as React.CSSProperties,

  rewardTitle: {
    fontSize: '14px',
  } as React.CSSProperties,

  rewardAmount: {
    color: '#27ae60',
    fontSize: '18px',
  } as React.CSSProperties,

  breakdown: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '12px',
    fontSize: '13px',
  } as React.CSSProperties,

  breakdownRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  } as React.CSSProperties,

  breakdownDivider: {
    height: '1px',
    background: '#16213e',
    margin: '8px 0',
  } as React.CSSProperties,

  status: {
    fontSize: '12px',
    color: '#95a5a6',
    padding: '8px 0',
  } as React.CSSProperties,

  historyContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  heading: {
    margin: '0 0 16px 0',
    color: '#ecf0f1',
    fontSize: '18px',
  } as React.CSSProperties,

  statsRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  statBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    flex: 1,
  } as React.CSSProperties,

  statLabel: {
    fontSize: '12px',
    color: '#95a5a6',
    marginBottom: '4px',
  } as React.CSSProperties,

  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#ecf0f1',
  } as React.CSSProperties,

  rewardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,

  rewardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#0f3460',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
  } as React.CSSProperties,

  rewardItemIcon: {
    fontSize: '16px',
    minWidth: '24px',
  } as React.CSSProperties,

  rewardItemType: {
    flex: 1,
    color: '#ecf0f1',
  } as React.CSSProperties,

  rewardItemAmount: {
    color: '#27ae60',
    fontWeight: 'bold',
  } as React.CSSProperties,

  rewardItemDate: {
    color: '#95a5a6',
    fontSize: '12px',
  } as React.CSSProperties,

  tournamentCard: {
    background: '#1a1a2e',
    border: '2px solid #16213e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  tournamentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  } as React.CSSProperties,

  badge: {
    background: '#e74c3c',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  escrowStatus: {
    marginBottom: '16px',
  } as React.CSSProperties,

  statusBar: {
    background: '#0f3460',
    height: '8px',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,

  statusFill: {
    background: '#3498db',
    height: '100%',
  } as React.CSSProperties,

  statusText: {
    fontSize: '12px',
    color: '#95a5a6',
  } as React.CSSProperties,

  prizeBreakdown: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '16px',
  } as React.CSSProperties,

  prizeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  } as React.CSSProperties,

  button: {
    width: '100%',
    padding: '10px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  } as React.CSSProperties,

  nftCard: {
    background: '#1a1a2e',
    border: '2px solid #16213e',
    borderRadius: '12px',
    padding: '16px',
    overflow: 'hidden',
  } as React.CSSProperties,

  nftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
  } as React.CSSProperties,

  nftTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  nftSeason: {
    fontSize: '12px',
    color: '#95a5a6',
    marginTop: '4px',
  } as React.CSSProperties,

  rarityBadge: {
    padding: '6px 12px',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  achievements: {
    marginBottom: '16px',
  } as React.CSSProperties,

  achievementsList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  } as React.CSSProperties,

  achievement: {
    background: '#0f3460',
    padding: '6px 10px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
  } as React.CSSProperties,

  marketplaceContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '16px',
  } as React.CSSProperties,

  filters: {
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

  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,

  itemCard: {
    background: '#0f3460',
    border: '1px solid #16213e',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
  } as React.CSSProperties,

  itemImage: {
    fontSize: '48px',
    textAlign: 'center',
    marginBottom: '12px',
  } as React.CSSProperties,

  itemName: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    fontWeight: 'bold',
  } as React.CSSProperties,

  itemDescription: {
    margin: '0 0 8px 0',
    fontSize: '12px',
    color: '#95a5a6',
  } as React.CSSProperties,

  itemStats: {
    background: '#1a1a2e',
    borderRadius: '6px',
    padding: '8px',
    marginBottom: '8px',
    fontSize: '12px',
  } as React.CSSProperties,

  itemStat: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  } as React.CSSProperties,

  limitedBadge: {
    background: '#e74c3c',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    marginBottom: '8px',
    textAlign: 'center',
  } as React.CSSProperties,

  itemFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  } as React.CSSProperties,

  itemPrice: {
    fontWeight: 'bold',
    color: '#27ae60',
  } as React.CSSProperties,

  dashboardContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
  } as React.CSSProperties,

  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
  } as React.CSSProperties,

  metricBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center',
  } as React.CSSProperties,

  metricIcon: {
    fontSize: '32px',
    marginBottom: '8px',
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
  } as React.CSSProperties,

  breakdownGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '12px',
  } as React.CSSProperties,

  breakdownBox: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '12px',
  } as React.CSSProperties,

  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '13px',
  } as React.CSSProperties,

  statsContainer: {
    background: '#1a1a2e',
    borderRadius: '12px',
    padding: '20px',
  } as React.CSSProperties,

  largeStat: {
    background: '#0f3460',
    borderRadius: '8px',
    padding: '20px',
    textAlign: 'center',
  } as React.CSSProperties,

  largeStatValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: '8px',
  } as React.CSSProperties,

  largeStatLabel: {
    fontSize: '13px',
    color: '#95a5a6',
  } as React.CSSProperties,

  healthBar: {
    background: '#1a1a2e',
    height: '10px',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,

  healthFill: {
    background: '#27ae60',
    height: '100%',
  } as React.CSSProperties,

  healthLabel: {
    fontSize: '12px',
    color: '#95a5a6',
  } as React.CSSProperties,
};
