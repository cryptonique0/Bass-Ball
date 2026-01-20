/**
 * Gas Optimization UI Components
 * Ready-to-use React components for gas tracking, batching, and optimization
 * 
 * Components:
 * 1. Gas Price Tracker - Real-time gas prices with grades
 * 2. Batch Manager - Add, manage, and submit transactions
 * 3. Route Optimizer - Compare and select optimal routes
 * 4. Savings Calculator - Show savings vs direct approach
 * 5. Portfolio Dashboard - 30-day gas analytics
 * 6. Gas Alerts - Notifications and recommendations
 * 7. Route Comparison - Side-by-side route metrics
 * 8. Transaction Queue Viewer - Pending batch visualization
 */

import React, { useState, useEffect } from 'react';
import {
  getCurrentGasPrice,
  getOptimalGasTime,
  getGasPricePercentile,
  getGasPriceGrade,
  formatGasPrice,
  getPendingBatch,
  estimateBatchGas,
  calculateBatchSavings,
  addToBatch,
  submitBatch,
  getCompletedBatches,
  optimizeRoute,
  compareRoutes,
  getPortfolioGasAnalysis,
  getGasSpendingTrend,
  getGasAlerts,
  type GasPrice,
  type Transaction,
  type Route,
} from '@/lib/web3/gas-optimization';

// ============================================================================
// 1. GAS PRICE TRACKER
// ============================================================================

export function GasPriceTracker() {
  const [prices, setPrices] = useState<GasPrice | null>(null);
  const [grade, setGrade] = useState<any>(null);
  const [timing, setTiming] = useState<any>(null);
  const [percentile, setPercentile] = useState<any>(null);

  useEffect(() => {
    const update = () => {
      const currentPrices = getCurrentGasPrice();
      setPrices(currentPrices);
      setGrade(getGasPriceGrade(currentPrices.current));
      setTiming(getOptimalGasTime());
      setPercentile(getGasPricePercentile());
    };

    update();
    const interval = setInterval(update, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (!prices || !grade) return <div className="loading">Loading gas data...</div>;

  return (
    <div className="gas-price-tracker">
      <h2>⛽ Gas Price Tracker</h2>

      <div className="price-display">
        <div className="current-price">
          <span className="label">Current Gas Price</span>
          <span className="value" style={{ color: grade.color }}>
            {formatGasPrice(prices.current)}
          </span>
          <div className="grade-badge" style={{ backgroundColor: grade.color }}>
            {grade.grade}
          </div>
        </div>

        <div className="price-options">
          <div className="price-option">
            <span className="label">Low</span>
            <span className="value">{formatGasPrice(prices.low)}</span>
            <span className="desc">~30-60s</span>
          </div>
          <div className="price-option">
            <span className="label">Standard</span>
            <span className="value">{formatGasPrice(prices.standard)}</span>
            <span className="desc">~15-30s</span>
          </div>
          <div className="price-option">
            <span className="label">High</span>
            <span className="value">{formatGasPrice(prices.high)}</span>
            <span className="desc">~5-15s</span>
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <span className="label">Price Percentile</span>
          <span className="value">{percentile?.percentile || 0}th</span>
          <span className="desc">{percentile?.rating || 'average'}</span>
        </div>
        <div className="metric">
          <span className="label">Recommendation</span>
          <span className="value">{timing?.recommendation.toUpperCase()}</span>
          <span className="desc">{timing?.timeframe}</span>
        </div>
      </div>

      <div className="recommendation-box" style={{ borderLeft: `4px solid ${grade.color}` }}>
        <p className="reason">{grade.recommendation}</p>
        {timing?.expectedGasSavings && (
          <p className="savings">
            {timing.expectedGasSavings > 0 ? '💰' : '⚠️'} 
            {Math.abs(timing.expectedGasSavings)}% difference from average
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. BATCH MANAGER
// ============================================================================

interface BatchManagerProps {
  onBatchSubmitted?: (batchId: string) => void;
}

export function BatchManager({ onBatchSubmitted }: BatchManagerProps) {
  const [pending, setPending] = useState<Transaction[]>([]);
  const [gasEstimate, setGasEstimate] = useState(0);
  const [savings, setSavings] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTx, setNewTx] = useState({
    type: 'swap' as any,
    to: '',
    data: '',
    description: '',
  });

  useEffect(() => {
    const update = () => {
      const batch = getPendingBatch();
      setPending(batch);
      const estimate = estimateBatchGas(batch);
      setGasEstimate(estimate);
      const report = calculateBatchSavings(batch);
      setSavings(report);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTransaction = () => {
    if (newTx.to && newTx.data) {
      addToBatch({
        to: newTx.to,
        data: newTx.data,
        value: '0',
        gasLimit: 100000,
        type: newTx.type,
        description: newTx.description,
      });
      setNewTx({ type: 'swap', to: '', data: '', description: '' });
      setShowAddForm(false);

      // Update UI
      const batch = getPendingBatch();
      setPending(batch);
      const estimate = estimateBatchGas(batch);
      setGasEstimate(estimate);
    }
  };

  const handleSubmitBatch = () => {
    const batch = submitBatch();
    onBatchSubmitted?.(batch.id);
    setPending([]);
    setGasEstimate(0);
  };

  return (
    <div className="batch-manager">
      <h2>📦 Batch Manager</h2>

      <div className="batch-stats">
        <div className="stat">
          <span className="label">Pending Transactions</span>
          <span className="value">{pending.length}</span>
        </div>
        <div className="stat">
          <span className="label">Estimated Gas</span>
          <span className="value">{gasEstimate.toLocaleString()}</span>
        </div>
        {savings && (
          <>
            <div className="stat highlight">
              <span className="label">Savings</span>
              <span className="value">{savings.savingsPercent}%</span>
            </div>
            <div className="stat highlight">
              <span className="label">Save</span>
              <span className="value">${savings.savingsUSD}</span>
            </div>
          </>
        )}
      </div>

      {savings && (
        <div className="savings-recommendation">
          {savings.recommendation}
        </div>
      )}

      <div className="transaction-list">
        <h3>Queued Transactions</h3>
        {pending.length === 0 ? (
          <p className="empty">No transactions in batch yet</p>
        ) : (
          pending.map((tx, i) => (
            <div key={tx.id} className="transaction-item">
              <div className="tx-number">#{i + 1}</div>
              <div className="tx-info">
                <span className="type">{tx.type.toUpperCase()}</span>
                <span className="description">{tx.description}</span>
              </div>
              <div className="tx-gas">
                {tx.estimatedGas?.toLocaleString()} units
              </div>
            </div>
          ))
        )}
      </div>

      <div className="batch-actions">
        {showAddForm ? (
          <div className="add-tx-form">
            <input
              type="text"
              placeholder="To Address"
              value={newTx.to}
              onChange={(e) => setNewTx({ ...newTx, to: e.target.value })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Calldata"
              value={newTx.data}
              onChange={(e) => setNewTx({ ...newTx, data: e.target.value })}
              className="input-field"
            />
            <input
              type="text"
              placeholder="Description"
              value={newTx.description}
              onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
              className="input-field"
            />
            <select
              value={newTx.type}
              onChange={(e) => setNewTx({ ...newTx, type: e.target.value as any })}
              className="input-select"
            >
              <option value="approve">Approve</option>
              <option value="swap">Swap</option>
              <option value="bridge">Bridge</option>
              <option value="deposit">Deposit</option>
              <option value="withdraw">Withdraw</option>
            </select>
            <div className="form-buttons">
              <button className="btn-primary" onClick={handleAddTransaction}>
                Add
              </button>
              <button className="btn-secondary" onClick={() => setShowAddForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              className="btn-secondary"
              onClick={() => setShowAddForm(true)}
            >
              + Add Transaction
            </button>
            {pending.length > 0 && (
              <button
                className="btn-primary"
                onClick={handleSubmitBatch}
              >
                Submit Batch ({pending.length} txs)
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. ROUTE OPTIMIZER
// ============================================================================

interface RouteOptimizerProps {
  amount: number;
  inputToken: string;
  outputToken: string;
  fromChain: string;
  toChain: string;
}

export function RouteOptimizer({
  amount,
  inputToken,
  outputToken,
  fromChain,
  toChain,
}: RouteOptimizerProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    const allRoutes = compareRoutes(amount, inputToken, outputToken, fromChain, toChain);
    setRoutes(allRoutes);
    setSelectedRoute(allRoutes[0]);
  }, [amount, inputToken, outputToken, fromChain, toChain]);

  return (
    <div className="route-optimizer">
      <h2>🗺️ Route Optimizer</h2>

      <div className="route-comparison">
        {routes.map((route, i) => {
          const routeNames = ['Cheapest', 'Fastest', 'Balanced'];
          const isSelected = selectedRoute?.id === route.id;

          return (
            <div
              key={route.id}
              className={`route-card ${isSelected ? 'selected' : ''}`}
              onClick={() => setSelectedRoute(route)}
            >
              <h4>{routeNames[i]}</h4>
              <div className="route-metrics">
                <div className="metric">
                  <span className="label">Cost</span>
                  <span className="value">${(route.totalCost * 0.000001).toFixed(2)}</span>
                </div>
                <div className="metric">
                  <span className="label">Time</span>
                  <span className="value">{route.executionTime}s</span>
                </div>
                <div className="metric highlight">
                  <span className="label">Savings</span>
                  <span className="value">{route.savingsPercent}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedRoute && (
        <div className="route-details">
          <h3>Route Details</h3>
          <div className="steps">
            {selectedRoute.steps.map((step, i) => (
              <div key={i} className="step">
                <div className="step-number">{i + 1}</div>
                <div className="step-info">
                  <h4>{step.type.toUpperCase()}</h4>
                  <p className="protocol">{step.protocol}</p>
                  <p className="pair">
                    {step.inputAmount} {step.inputToken} → {step.outputAmount} {step.outputToken}
                  </p>
                </div>
                <div className="step-gas">{step.estimatedGas.toLocaleString()} gas</div>
              </div>
            ))}
          </div>

          <div className="gas-breakdown">
            <h4>Gas Breakdown</h4>
            <div className="breakdown-items">
              {selectedRoute.gasBreakdown.bridgeCost > 0 && (
                <div className="breakdown-item">
                  <span>Bridge</span>
                  <span>{selectedRoute.gasBreakdown.bridgeCost.toLocaleString()}</span>
                </div>
              )}
              {selectedRoute.gasBreakdown.dexCost > 0 && (
                <div className="breakdown-item">
                  <span>DEX</span>
                  <span>{selectedRoute.gasBreakdown.dexCost.toLocaleString()}</span>
                </div>
              )}
              <div className="breakdown-item">
                <span>Approval</span>
                <span>{selectedRoute.gasBreakdown.approveCost.toLocaleString()}</span>
              </div>
              <div className="breakdown-item total">
                <span>Total</span>
                <span>{selectedRoute.gasBreakdown.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button className="btn-primary">Execute Route</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 4. SAVINGS CALCULATOR
// ============================================================================

export function SavingsCalculator() {
  const [pending, setPending] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<any>(null);

  useEffect(() => {
    const batch = getPendingBatch();
    setPending(batch);
    const report = calculateBatchSavings(batch);
    setSavings(report);
  }, []);

  if (!savings) return null;

  const savingsFraction = savings.savingsPercent / 100;
  const recommendation = savings.recommendation;

  return (
    <div className="savings-calculator">
      <h2>💰 Savings Analysis</h2>

      <div className="comparison-chart">
        <div className="bar-item">
          <label>Direct Approach</label>
          <div className="bar">
            <div className="bar-fill direct" style={{ width: '100%' }}>
              ${(savings.directApproachCost * 0.000001).toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bar-item">
          <label>Batch Optimization</label>
          <div className="bar">
            <div
              className="bar-fill optimized"
              style={{ width: `${(savings.optimizedRouteCost / savings.directApproachCost) * 100}%` }}
            >
              ${(savings.optimizedRouteCost * 0.000001).toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      <div className="savings-summary">
        <div className="summary-item">
          <span className="label">Total Savings</span>
          <span className="value highlight">${savings.savingsUSD}</span>
        </div>
        <div className="summary-item">
          <span className="label">Savings %</span>
          <span className="value highlight">{savings.savingsPercent}%</span>
        </div>
        <div className="summary-item">
          <span className="label">Transactions</span>
          <span className="value">{pending.length}</span>
        </div>
        {savings.breakEvenPoint && (
          <div className="summary-item">
            <span className="label">Break-Even Point</span>
            <span className="value">{savings.breakEvenPoint} txs</span>
          </div>
        )}
      </div>

      <div className={`recommendation ${recommendation.includes('✅') ? 'positive' : 'warning'}`}>
        {recommendation}
      </div>

      <div className="details">
        <h4>Calculation Details</h4>
        <p>
          By batching {pending.length} transaction{pending.length !== 1 ? 's' : ''} together, you save on overhead
          gas costs and network fees. The direct approach would submit each transaction individually,
          incurring separate transaction overhead (~21,000 gas each).
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 5. PORTFOLIO DASHBOARD
// ============================================================================

export function PortfolioDashboard() {
  const [analysis, setAnalysis] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);

  useEffect(() => {
    const portfolioAnalysis = getPortfolioGasAnalysis();
    setAnalysis(portfolioAnalysis);

    const trendData = getGasSpendingTrend(30);
    setTrend(trendData);
  }, []);

  if (!analysis) return <div className="loading">Loading analytics...</div>;

  const maxSpent = Math.max(...trend.map(t => t.spent));

  return (
    <div className="portfolio-dashboard">
      <h2>📊 Gas Spending Dashboard</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="label">Total Spent (30d)</span>
          <span className="value">{analysis.totalGasSpent30d}</span>
        </div>
        <div className="stat-card">
          <span className="label">Average per TX</span>
          <span className="value">{analysis.averageGasPerTx}</span>
        </div>
        <div className="stat-card">
          <span className="label">Most Expensive</span>
          <span className="value">{analysis.mostExpensiveOperation.cost}</span>
          <span className="desc">{analysis.mostExpensiveOperation.type}</span>
        </div>
        <div className="stat-card highlight">
          <span className="label">Potential Savings</span>
          <span className="value">{analysis.estimatedMonthlyOptimization}</span>
        </div>
      </div>

      <div className="spending-chart">
        <h3>Daily Spending Trend</h3>
        <div className="chart-bars">
          {trend.map((day, i) => (
            <div key={i} className="bar-wrapper">
              <div
                className="bar"
                style={{ height: `${(day.spent / maxSpent) * 100}%` }}
                title={`${day.date}: $${day.spent.toFixed(2)} (${day.txCount} txs)`}
              />
              {i % 5 === 0 && <span className="label">{day.date.substring(5)}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="opportunities">
        <h3>💡 Optimization Opportunities</h3>
        <ul>
          {analysis.optimizationOpportunities.map((opp: string, i: number) => (
            <li key={i}>{opp}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ============================================================================
// 6. GAS ALERTS
// ============================================================================

export function GasAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const update = () => {
      const newAlerts = getGasAlerts();
      setAlerts(newAlerts);
    };

    update();
    const interval = setInterval(update, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id: string) => {
    setDismissedIds(new Set([...dismissedIds, id]));
  };

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="gas-alerts">
      {visibleAlerts.map((alert) => (
        <div key={alert.id} className={`alert alert-${alert.severity}`}>
          <div className="alert-content">
            <span className="type">{alert.type.replace('_', ' ').toUpperCase()}</span>
            <p className="message">{alert.message}</p>
          </div>
          <div className="alert-actions">
            {alert.actionUrl && (
              <a href={alert.actionUrl} className="btn-small">Action</a>
            )}
            <button
              className="btn-dismiss"
              onClick={() => handleDismiss(alert.id)}
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 7. ROUTE COMPARISON TABLE
// ============================================================================

interface RouteComparisonProps {
  routes: Route[];
  selectedId?: string;
  onSelect?: (routeId: string) => void;
}

export function RouteComparison({ routes, selectedId, onSelect }: RouteComparisonProps) {
  return (
    <div className="route-comparison-table">
      <h3>Route Comparison</h3>
      <table>
        <thead>
          <tr>
            <th>Priority</th>
            <th>Protocol Steps</th>
            <th>Total Cost</th>
            <th>Time</th>
            <th>Savings</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {routes.map((route, i) => {
            const priorities = ['Cheapest', 'Fastest', 'Balanced'];
            const isSelected = selectedId === route.id;

            return (
              <tr
                key={route.id}
                className={isSelected ? 'selected' : ''}
                onClick={() => onSelect?.(route.id)}
              >
                <td>{priorities[i]}</td>
                <td>{route.steps.map(s => s.protocol).join(' → ')}</td>
                <td>${(route.totalCost * 0.000001).toFixed(2)}</td>
                <td>{route.executionTime}s</td>
                <td className="highlight">${(route.savings * 0.000001).toFixed(2)} ({route.savingsPercent}%)</td>
                <td>
                  <button className="btn-small" onClick={() => onSelect?.(route.id)}>
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
// 8. TRANSACTION QUEUE VIEWER
// ============================================================================

export function TransactionQueueViewer() {
  const [pending, setPending] = useState<Transaction[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [tab, setTab] = useState<'pending' | 'completed'>('pending');

  useEffect(() => {
    const update = () => {
      const batch = getPendingBatch();
      setPending(batch);

      const completedBatches = getCompletedBatches(10);
      setCompleted(completedBatches);
    };

    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="transaction-queue-viewer">
      <h2>📋 Transaction Queue</h2>

      <div className="tabs">
        <button
          className={`tab ${tab === 'pending' ? 'active' : ''}`}
          onClick={() => setTab('pending')}
        >
          Pending ({pending.length})
        </button>
        <button
          className={`tab ${tab === 'completed' ? 'active' : ''}`}
          onClick={() => setTab('completed')}
        >
          Completed ({completed.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div className="queue-list">
          {pending.length === 0 ? (
            <p className="empty">No pending transactions</p>
          ) : (
            pending.map((tx) => (
              <div key={tx.id} className="queue-item">
                <div className="item-header">
                  <span className="type-badge">{tx.type}</span>
                  <span className="description">{tx.description}</span>
                </div>
                <div className="item-details">
                  <span>To: {tx.to.slice(0, 10)}...</span>
                  {tx.estimatedGas && <span>Gas: {tx.estimatedGas.toLocaleString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'completed' && (
        <div className="completed-list">
          {completed.length === 0 ? (
            <p className="empty">No completed batches</p>
          ) : (
            completed.map((batch) => (
              <div key={batch.id} className="completed-item">
                <div className="item-header">
                  <span className="batch-id">{batch.id}</span>
                  <span className={`status status-${batch.status}`}>{batch.status}</span>
                </div>
                <div className="item-details">
                  <span>{batch.transactions.length} transactions</span>
                  <span>{batch.totalGasEstimate.toLocaleString()} gas</span>
                  <span>
                    {new Date(batch.timestamp).toLocaleDateString()}
                  </span>
                </div>
                {batch.explorerUrl && (
                  <a href={batch.explorerUrl} target="_blank" rel="noopener noreferrer" className="btn-small">
                    View
                  </a>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CSS UTILITIES
// ============================================================================

const gasCss = `
/* Gas Price Tracker */
.gas-price-tracker {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.price-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.current-price {
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  position: relative;
}

.grade-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  color: white;
  font-size: 12px;
}

.price-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.price-option {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.recommendation-box {
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 8px;
  margin-top: 15px;
}

/* Batch Manager */
.batch-manager {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.batch-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.stat {
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
}

.stat.highlight {
  background: linear-gradient(135deg, #84cc16 0%, #22c55e 100%);
  color: white;
}

.transaction-list {
  margin: 20px 0;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 8px;
  gap: 15px;
}

.tx-number {
  background: #f3f4f6;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  font-size: 12px;
}

.tx-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.type {
  font-weight: bold;
  font-size: 12px;
  text-transform: uppercase;
}

.description {
  color: #6b7280;
  font-size: 14px;
}

.tx-gas {
  color: #667eea;
  font-weight: bold;
}

/* Route Optimizer */
.route-optimizer {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.route-comparison {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.route-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.route-card:hover {
  border-color: #667eea;
  background: #f3f4f6;
}

.route-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea15, #764ba215);
}

.route-metrics {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.route-metrics .metric {
  display: flex;
  justify-content: space-between;
}

/* Savings Calculator */
.savings-calculator {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.comparison-chart {
  margin: 20px 0;
}

.bar-item {
  margin-bottom: 15px;
}

.bar {
  background: #e5e7eb;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 8px;
}

.bar-fill {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
}

.bar-fill.direct {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.bar-fill.optimized {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.savings-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 20px 0;
}

/* Portfolio Dashboard */
.portfolio-dashboard {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  margin: 20px 0;
}

.stat-card {
  background: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #e5e7eb;
}

.stat-card.highlight {
  background: linear-gradient(135deg, #84cc16 0%, #22c55e 100%);
  color: white;
  border-left-color: #22c55e;
}

.spending-chart {
  margin: 20px 0;
  padding: 20px;
  background: #f9fafb;
  border-radius: 8px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 2px;
  margin-top: 15px;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
}

/* Gas Alerts */
.gas-alerts {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.alert {
  padding: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}

.alert-low {
  background: #dbeafe;
  border: 1px solid #0284c7;
  color: #0c4a6e;
}

.alert-medium {
  background: #fef3c7;
  border: 1px solid #f59e0b;
  color: #78350f;
}

.alert-high {
  background: #fee2e2;
  border: 1px solid #ef4444;
  color: #7f1d1d;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-small {
  background: #667eea;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}

.btn-dismiss {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .price-options {
    grid-template-columns: 1fr;
  }

  .route-comparison {
    grid-template-columns: 1fr;
  }

  .batch-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .savings-summary {
    grid-template-columns: repeat(2, 1fr);
  }
}
`;

export const GasOptimizationStyles = gasCss;
