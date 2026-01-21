'use client';

import React, { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import styles from './page.module.css';

export default function AdminDemoPage() {
  const { investigation, economicMonitoring, featureFlags } = useAdmin();
  const [activeTab, setActiveTab] = useState<'moderation' | 'economic' | 'features'>('moderation');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // ========================================================================
  // MODERATION TAB
  // ========================================================================

  const ModerationTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Moderation Dashboard</h2>
        <p>Monitor violations and manage player conduct</p>
      </div>

      <div className={styles.grid}>
        {/* Investigations Queue */}
        <div className={styles.card}>
          <h3>Investigation Queue</h3>
          <div className={styles.count}>
            {investigation.investigations.length} pending
          </div>
          <div className={styles.listItems}>
            {investigation.investigations.slice(0, 5).map((inv: any) => (
              <div
                key={inv.playerId}
                className={styles.listItem}
                onClick={() => setSelectedPlayerId(inv.playerId)}
                style={{
                  borderLeftColor:
                    inv.violations.length > 5
                      ? '#ff3535'
                      : inv.violations.length > 2
                        ? '#ffa500'
                        : '#00d9ff',
                }}
              >
                <div className={styles.itemName}>{inv.playerName}</div>
                <div className={styles.itemMeta}>
                  {inv.violations.length} violations
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.card}>
          <h3>Moderation Stats</h3>
          <div className={styles.statsGrid}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Pending Review</span>
              <span className={styles.statValue}>
                {investigation.investigations.length}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Active Cases</span>
              <span className={styles.statValue}>
                {investigation.investigations.filter((i: any) => i.investigationStatus === 'investigating').length}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Resolved</span>
              <span className={styles.statValue}>
                {investigation.investigations.filter((i: any) => i.investigationStatus === 'clear').length}
              </span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Flagged</span>
              <span className={styles.statValue}>
                {investigation.investigations.filter((i: any) => i.investigationStatus === 'flagged').length}
              </span>
            </div>
          </div>
        </div>

        {/* Violation Types */}
        <div className={styles.card + ' ' + styles.fullWidth}>
          <h3>Violation Distribution</h3>
          <div className={styles.distributionList}>
            <div className={styles.distributionItem}>
              <span className={styles.type}>Inappropriate Content</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: '45%' }} />
              </div>
              <span className={styles.count}>45</span>
            </div>
            <div className={styles.distributionItem}>
              <span className={styles.type}>Abusive Behavior</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: '28%' }} />
              </div>
              <span className={styles.count}>28</span>
            </div>
            <div className={styles.distributionItem}>
              <span className={styles.type}>Cheating</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: '15%' }} />
              </div>
              <span className={styles.count}>15</span>
            </div>
            <div className={styles.distributionItem}>
              <span className={styles.type}>Economic Fraud</span>
              <div className={styles.bar}>
                <div className={styles.fill} style={{ width: '12%' }} />
              </div>
              <span className={styles.count}>12</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ========================================================================
  // ECONOMIC MONITORING TAB
  // ========================================================================

  const EconomicTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Economic Monitoring</h2>
        <p>Track token economics and detect anomalies</p>
      </div>

      <div className={styles.grid}>
        {/* Metrics Summary */}
        <div className={styles.card}>
          <h3>Daily Metrics</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.label}>Rewards Issued</span>
              <span className={styles.value}>
                {economicMonitoring.metrics?.dailyRewardIssued || 0}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Rewards Claimed</span>
              <span className={styles.value}>
                {economicMonitoring.metrics?.dailyRewardClaimed || 0}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Tokens Burned</span>
              <span className={styles.value}>
                {economicMonitoring.metrics?.dailyRewardBurned || 0}
              </span>
            </div>
            <div className={styles.metric}>
              <span className={styles.label}>Inflation Rate</span>
              <span
                className={styles.value}
                style={{
                  color:
                    economicMonitoring.metrics?.inflationRate > 5
                      ? '#ff3535'
                      : '#00d9ff',
                }}
              >
                {economicMonitoring.metrics?.inflationRate.toFixed(2) || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Token Supply */}
        <div className={styles.card}>
          <h3>Token Supply</h3>
          <div className={styles.supplyInfo}>
            <div className={styles.supplyRow}>
              <span>Total Supply</span>
              <span className={styles.amount}>
                {economicMonitoring.supply?.total || 0}
              </span>
            </div>
            <div className={styles.supplyRow}>
              <span>Circulating</span>
              <span className={styles.amount}>
                {economicMonitoring.supply?.circulating || 0}
              </span>
            </div>
            <div className={styles.supplyRow}>
              <span>Burned</span>
              <span className={styles.amount}>
                {economicMonitoring.supply?.burned || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Suspicious Players */}
        <div className={styles.card}>
          <h3>High-Risk Players</h3>
          <div className={styles.playersList}>
            {economicMonitoring.playerProfiles
              .slice(0, 5)
              .map((profile: any) => (
                <div key={profile.playerId} className={styles.playerItem}>
                  <span className={styles.playerName}>{profile.playerId}</span>
                  <div className={styles.scoreBar}>
                    <div
                      className={styles.scoreFill}
                      style={{
                        width: profile.economicScore + '%',
                        backgroundColor:
                          profile.economicScore < 50 ? '#ff3535' : '#ffa500',
                      }}
                    />
                  </div>
                  <span className={styles.score}>{profile.economicScore}</span>
                </div>
              ))}
          </div>
        </div>

        {/* Anomalies */}
        <div className={styles.card + ' ' + styles.fullWidth}>
          <h3>Transaction Anomalies</h3>
          <div className={styles.anomaliesList}>
            {economicMonitoring.anomalies.slice(0, 5).map((anom: any) => (
              <div key={anom.id} className={styles.anomalyItem}>
                <span
                  className={styles.severity}
                  style={{
                    backgroundColor:
                      anom.severity === 'high'
                        ? '#ff3535'
                        : anom.severity === 'medium'
                          ? '#ffa500'
                          : '#ffcc00',
                  }}
                >
                  {anom.severity}
                </span>
                <span className={styles.type}>{anom.anomalyType}</span>
                <span className={styles.timestamp}>
                  {new Date(anom.flaggedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ========================================================================
  // FEATURE FLAGS TAB
  // ========================================================================

  const FeatureFlagsTab = () => (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <h2>Feature Flags & Rollouts</h2>
        <p>Manage feature toggles and progressive deployments</p>
      </div>

      <div className={styles.grid}>
        {/* Flags Overview */}
        <div className={styles.card}>
          <h3>Active Flags</h3>
          <div className={styles.count}>
            {featureFlags.flags.filter((f: any) => f.enabled).length} enabled
          </div>
          <div className={styles.flagsList}>
            {featureFlags.flags.slice(0, 8).map((flag: any) => (
              <div key={flag.id} className={styles.flagItem}>
                <span
                  className={styles.flagStatus}
                  style={{
                    backgroundColor: flag.enabled ? '#00d9ff' : '#666',
                  }}
                >
                  {flag.enabled ? '●' : '○'}
                </span>
                <span className={styles.flagName}>{flag.name}</span>
                <span className={styles.rollout}>{flag.rolloutPercentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rollout Progress */}
        <div className={styles.card}>
          <h3>Progressive Rollouts</h3>
          {featureFlags.flags
            .filter((f: any) => f.rolloutPercentage > 0 && f.rolloutPercentage < 100)
            .slice(0, 4)
            .map((flag: any) => (
              <div key={flag.id} className={styles.rolloutItem}>
                <span className={styles.flagName}>{flag.name}</span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progress}
                    style={{ width: flag.rolloutPercentage + '%' }}
                  />
                </div>
                <span className={styles.percentage}>{flag.rolloutPercentage}%</span>
              </div>
            ))}
        </div>

        {/* A/B Tests */}
        <div className={styles.card}>
          <h3>A/B Tests</h3>
          <div className={styles.testsList}>
            <div className={styles.testItem}>
              <span className={styles.testName}>New UI Layout</span>
              <div className={styles.variants}>
                <span className={styles.variant}>Control: 50%</span>
                <span className={styles.variant}>Treatment: 50%</span>
              </div>
              <span className={styles.status}>Running</span>
            </div>
            <div className={styles.testItem}>
              <span className={styles.testName}>Matchmaking Algorithm</span>
              <div className={styles.variants}>
                <span className={styles.variant}>Control: 50%</span>
                <span className={styles.variant}>Treatment: 50%</span>
              </div>
              <span className={styles.status}>Running</span>
            </div>
          </div>
        </div>

        {/* Analytics */}
        <div className={styles.card + ' ' + styles.fullWidth}>
          <h3>Flag Analytics</h3>
          <div className={styles.analyticsTable}>
            <div className={styles.analyticsHeader}>
              <span>Flag</span>
              <span>Evaluations</span>
              <span>Enabled %</span>
              <span>Users</span>
            </div>
            {featureFlags.analytics.slice(0, 5).map((analytic: any) => (
              <div key={analytic.flagId} className={styles.analyticsRow}>
                <span>{analytic.flagId}</span>
                <span>{analytic.totalEvaluations}</span>
                <span>{analytic.enabledPercentage.toFixed(1)}%</span>
                <span>{analytic.affectedUsers.size}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1>Admin Dashboard</h1>
        <p>Moderation, Economic Monitoring, and Feature Management</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'moderation' ? styles.active : ''}`}
          onClick={() => setActiveTab('moderation')}
        >
          Moderation
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'economic' ? styles.active : ''}`}
          onClick={() => setActiveTab('economic')}
        >
          Economic
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'features' ? styles.active : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Features
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'moderation' && <ModerationTab />}
      {activeTab === 'economic' && <EconomicTab />}
      {activeTab === 'features' && <FeatureFlagsTab />}

      {/* Footer */}
      <div className={styles.footer}>
        <p>Admin Dashboard v1.0 - Moderation, Economic, and Feature Management</p>
      </div>
    </div>
  );
}
