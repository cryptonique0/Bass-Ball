'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  Lock,
  TrendingUp,
  Send,
  Plus,
  History,
  Zap,
} from 'lucide-react';
import { EconomyManager } from '@/lib/economySystem';
import { PlayerBalance, Transaction, EntryFee } from '@/lib/economySystem';

interface Props {
  entityId: string;
  entityType: 'player' | 'team';
  entityName: string;
}

/**
 * Economy Dashboard Component
 * Shows wallet, balances, transactions, and entry fees
 */
export function EconomyDashboard({
  entityId,
  entityType,
  entityName,
}: Props) {
  const [balance, setBalance] = useState<PlayerBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'wallet' | 'history' | 'tournaments'>('wallet');
  const [loading, setLoading] = useState(true);

  const economyMgr = EconomyManager.getInstance();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [entityId]);

  const loadData = () => {
    setLoading(true);
    const bal = economyMgr.getBalance(entityId, entityType, entityName);
    setBalance(bal);

    const txns = economyMgr.getTransactionHistory(entityId, 50);
    setTransactions(txns);

    setLoading(false);
  };

  if (loading || !balance) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-b from-slate-900 to-slate-950 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 to-blue-900 px-6 py-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Wallet</h2>
          </div>
          <div className="text-sm text-gray-400">{entityName}</div>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-700">
        {/* Soft Currency */}
        <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 rounded-lg border border-yellow-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-yellow-600 uppercase">Soft Currency</span>
            <Coins className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-3xl font-bold text-yellow-400">
            {balance.softBalance.toLocaleString()}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Off-chain balance</div>
        </div>

        {/* Hard Currency */}
        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg border border-blue-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-600 uppercase">Hard Currency</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-400">
            {balance.hardBalance.toFixed(4)}
          </div>
          <div className="text-xs text-blue-600 mt-1">On-chain balance</div>
        </div>

        {/* Locked Balance */}
        <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg border border-purple-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-600 uppercase">Locked</span>
            <Lock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-400">
            {balance.lockedBalance.toLocaleString()}
          </div>
          <div className="text-xs text-purple-600 mt-1">In tournaments</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'wallet'
              ? 'border-b-2 border-emerald-500 text-emerald-400 bg-slate-800/50'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Quick Actions
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-6 py-3 text-sm font-semibold transition-colors ${
            activeTab === 'history'
              ? 'border-b-2 border-blue-500 text-blue-400 bg-slate-800/50'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <History className="w-4 h-4" />
            History
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 min-h-96">
        {activeTab === 'wallet' ? (
          <WalletTab balance={balance} onRefresh={loadData} />
        ) : (
          <HistoryTab transactions={transactions} />
        )}
      </div>
    </div>
  );
}

/**
 * Wallet Tab - Quick Actions
 */
function WalletTab({
  balance,
  onRefresh,
}: {
  balance: PlayerBalance;
  onRefresh: () => void;
}) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositType, setDepositType] = useState<'soft' | 'hard'>('soft');

  const economyMgr = EconomyManager.getInstance();

  const handleDeposit = () => {
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) return;

    if (depositType === 'soft') {
      economyMgr.addSoftCurrency(balance.entityId, amount, 'Manual deposit');
    } else {
      economyMgr.addHardCurrency(balance.entityId, amount, 'Manual deposit');
    }

    setDepositAmount('');
    setShowDepositModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setShowDepositModal(true)}
          className="p-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 rounded-lg text-emerald-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Deposit
        </button>
        <button className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          Send
        </button>
        <button className="p-3 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 rounded-lg text-purple-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Convert
        </button>
        <button className="p-3 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/50 rounded-lg text-orange-400 text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          <Wallet className="w-4 h-4" />
          Withdraw
        </button>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <DepositModal
          onClose={() => setShowDepositModal(false)}
          onDeposit={handleDeposit}
          amount={depositAmount}
          setAmount={setDepositAmount}
          depositType={depositType}
          setDepositType={setDepositType}
        />
      )}

      {/* Quick Info */}
      <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
        <h3 className="text-sm font-bold text-white">Currency Info</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <div className="text-gray-500">Soft Currency</div>
            <div className="text-yellow-400 font-semibold">Off-chain gaming currency</div>
          </div>
          <div>
            <div className="text-gray-500">Hard Currency</div>
            <div className="text-blue-400 font-semibold">On-chain blockchain tokens</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * History Tab - Transaction History
 */
function HistoryTab({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <History className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No transaction history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {transactions
        .slice()
        .reverse()
        .map((tx) => (
          <TransactionRow key={tx.transactionId} transaction={tx} />
        ))}
    </div>
  );
}

/**
 * Individual Transaction Row
 */
function TransactionRow({ transaction }: { transaction: Transaction }) {
  const getTypeColor = () => {
    if (transaction.amount > 0) return 'text-green-400';
    return 'text-red-400';
  };

  const getCurrencySymbol = () => {
    return transaction.currencyType === 'soft' ? '💰' : '⚡';
  };

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded border border-slate-700/50 text-sm">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 bg-slate-700/50 rounded flex items-center justify-center text-lg">
          {getCurrencySymbol()}
        </div>
        <div className="flex-1">
          <p className="text-gray-300 font-medium">{transaction.description}</p>
          <p className="text-xs text-gray-500">
            {new Date(transaction.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <div className={`font-bold ${getTypeColor()}`}>
          {transaction.amount > 0 ? '+' : ''}
          {transaction.currencyType === 'soft'
            ? transaction.amount.toLocaleString()
            : transaction.amount.toFixed(4)}
        </div>
        {transaction.verified && <div className="text-xs text-green-500">✓ Verified</div>}
      </div>
    </div>
  );
}

/**
 * Deposit Modal
 */
function DepositModal({
  onClose,
  onDeposit,
  amount,
  setAmount,
  depositType,
  setDepositType,
}: {
  onClose: () => void;
  onDeposit: () => void;
  amount: string;
  setAmount: (val: string) => void;
  depositType: 'soft' | 'hard';
  setDepositType: (val: 'soft' | 'hard') => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 max-w-md w-full">
        <h3 className="text-lg font-bold text-white mb-4">Deposit Currency</h3>

        <div className="space-y-4">
          {/* Currency Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Currency Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setDepositType('soft')}
                className={`flex-1 py-2 rounded border transition-colors ${
                  depositType === 'soft'
                    ? 'bg-yellow-600/30 border-yellow-500 text-yellow-400'
                    : 'bg-slate-800/50 border-slate-700 text-gray-400'
                }`}
              >
                Soft 💰
              </button>
              <button
                onClick={() => setDepositType('hard')}
                className={`flex-1 py-2 rounded border transition-colors ${
                  depositType === 'hard'
                    ? 'bg-blue-600/30 border-blue-500 text-blue-400'
                    : 'bg-slate-800/50 border-slate-700 text-gray-400'
                }`}
              >
                Hard ⚡
              </button>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-gray-400 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onDeposit}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 rounded text-white font-semibold transition-colors"
            >
              Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Currency Badge Component
 * Small display for wallet status
 */
export function CurrencyBadge({ balance }: { balance: PlayerBalance }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 px-3 py-1 bg-yellow-900/30 rounded border border-yellow-700/50">
        <Coins className="w-3 h-3 text-yellow-400" />
        <span className="text-xs font-bold text-yellow-400">
          {balance.softBalance.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 bg-blue-900/30 rounded border border-blue-700/50">
        <Zap className="w-3 h-3 text-blue-400" />
        <span className="text-xs font-bold text-blue-400">
          {balance.hardBalance.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
