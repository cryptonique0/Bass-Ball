# 💧 Liquidity Pool Analytics - React Components & Examples

**Status**: ✅ Production Ready  
**Components**: 8 ready-to-use React components  
**Integration**: Copy & paste examples  

---

## 🚀 Component Library

### 1. Top Pools Widget
```tsx
import React from 'react';
import { getTopPoolsByAPY, getTopPoolsByTVL } from '@/lib/web3/liquidity-pool-analytics';

interface TopPoolsWidgetProps {
  sortBy?: 'apy' | 'tvl';
  limit?: number;
  onPoolSelect?: (poolId: string) => void;
}

export function TopPoolsWidget({ sortBy = 'apy', limit = 5, onPoolSelect }: TopPoolsWidgetProps) {
  const pools = sortBy === 'apy'
    ? getTopPoolsByAPY(limit)
    : getTopPoolsByTVL(limit);

  return (
    <div className="top-pools-widget">
      <h2>🏆 Top Pools</h2>
      <div className="pools-list">
        {pools.map((pool, index) => (
          <div key={pool.id} className="pool-item">
            <div className="pool-rank">#{index + 1}</div>
            <div className="pool-info">
              <h3>{pool.name}</h3>
              <p className="pool-dex">{pool.dex}</p>
              <div className="pool-stats">
                <span>TVL: ${(pool.tvl / 1000000).toFixed(1)}M</span>
                <span>APY: {pool.apy.toFixed(1)}%</span>
                <span className={`risk-badge risk-${pool.riskLevel}`}>
                  {pool.riskLevel}
                </span>
              </div>
            </div>
            <button 
              className="btn-primary"
              onClick={() => onPoolSelect?.(pool.id)}
            >
              Invest
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 2. Pool Search/Finder
```tsx
import React, { useState } from 'react';
import { searchPools } from '@/lib/web3/liquidity-pool-analytics';

interface PoolFinderProps {
  onPoolSelect?: (poolId: string) => void;
}

export function PoolFinder({ onPoolSelect }: PoolFinderProps) {
  const [token0, setToken0] = useState('');
  const [token1, setToken1] = useState('');
  const [dex, setDex] = useState('');
  const [minApy, setMinApy] = useState(0);
  const [sortBy, setSortBy] = useState<'apy' | 'tvl' | 'volume'>('apy');

  const results = searchPools({
    token0: token0 || undefined,
    token1: token1 || undefined,
    dex: dex || undefined,
    minApy: minApy || undefined,
    sortBy,
    order: 'desc',
  });

  return (
    <div className="pool-finder">
      <h2>🔍 Find Pools</h2>
      
      <div className="filters">
        <input
          type="text"
          placeholder="Token 0 (e.g., ETH)"
          value={token0}
          onChange={(e) => setToken0(e.target.value.toUpperCase())}
          className="filter-input"
        />
        <input
          type="text"
          placeholder="Token 1 (e.g., USDC)"
          value={token1}
          onChange={(e) => setToken1(e.target.value.toUpperCase())}
          className="filter-input"
        />
        <select value={dex} onChange={(e) => setDex(e.target.value)} className="filter-select">
          <option value="">All DEXs</option>
          <option value="Uniswap V3">Uniswap V3</option>
          <option value="Aerodrome">Aerodrome</option>
          <option value="Curve Finance">Curve Finance</option>
          <option value="Balancer">Balancer</option>
        </select>
        <input
          type="number"
          placeholder="Min APY"
          value={minApy}
          onChange={(e) => setMinApy(Number(e.target.value))}
          className="filter-input"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="filter-select">
          <option value="apy">Sort by APY</option>
          <option value="tvl">Sort by TVL</option>
          <option value="volume">Sort by Volume</option>
        </select>
      </div>

      <div className="results">
        {results.length === 0 ? (
          <p className="no-results">No pools found matching your criteria</p>
        ) : (
          <div className="pools-table">
            <thead>
              <tr>
                <th>Pool</th>
                <th>DEX</th>
                <th>TVL</th>
                <th>APY</th>
                <th>24h Volume</th>
                <th>Risk</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {results.map((pool) => (
                <tr key={pool.id}>
                  <td className="pool-name">{pool.name}</td>
                  <td>{pool.dex}</td>
                  <td>${(pool.tvl / 1000000).toFixed(1)}M</td>
                  <td className="apy-value">{pool.apy.toFixed(2)}%</td>
                  <td>${(pool.volume24h / 1000000).toFixed(1)}M</td>
                  <td>
                    <span className={`risk-badge risk-${pool.riskLevel}`}>
                      {pool.riskLevel}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => onPoolSelect?.(pool.id)}
                      className="btn-small"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 3. APY Calculator
```tsx
import React, { useState } from 'react';
import { calculateProjectedYield, getPoolById } from '@/lib/web3/liquidity-pool-analytics';

interface APYCalculatorProps {
  poolId: string;
}

export function APYCalculator({ poolId }: APYCalculatorProps) {
  const [amount, setAmount] = useState(10000);
  const [days, setDays] = useState(365);
  const [volatility, setVolatility] = useState(15);

  const pool = getPoolById(poolId);
  if (!pool) return <p>Pool not found</p>;

  const result = calculateProjectedYield({
    poolId,
    investmentAmount: amount,
    daysToInvest: days,
    volatility,
  });

  return (
    <div className="apy-calculator">
      <h2>💰 APY Calculator</h2>
      <div className="pool-header">
        <h3>{pool.name}</h3>
        <span className="current-apy">Current APY: {pool.apy}%</span>
      </div>

      <div className="calculator-form">
        <div className="form-group">
          <label>Investment Amount</label>
          <div className="input-group">
            <span className="currency">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="input-field"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Investment Period</label>
          <div className="input-group">
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-field"
              min="1"
            />
            <span className="unit">days</span>
          </div>
          <small>
            {(days / 365).toFixed(2)} years
          </small>
        </div>

        <div className="form-group">
          <label>Expected Volatility</label>
          <input
            type="range"
              min="0"
            max="100"
            value={volatility}
            onChange={(e) => setVolatility(Number(e.target.value))}
            className="slider"
          />
          <span className="volatility-label">{volatility}%</span>
        </div>
      </div>

      <div className="results-grid">
        <div className="result-item">
          <label>Projected Yield</label>
          <span className="value">${result.projectedYield.toFixed(2)}</span>
        </div>
        <div className="result-item">
          <label>Total Value</label>
          <span className="value">${result.projectedTotal.toFixed(2)}</span>
        </div>
        <div className="result-item warning">
          <label>Impermanent Loss</label>
          <span className="value">{result.impermanentLoss.toFixed(2)}%</span>
        </div>
        <div className="result-item highlight">
          <label>Net Yield</label>
          <span className="value">${result.netYield.toFixed(2)}</span>
        </div>
      </div>

      <div className="disclaimer">
        <p>⚠️ Calculations are estimates. Actual returns may vary based on market conditions.</p>
      </div>
    </div>
  );
}
```

---

### 4. Risk Indicator
```tsx
import React from 'react';
import { getPoolAnalytics } from '@/lib/web3/liquidity-pool-analytics';

interface RiskIndicatorProps {
  poolId: string;
  volatility?: number;
  showDetails?: boolean;
}

export function RiskIndicator({ poolId, volatility = 15, showDetails = true }: RiskIndicatorProps) {
  const analytics = getPoolAnalytics(poolId, volatility);
  const { riskMetrics, recommendations } = analytics;

  const getRiskColor = (score: number) => {
    if (score < 25) return '#22c55e'; // Green
    if (score < 50) return '#eab308'; // Yellow
    if (score < 75) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskLabel = (score: number) => {
    if (score < 25) return '✅ Very Low';
    if (score < 50) return '⚠️ Low-Medium';
    if (score < 75) return '🔴 Medium-High';
    return '🚨 Very High';
  };

  return (
    <div className="risk-indicator">
      <h3>⚠️ Risk Analysis</h3>

      <div className="risk-score">
        <div className="score-circle" style={{ borderColor: getRiskColor(riskMetrics.riskScore) }}>
          <span className="score-number">{riskMetrics.riskScore}</span>
          <span className="score-label">/100</span>
        </div>
        <div className="risk-label">
          <h4>{getRiskLabel(riskMetrics.riskScore)}</h4>
        </div>
      </div>

      {showDetails && (
        <>
          <div className="risk-details">
            <div className="detail-item">
              <span className="label">Impermanent Loss Risk</span>
              <span className="value">{riskMetrics.impermanentLoss.toFixed(2)}%</span>
              <div className="progress-bar">
                <div 
                  className="progress" 
                  style={{ width: `${Math.min(riskMetrics.impermanentLoss * 10, 100)}%` }}
                />
              </div>
            </div>

            <div className="detail-item">
              <span className="label">Slippage on Typical Trade</span>
              <span className="value">{riskMetrics.slippage.toFixed(3)}%</span>
            </div>

            <div className="detail-item">
              <span className="label">Price Volatility</span>
              <span className="value">{riskMetrics.volatility.toFixed(2)}%</span>
            </div>
          </div>

          <div className="recommendations">
            <h4>💡 Recommendations</h4>
            <ul>
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
```

---

### 5. Portfolio Allocator
```tsx
import React, { useState } from 'react';
import { getPortfolioRecommendation } from '@/lib/web3/liquidity-pool-analytics';

interface PortfolioAllocatorProps {
  totalAmount: number;
  onInvest?: (allocation: any) => void;
}

export function PortfolioAllocator({ totalAmount, onInvest }: PortfolioAllocatorProps) {
  const [profile, setProfile] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  
  const recommendation = getPortfolioRecommendation(profile);

  const profiles = [
    {
      id: 'conservative',
      label: '🛡️ Conservative',
      description: 'Low risk, stable returns',
      emoji: '🛡️',
    },
    {
      id: 'balanced',
      label: '⚖️ Balanced',
      description: 'Mix of safety and yield',
      emoji: '⚖️',
    },
    {
      id: 'aggressive',
      label: '🚀 Aggressive',
      description: 'High yield, higher risk',
      emoji: '🚀',
    },
  ];

  return (
    <div className="portfolio-allocator">
      <h2>🎯 Portfolio Allocator</h2>

      <div className="profile-selector">
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`profile-button ${profile === p.id ? 'active' : ''}`}
            onClick={() => setProfile(p.id as any)}
          >
            <span className="emoji">{p.emoji}</span>
            <span className="label">{p.label}</span>
            <span className="description">{p.description}</span>
          </button>
        ))}
      </div>

      <div className="portfolio-summary">
        <h3>Recommended Allocation</h3>
        <div className="expected-apy">
          <span className="label">Expected Portfolio APY</span>
          <span className="value">{recommendation.expectedPortfolioAPY}%</span>
        </div>
      </div>

      <div className="allocation-list">
        {recommendation.allocation.map((item, i) => {
          const amount = (totalAmount * item.weight) / 100;
          return (
            <div key={i} className="allocation-item">
              <div className="allocation-header">
                <span className="pool-name">{item.pool}</span>
                <span className="dex-badge">{item.dex}</span>
              </div>
              <div className="allocation-details">
                <div className="weight">
                  <span className="label">Weight</span>
                  <span className="value">{item.weight}%</span>
                </div>
                <div className="amount">
                  <span className="label">Amount</span>
                  <span className="value">${amount.toFixed(2)}</span>
                </div>
                <div className="apy">
                  <span className="label">Pool APY</span>
                  <span className="value">{item.apy}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="action-buttons">
        <button className="btn-primary" onClick={() => onInvest?.(recommendation)}>
          Invest ${totalAmount.toLocaleString()}
        </button>
      </div>
    </div>
  );
}
```

---

### 6. Market Dashboard
```tsx
import React from 'react';
import { 
  getMarketStats, 
  getDEXStats, 
  getLiquidityDistribution 
} from '@/lib/web3/liquidity-pool-analytics';

export function MarketDashboard() {
  const market = getMarketStats();
  const dexStats = getDEXStats();
  const distribution = getLiquidityDistribution();

  return (
    <div className="market-dashboard">
      <h2>📊 Market Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="label">Total TVL</span>
          <span className="value">${(market.totalTVL / 1000000).toFixed(1)}M</span>
        </div>
        <div className="stat-card">
          <span className="label">24h Volume</span>
          <span className="value">${(market.totalVolume24h / 1000000).toFixed(1)}M</span>
        </div>
        <div className="stat-card">
          <span className="label">Average APY</span>
          <span className="value">{market.averageAPY.toFixed(2)}%</span>
        </div>
        <div className="stat-card">
          <span className="label">Active Pools</span>
          <span className="value">{market.poolCount}</span>
        </div>
      </div>

      <div className="dex-comparison">
        <h3>💱 DEX Comparison</h3>
        {dexStats.map((dex) => (
          <div key={dex.dex} className="dex-stat">
            <span className="dex-name">{dex.dex}</span>
            <div className="dex-metrics">
              <span className="tvl">TVL: ${(dex.tvl / 1000000).toFixed(1)}M</span>
              <span className="volume">Vol: ${(dex.volume24h / 1000000).toFixed(1)}M</span>
              <span className="pools">Pools: {dex.poolCount}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="liquidity-pie">
        <h3>🥧 Liquidity Distribution</h3>
        <div className="distribution-list">
          {distribution.map((item) => (
            <div key={item.dex} className="distribution-item">
              <span>{item.dex}</span>
              <div className="bar">
                <div 
                  className="fill" 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <span>{item.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

### 7. Pool Comparison
```tsx
import React, { useState } from 'react';
import { getPoolById, comparePoolAPY, getPoolAnalytics } from '@/lib/web3/liquidity-pool-analytics';

interface PoolComparisonProps {
  poolIds: string[];
}

export function PoolComparison({ poolIds }: PoolComparisonProps) {
  const [selectedVolatility, setSelectedVolatility] = useState(15);

  const pools = poolIds
    .map(id => getPoolById(id))
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const comparison = comparePoolAPY(poolIds);

  return (
    <div className="pool-comparison">
      <h2>⚖️ Pool Comparison</h2>

      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Pool</th>
              <th>DEX</th>
              <th>TVL</th>
              <th>24h Volume</th>
              <th>APY</th>
              <th>Fee</th>
              <th>Risk</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((pool) => {
              const analytics = getPoolAnalytics(pool.id, selectedVolatility);
              return (
                <tr key={pool.id} className={`risk-${pool.riskLevel}`}>
                  <td className="pool-name">{pool.name}</td>
                  <td>{pool.dex}</td>
                  <td>${(pool.tvl / 1000000).toFixed(1)}M</td>
                  <td>${(pool.volume24h / 1000000).toFixed(1)}M</td>
                  <td className="apy">{pool.apy.toFixed(2)}%</td>
                  <td>{(pool.fee / 10000).toFixed(2)}%</td>
                  <td>{analytics.riskMetrics.riskScore}</td>
                  <td>⭐ {(analytics.riskMetrics.riskScore / 20).toFixed(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### 8. Impermanent Loss Warning
```tsx
import React, { useState } from 'react';
import { getPoolById, getImpermanentLossWarning } from '@/lib/web3/liquidity-pool-analytics';

interface ImpermanentLossWarningProps {
  poolId: string;
}

export function ImpermanentLossWarning({ poolId }: ImpermanentLossWarningProps) {
  const [price0Change, setPrice0Change] = useState(10);
  const [price1Change, setPrice1Change] = useState(-5);

  const pool = getPoolById(poolId);
  if (!pool) return null;

  const warning = getImpermanentLossWarning(pool, price0Change, price1Change);

  const getWarningColor = (warning: string) => {
    if (warning.includes('✅')) return '#22c55e';
    if (warning.includes('⚠️')) return '#eab308';
    if (warning.includes('🔴')) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="il-warning">
      <h3>📉 Impermanent Loss Scenario</h3>

      <div className="scenario-inputs">
        <div className="input-group">
          <label>{pool.token0.symbol} Price Change</label>
          <div className="slider-group">
            <input
              type="range"
              min="-50"
              max="50"
              value={price0Change}
              onChange={(e) => setPrice0Change(Number(e.target.value))}
              className="slider"
            />
            <span className="value">{price0Change > 0 ? '+' : ''}{price0Change}%</span>
          </div>
        </div>

        <div className="input-group">
          <label>{pool.token1.symbol} Price Change</label>
          <div className="slider-group">
            <input
              type="range"
              min="-50"
              max="50"
              value={price1Change}
              onChange={(e) => setPrice1Change(Number(e.target.value))}
              className="slider"
            />
            <span className="value">{price1Change > 0 ? '+' : ''}{price1Change}%</span>
          </div>
        </div>
      </div>

      <div 
        className="warning-box" 
        style={{ borderColor: getWarningColor(warning.warning) }}
      >
        <span className="warning-icon" style={{ color: getWarningColor(warning.warning) }}>
          {warning.warning}
        </span>
        <div className="warning-details">
          <p><strong>IL Loss:</strong> {warning.ilPercent.toFixed(2)}%</p>
          <p><strong>Recommendation:</strong> {warning.recommendation}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 CSS Utilities

```css
/* Risk Level Colors */
.risk-very-low { background-color: #d4edda; color: #155724; }
.risk-low { background-color: #cfe2ff; color: #084298; }
.risk-low-medium { background-color: #fff3cd; color: #664d03; }
.risk-medium { background-color: #ffe5cc; color: #cc5200; }
.risk-medium-high { background-color: #f8d7da; color: #842029; }
.risk-high { background-color: #f5c6cb; color: #721c24; }

/* APY Display */
.apy-value { 
  color: #22c55e; 
  font-weight: bold; 
  font-size: 1.1em;
}

/* Highlight Cards */
.highlight { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.warning { 
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}
```

---

## ✅ Integration Tips

1. **Use Top Pools Widget** for homepage
2. **Embed Pool Finder** in DeFi section
3. **Show APY Calculator** in pool detail page
4. **Display Risk Indicator** before depositing
5. **Recommend Portfolio** to new LPs
6. **Use Market Dashboard** for analytics page
7. **Compare Pools** side-by-side
8. **Warn of IL Risk** in advanced settings

---

**Status**: ✅ All Components Production Ready  
**Last Updated**: January 20, 2026
