/**
 * Cross-Chain Swap UI Components
 * Ready-to-use React components for cross-chain route finding and comparison
 */

import React, { useState, useEffect } from 'react';
import {
  getOptimalCrossChainPath,
  compareAllRoutes,
  getAllCrossChainRoutes,
  analyzeRouteImpact,
  analyzeLiquidityDistribution,
  getSupportedChains,
  getSupportedAssets,
  formatRoute,
  exportRouteForExecution,
  type CrossChainRoute,
  type CrossChainComparison,
} from '@/lib/web3/cross-chain-swap-optimizer';

// ============================================================================
// 1. ROUTE FINDER WIDGET
// ============================================================================

interface RouteFinderProps {
  onRouteSelected?: (route: CrossChainRoute) => void;
}

export function RouteFinder({ onRouteSelected }: RouteFinderProps) {
  const [fromAsset, setFromAsset] = useState('ETH');
  const [fromChain, setFromChain] = useState('ethereum');
  const [toAsset, setToAsset] = useState('USDC');
  const [toChain, setToChain] = useState('base');
  const [amount, setAmount] = useState('1.0');
  const [priority, setPriority] = useState<'cheapest' | 'fastest' | 'best-rate' | 'balanced'>('balanced');
  
  const [bestRoute, setBestRoute] = useState<CrossChainRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chains = getSupportedChains();

  const handleFindRoute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const route = getOptimalCrossChainPath(
        fromAsset,
        fromChain,
        toAsset,
        toChain,
        amount,
        { priority, maxSlippage: 1.0 }
      );
      setBestRoute(route);
      onRouteSelected?.(route);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find route');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="route-finder">
      <h2>🌉 Cross-Chain Swap Finder</h2>

      <div className="finder-form">
        <div className="form-row">
          <div className="form-group">
            <label>From Asset</label>
            <input
              type="text"
              value={fromAsset}
              onChange={(e) => setFromAsset(e.target.value.toUpperCase())}
              placeholder="ETH, USDC, DAI"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>From Chain</label>
            <select 
              value={fromChain} 
              onChange={(e) => setFromChain(e.target.value)}
              className="input-select"
            >
              {chains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>To Asset</label>
            <input
              type="text"
              value={toAsset}
              onChange={(e) => setToAsset(e.target.value.toUpperCase())}
              placeholder="ETH, USDC, DAI"
              className="input-field"
            />
          </div>

          <div className="form-group">
            <label>To Chain</label>
            <select 
              value={toChain} 
              onChange={(e) => setToChain(e.target.value)}
              className="input-select"
            >
              {chains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Amount</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.0"
              className="input-field"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value as any)}
              className="input-select"
            >
              <option value="cheapest">💰 Cheapest</option>
              <option value="fastest">⚡ Fastest</option>
              <option value="best-rate">💱 Best Rate</option>
              <option value="balanced">⚖️ Balanced</option>
            </select>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="btn-primary btn-large"
          onClick={handleFindRoute}
          disabled={loading}
        >
          {loading ? '⏳ Finding Routes...' : '🔍 Find Best Route'}
        </button>
      </div>

      {bestRoute && (
        <div className="route-result">
          <h3>✓ Best Route Found</h3>
          
          <div className="route-path">
            <p>{formatRoute(bestRoute)}</p>
          </div>

          <div className="result-metrics">
            <div className="metric">
              <span className="label">Output</span>
              <span className="value">{bestRoute.outputAmount} {bestRoute.endAsset.symbol}</span>
            </div>
            <div className="metric">
              <span className="label">Rate</span>
              <span className="value">{bestRoute.rate.toFixed(4)}</span>
            </div>
            <div className="metric">
              <span className="label">Total Cost</span>
              <span className="value highlight">${bestRoute.totalCost.toFixed(2)}</span>
            </div>
            <div className="metric">
              <span className="label">Time</span>
              <span className="value">{(bestRoute.totalTime / 60).toFixed(1)}m</span>
            </div>
          </div>

          <button className="btn-secondary">View Details</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 2. COST BREAKDOWN DISPLAY
// ============================================================================

interface CostBreakdownProps {
  route: CrossChainRoute;
}

export function CostBreakdown({ route }: CostBreakdownProps) {
  const feesPercent = (route.totalFee / (route.totalCost || 1)) * 100;
  const gasPercent = (route.totalGasCost / (route.totalCost || 1)) * 100;

  return (
    <div className="cost-breakdown">
      <h3>💰 Cost Breakdown</h3>

      <div className="cost-summary">
        <div className="summary-item">
          <span>Input</span>
          <span>{route.inputAmount} {route.startAsset.symbol}</span>
        </div>
        <div className="summary-item">
          <span>Output</span>
          <span className="highlight">{route.outputAmount} {route.endAsset.symbol}</span>
        </div>
      </div>

      <div className="cost-chart">
        <div className="cost-item fees">
          <div className="bar" style={{ width: `${feesPercent}%` }} />
          <span>Fees & Slippage: ${route.totalFee.toFixed(2)} ({feesPercent.toFixed(0)}%)</span>
        </div>
        <div className="cost-item gas">
          <div className="bar" style={{ width: `${gasPercent}%` }} />
          <span>Gas Costs: ${route.totalGasCost.toFixed(2)} ({gasPercent.toFixed(0)}%)</span>
        </div>
      </div>

      <div className="cost-total">
        <span>Total Cost</span>
        <span className="value">${route.totalCost.toFixed(2)}</span>
      </div>

      <div className="impact-metrics">
        <div className="metric">
          <span>Price Impact</span>
          <span className={route.priceImpact > 1 ? 'warning' : ''}>{route.priceImpact.toFixed(2)}%</span>
        </div>
        <div className="metric">
          <span>Slippage</span>
          <span>{route.effectiveSlippage.toFixed(2)}%</span>
        </div>
        <div className="metric">
          <span>Exchange Rate</span>
          <span>{route.rate.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 3. ROUTE COMPARISON TABLE
// ============================================================================

interface RouteComparisonTableProps {
  comparison: CrossChainComparison;
  onSelect?: (route: CrossChainRoute) => void;
}

export function RouteComparisonTable({ comparison, onSelect }: RouteComparisonTableProps) {
  const [sortBy, setSortBy] = useState<'cost' | 'rate' | 'time' | 'score'>('score');

  const sorted = [...comparison.routes].sort((a, b) => {
    switch (sortBy) {
      case 'cost':
        return a.totalCost - b.totalCost;
      case 'rate':
        return a.rate - b.rate;
      case 'time':
        return a.totalTime - b.totalTime;
      case 'score':
      default:
        return b.overallScore - a.overallScore;
    }
  });

  return (
    <div className="route-comparison-table">
      <h3>🗺️ Route Comparison</h3>

      <div className="sort-controls">
        {['score', 'cost', 'rate', 'time'].map(key => (
          <button
            key={key}
            className={`sort-btn ${sortBy === key ? 'active' : ''}`}
            onClick={() => setSortBy(key as any)}
          >
            Sort by {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>Route</th>
            <th>Steps</th>
            <th>Output</th>
            <th>Cost</th>
            <th>Rate</th>
            <th>Time</th>
            <th>Score</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((route, i) => {
            const stepNames = route.steps.map(s => s.protocol.name.split(' ')[0]).join('→');
            const isBest = route.id === comparison.recommended.id;

            return (
              <tr key={route.id} className={isBest ? 'highlighted' : ''}>
                <td>
                  <span className="route-path">{stepNames || 'Direct'}</span>
                </td>
                <td>{route.steps.length}</td>
                <td>{parseFloat(route.outputAmount).toFixed(2)}</td>
                <td className="highlight">${route.totalCost.toFixed(2)}</td>
                <td>{route.rate.toFixed(4)}</td>
                <td>{(route.totalTime / 60).toFixed(1)}m</td>
                <td>
                  <span className="score-badge">{route.overallScore.toFixed(0)}</span>
                </td>
                <td>
                  <button 
                    className="btn-small"
                    onClick={() => onSelect?.(route)}
                  >
                    Select
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// 4. IMPACT ANALYSIS PANEL
// ============================================================================

interface ImpactAnalysisPanelProps {
  route: CrossChainRoute;
}

export function ImpactAnalysisPanel({ route }: ImpactAnalysisPanelProps) {
  const impact = analyzeRouteImpact(route);

  const getRiskColor = (factors: number) => {
    if (factors === 0) return '#22c55e';
    if (factors <= 1) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="impact-analysis">
      <h3>📊 Impact & Risk Analysis</h3>

      <div className="impact-breakdown">
        <div className="breakdown-item">
          <span>Bridge Impact</span>
          <span className="value">{impact.priceImpactBreakdown.bridgeImpact.toFixed(3)}%</span>
        </div>
        <div className="breakdown-item">
          <span>DEX Impact</span>
          <span className="value">{impact.priceImpactBreakdown.dexImpact.toFixed(3)}%</span>
        </div>
        <div className="breakdown-item total">
          <span>Total Impact</span>
          <span className="value">{impact.priceImpactBreakdown.totalImpact.toFixed(3)}%</span>
        </div>
      </div>

      {impact.slippageWarning && (
        <div className="warning-box">
          <span className="icon">⚠️</span>
          <span>{impact.slippageWarning}</span>
        </div>
      )}

      <div className="risk-factors">
        <h4>Risk Factors ({impact.riskFactors.length})</h4>
        {impact.riskFactors.length === 0 ? (
          <p className="no-risks">✓ No identified risks</p>
        ) : (
          <ul>
            {impact.riskFactors.map((factor, i) => (
              <li key={i}>
                <span 
                  className="risk-indicator"
                  style={{ backgroundColor: getRiskColor(impact.riskFactors.length) }}
                />
                {factor}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="recommendations">
        <h4>Recommendations ({impact.recommendations.length})</h4>
        <ul>
          {impact.recommendations.map((rec, i) => (
            <li key={i}>💡 {rec}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// 5. LIQUIDITY DISTRIBUTION CHART
// ============================================================================

interface LiquidityChartProps {
  asset: string;
  amount?: number;
}

export function LiquidityChart({ asset, amount = 100000 }: LiquidityChartProps) {
  const analysis = analyzeLiquidityDistribution(asset, amount);
  const maxLiquidity = Math.max(...Object.values(analysis).map(a => a.available));

  return (
    <div className="liquidity-chart">
      <h3>💧 {asset} Liquidity Distribution</h3>

      <div className="chart-container">
        {Object.entries(analysis).map(([chain, data]) => (
          <div key={chain} className="chain-liquidity">
            <div className="chain-header">
              <span className="chain-name">{data.chain}</span>
              <span className={`risk-badge risk-${data.riskLevel}`}>
                {data.riskLevel.toUpperCase()}
              </span>
            </div>

            <div className="bar-wrapper">
              <div className="bar-background">
                <div
                  className="bar-fill"
                  style={{ width: `${(data.available / maxLiquidity) * 100}%` }}
                />
              </div>
              <span className="bar-label">${(data.available / 1000000).toFixed(1)}M</span>
            </div>

            <div className="breakdown">
              <span className="native">
                🔗 Native: {((data.nativeAmount / data.available) * 100).toFixed(0)}%
              </span>
              <span className="bridged">
                🌉 Bridged: {data.concentration.toFixed(0)}%
              </span>
            </div>

            <p className="note">{data.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 6. ROUTE STEP VISUALIZER
// ============================================================================

interface RouteStepVisualizerProps {
  route: CrossChainRoute;
}

export function RouteStepVisualizer({ route }: RouteStepVisualizerProps) {
  return (
    <div className="route-visualizer">
      <h3>🔄 Route Execution Steps</h3>

      <div className="steps-container">
        {route.steps.length === 0 ? (
          <div className="direct-transfer">
            <div className="step-node">
              <span className="node-label">Direct Transfer</span>
              <span className="node-amount">{route.inputAmount}</span>
            </div>
          </div>
        ) : (
          <>
            {route.steps.map((step, i) => (
              <div key={i} className="step-row">
                {i > 0 && <div className="arrow">→</div>}
                
                <div className="step-box">
                  <div className="step-header">
                    <span className="type-badge">{step.type.toUpperCase()}</span>
                    <span className="protocol">{step.protocol.name}</span>
                  </div>

                  <div className="step-details">
                    <div className="amount-flow">
                      <span className="input">{parseFloat(step.inputAmount).toFixed(2)} {step.fromAsset.symbol}</span>
                      <span className="arrow">→</span>
                      <span className="output">{parseFloat(step.outputAmount).toFixed(2)} {step.toAsset.symbol}</span>
                    </div>

                    <div className="metrics">
                      <span>Fee: ${step.fee.toFixed(2)}</span>
                      <span>Impact: {step.priceImpact.toFixed(2)}%</span>
                      <span>Time: {step.executionTime}s</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="summary">
        <div className="summary-item">
          <span>Total Steps</span>
          <span>{route.steps.length}</span>
        </div>
        <div className="summary-item">
          <span>Total Time</span>
          <span>{(route.totalTime / 60).toFixed(1)}m</span>
        </div>
        <div className="summary-item">
          <span>Bottleneck</span>
          <span>{route.bottleneck?.protocol.name || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 7. EXECUTION READINESS CHECKER
// ============================================================================

interface ExecutionReadinessProps {
  route: CrossChainRoute;
  amount: string;
  onExecute?: () => void;
}

export function ExecutionReadiness({ route, amount, onExecute }: ExecutionReadinessProps) {
  const [checks, setChecks] = useState({
    sufficientFunds: true,
    slippageAcceptable: true,
    liquidityAvailable: true,
    timeAcceptable: true,
  });

  const allChecksPassed = Object.values(checks).every(v => v);

  const exportData = exportRouteForExecution(route);

  return (
    <div className="execution-readiness">
      <h3>✅ Execution Checklist</h3>

      <div className="checklist">
        <div className={`check-item ${checks.sufficientFunds ? 'pass' : 'fail'}`}>
          <span className="icon">{checks.sufficientFunds ? '✓' : '✗'}</span>
          <span>Sufficient funds: {amount} {route.startAsset.symbol}</span>
        </div>

        <div className={`check-item ${checks.slippageAcceptable ? 'pass' : 'fail'}`}>
          <span className="icon">{checks.slippageAcceptable ? '✓' : '✗'}</span>
          <span>Slippage acceptable: {route.effectiveSlippage.toFixed(2)}%</span>
        </div>

        <div className={`check-item ${checks.liquidityAvailable ? 'pass' : 'fail'}`}>
          <span className="icon">{checks.liquidityAvailable ? '✓' : '✗'}</span>
          <span>Liquidity available on all steps</span>
        </div>

        <div className={`check-item ${checks.timeAcceptable ? 'pass' : 'fail'}`}>
          <span className="icon">{checks.timeAcceptable ? '✓' : '✗'}</span>
          <span>Acceptable execution time: {(route.totalTime / 60).toFixed(1)}m</span>
        </div>
      </div>

      {allChecksPassed ? (
        <div className="ready-to-execute">
          <p>🎯 All checks passed! Ready to execute.</p>
          <button 
            className="btn-primary btn-large"
            onClick={onExecute}
          >
            Execute Swap
          </button>
        </div>
      ) : (
        <div className="not-ready">
          <p>⚠️ Please address failed checks before proceeding.</p>
          <button className="btn-secondary" disabled>
            Execute Swap
          </button>
        </div>
      )}

      <details className="execution-data">
        <summary>📋 Execution Data (for developers)</summary>
        <pre>{exportData}</pre>
      </details>
    </div>
  );
}

// ============================================================================
// CSS STYLES
// ============================================================================

const crossChainCss = `
/* Route Finder */
.route-finder {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  max-width: 600px;
}

.finder-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 600;
  font-size: 14px;
  color: #374151;
}

.input-field,
.input-select {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.input-field:focus,
.input-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-large {
  padding: 14px 24px;
  font-size: 16px;
  font-weight: 600;
}

.route-result {
  background: linear-gradient(135deg, #667eea15, #764ba215);
  border: 1px solid #667eea;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.route-path {
  font-weight: 600;
  color: #667eea;
  margin: 15px 0;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.result-metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 15px 0;
}

/* Cost Breakdown */
.cost-breakdown {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.cost-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin: 20px 0;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.cost-chart {
  margin: 20px 0;
}

.cost-item {
  margin-bottom: 15px;
}

.cost-item .bar {
  height: 30px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  margin-bottom: 8px;
}

.cost-total {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 6px;
  font-weight: 600;
  font-size: 18px;
}

/* Route Comparison */
.route-comparison-table {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.sort-controls {
  display: flex;
  gap: 10px;
  margin: 15px 0;
  flex-wrap: wrap;
}

.sort-btn {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.sort-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.comparison-table th {
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e5e7eb;
  font-weight: 600;
  font-size: 13px;
  color: #6b7280;
}

.comparison-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table tr.highlighted {
  background: #f0f4ff;
  border-left: 3px solid #667eea;
}

.route-path {
  font-weight: 600;
  color: #667eea;
}

.score-badge {
  background: linear-gradient(135deg, #84cc16, #22c55e);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

/* Impact Analysis */
.impact-analysis {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.impact-breakdown {
  background: #f9fafb;
  border-radius: 8px;
  padding: 15px;
  margin: 15px 0;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.breakdown-item.total {
  border-top: 2px solid #e5e7eb;
  padding-top: 12px;
  margin-top: 8px;
  font-weight: 600;
}

.warning-box {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  padding: 12px;
  margin: 15px 0;
  color: #78350f;
}

.risk-factors,
.recommendations {
  margin-top: 15px;
}

.risk-factors h4,
.recommendations h4 {
  margin: 10px 0;
  font-size: 14px;
  font-weight: 600;
}

.risk-factors ul,
.recommendations ul {
  list-style: none;
  padding: 0;
}

.risk-factors li,
.recommendations li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 14px;
}

.risk-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

/* Liquidity Chart */
.liquidity-chart {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.chart-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 15px;
}

.chain-liquidity {
  padding: 15px;
  background: #f9fafb;
  border-radius: 8px;
}

.chain-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chain-name {
  font-weight: 600;
}

.risk-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.risk-low { background: #d4edda; color: #155724; }
.risk-medium { background: #fff3cd; color: #664d03; }
.risk-high { background: #f8d7da; color: #842029; }

.bar-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 10px 0;
}

.bar-background {
  flex: 1;
  height: 24px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.bar-label {
  font-weight: 600;
  min-width: 60px;
  text-align: right;
}

.breakdown {
  display: flex;
  gap: 15px;
  margin-top: 8px;
  font-size: 12px;
}

.breakdown .native { color: #059669; }
.breakdown .bridged { color: #dc2626; }

.note {
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

/* Route Visualizer */
.route-visualizer {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.steps-container {
  margin: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.step-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.arrow {
  color: #9ca3af;
  font-weight: bold;
  font-size: 18px;
}

.step-box {
  flex: 1;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  background: #f9fafb;
}

.step-header {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.type-badge {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.protocol {
  font-weight: 600;
  color: #374151;
}

.step-details {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  font-size: 13px;
}

.amount-flow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input, .output {
  font-weight: 600;
}

.input { color: #ef4444; }
.output { color: #22c55e; }

.metrics {
  display: flex;
  gap: 15px;
  color: #6b7280;
}

/* Execution Readiness */
.execution-readiness {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.checklist {
  margin: 20px 0;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  border-left: 3px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 4px;
}

.check-item.pass {
  border-left-color: #22c55e;
  background: #d4edda;
}

.check-item.fail {
  border-left-color: #ef4444;
  background: #f8d7da;
}

.check-item .icon {
  font-weight: bold;
  font-size: 18px;
}

.ready-to-execute,
.not-ready {
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  margin-top: 20px;
}

.ready-to-execute {
  background: #d4edda;
  border: 1px solid #22c55e;
  color: #155724;
}

.not-ready {
  background: #f8d7da;
  border: 1px solid #ef4444;
  color: #842029;
}

.execution-data {
  margin-top: 20px;
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
}

.execution-data summary {
  cursor: pointer;
  font-weight: 600;
  margin-bottom: 10px;
}

.execution-data pre {
  overflow-x: auto;
  font-size: 11px;
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .result-metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .comparison-table {
    font-size: 12px;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 8px;
  }

  .step-details {
    flex-direction: column;
  }
}
`;

export const CrossChainStyles = crossChainCss;
