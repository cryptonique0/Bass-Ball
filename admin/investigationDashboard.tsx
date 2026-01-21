/**
 * Investigation Dashboard
 * Admin interface for investigating players, viewing violations, taking moderation actions
 * Provides comprehensive player investigation and moderation tools
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerViolation {
  id: string;
  playerId: string;
  playerName: string;
  type: 'inappropriate_content' | 'cheating' | 'abusive_behavior' | 'economic_fraud' | 'account_sharing';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  evidence: ViolationEvidence[];
  reportedBy: string;
  reportedAt: number;
  status: 'pending' | 'investigating' | 'confirmed' | 'dismissed' | 'actioned';
  resolution?: ModerationAction;
}

export interface ViolationEvidence {
  id: string;
  type: 'chat' | 'gameplay' | 'transaction' | 'report' | 'automated_detection';
  content: string;
  timestamp: number;
  severity: number; // 0-100
}

export interface ModerationAction {
  id: string;
  actionType: 'warning' | 'mute' | 'suspend' | 'ban' | 'economic_correction';
  severity: 'light' | 'medium' | 'heavy';
  duration?: number; // milliseconds, undefined = permanent
  reason: string;
  appliedBy: string;
  appliedAt: number;
  appealable: boolean;
}

export interface PlayerInvestigation {
  playerId: string;
  playerName: string;
  joinDate: number;
  lastActivityDate: number;
  violations: PlayerViolation[];
  economicFlags: EconomicFlag[];
  behaviorFlags: BehaviorFlag[];
  investigationNotes: InvestigationNote[];
  riskScore: number; // 0-100
  investigationStatus: 'clear' | 'monitoring' | 'investigating' | 'flagged';
}

export interface EconomicFlag {
  id: string;
  type: 'rapid_accumulation' | 'farming' | 'suspicious_transactions' | 'price_manipulation';
  detectedAt: number;
  severity: number; // 0-100
  description: string;
  evidence: string[];
}

export interface BehaviorFlag {
  id: string;
  type: 'toxic_chat' | 'leaving_matches' | 'intentional_feeding' | 'connection_abuse' | 'unusual_patterns';
  detectedAt: number;
  frequency: number; // Times detected
  lastOccurrence: number;
  description: string;
}

export interface InvestigationNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: number;
  tags: string[];
}

export interface ModerationQueue {
  id: string;
  violations: PlayerViolation[];
  priorityOrder: string[]; // Violation IDs ordered by priority
  assignedModerator?: string;
  createdAt: number;
}

// ============================================================================
// INVESTIGATION DASHBOARD COMPONENT
// ============================================================================

export interface InvestigationDashboardProps {
  onPlayerSelect?: (playerId: string) => void;
  onAction?: (actionId: string, details: unknown) => void;
}

export const InvestigationDashboard: React.FC<InvestigationDashboardProps> = ({
  onPlayerSelect,
  onAction,
}) => {
  // State Management
  const [investigations, setInvestigations] = useState<PlayerInvestigation[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'minor' | 'moderate' | 'major' | 'critical'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'investigating' | 'confirmed' | 'dismissed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'economic' | 'behavior' | 'actions'>('overview');

  // Derived State
  const selectedInvestigation = investigations.find((inv) => inv.playerId === selectedPlayerId);

  // Filters
  const filteredInvestigations = investigations.filter((inv) => {
    const matchesSearch =
      inv.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.playerId.includes(searchQuery);
    const matchesStatus =
      filterStatus === 'all' ||
      inv.violations.some(
        (v) => filterStatus === 'all' || v.status === filterStatus
      );
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handlePlayerSelect = useCallback(
    (playerId: string) => {
      setSelectedPlayerId(playerId);
      onPlayerSelect?.(playerId);
    },
    [onPlayerSelect]
  );

  const handleAddNote = useCallback(() => {
    if (!selectedPlayerId || !newNoteContent.trim()) return;

    const newNote: InvestigationNote = {
      id: `note_${Date.now()}`,
      authorId: 'admin_user',
      authorName: 'Admin',
      content: newNoteContent,
      createdAt: Date.now(),
      tags: [],
    };

    setInvestigations((prev) =>
      prev.map((inv) =>
        inv.playerId === selectedPlayerId
          ? { ...inv, investigationNotes: [...inv.investigationNotes, newNote] }
          : inv
      )
    );

    setNewNoteContent('');
    setShowNewNote(false);
  }, [selectedPlayerId, newNoteContent]);

  const handleTakeAction = useCallback(
    (actionType: ModerationAction['actionType'], severity: ModerationAction['severity'], duration?: number) => {
      if (!selectedPlayerId) return;

      const action: ModerationAction = {
        id: `action_${Date.now()}`,
        actionType,
        severity,
        duration,
        reason: 'Moderator action',
        appliedBy: 'admin_user',
        appliedAt: Date.now(),
        appealable: severity !== 'heavy',
      };

      onAction?.(action.id, { playerId: selectedPlayerId, action });
    },
    [selectedPlayerId, onAction]
  );

  // Risk Score Indicator
  const getRiskColor = (score: number): string => {
    if (score >= 75) return '#ff3535'; // Critical
    if (score >= 50) return '#ffa500'; // High
    if (score >= 25) return '#ffcc00'; // Medium
    return '#00d9ff'; // Low
  };

  // Severity Badge
  const getSeverityColor = (severity: PlayerViolation['severity']): string => {
    const colors: Record<PlayerViolation['severity'], string> = {
      minor: '#00d9ff',
      moderate: '#ffcc00',
      major: '#ffa500',
      critical: '#ff3535',
    };
    return colors[severity];
  };

  return (
    <div className="investigation-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Player Investigation Dashboard</h1>
        <p>Monitor and investigate player violations and misconduct</p>
      </div>

      {/* Search & Filters */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search players..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Severities</option>
          <option value="minor">Minor</option>
          <option value="moderate">Moderate</option>
          <option value="major">Major</option>
          <option value="critical">Critical</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="investigating">Investigating</option>
          <option value="confirmed">Confirmed</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      <div className="dashboard-content">
        {/* Left Panel - Player List */}
        <div className="player-list-panel">
          <h2>Investigations Queue</h2>
          {filteredInvestigations.length === 0 ? (
            <div className="empty-state">No players matching filters</div>
          ) : (
            <div className="players-list">
              {filteredInvestigations.map((investigation) => (
                <div
                  key={investigation.playerId}
                  className={`player-item ${selectedPlayerId === investigation.playerId ? 'active' : ''}`}
                  onClick={() => handlePlayerSelect(investigation.playerId)}
                  style={{
                    borderLeftColor: getRiskColor(investigation.riskScore),
                  }}
                >
                  <div className="player-name">{investigation.playerName}</div>
                  <div className="player-meta">
                    <span className="violation-count">
                      {investigation.violations.length} violations
                    </span>
                    <span
                      className="risk-score"
                      style={{ color: getRiskColor(investigation.riskScore) }}
                    >
                      Risk: {investigation.riskScore}
                    </span>
                  </div>
                  <div className="investigation-status">
                    Status: {investigation.investigationStatus}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Investigation Details */}
        <div className="investigation-panel">
          {selectedInvestigation ? (
            <>
              {/* Header */}
              <div className="investigation-header">
                <div className="player-info">
                  <h2>{selectedInvestigation.playerName}</h2>
                  <p>ID: {selectedInvestigation.playerId}</p>
                  <p>Member since: {new Date(selectedInvestigation.joinDate).toLocaleDateString()}</p>
                </div>
                <div className="risk-indicator">
                  <div
                    className="risk-circle"
                    style={{
                      backgroundColor: getRiskColor(selectedInvestigation.riskScore),
                    }}
                  >
                    {selectedInvestigation.riskScore}
                  </div>
                  <p>{selectedInvestigation.investigationStatus}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-navigation">
                <button
                  className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-btn ${activeTab === 'violations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('violations')}
                >
                  Violations ({selectedInvestigation.violations.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'economic' ? 'active' : ''}`}
                  onClick={() => setActiveTab('economic')}
                >
                  Economic ({selectedInvestigation.economicFlags.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'behavior' ? 'active' : ''}`}
                  onClick={() => setActiveTab('behavior')}
                >
                  Behavior ({selectedInvestigation.behaviorFlags.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'actions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actions')}
                >
                  Actions
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="overview-section">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <span className="stat-label">Total Violations</span>
                        <span className="stat-value">{selectedInvestigation.violations.length}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Economic Flags</span>
                        <span className="stat-value">{selectedInvestigation.economicFlags.length}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Behavior Flags</span>
                        <span className="stat-value">{selectedInvestigation.behaviorFlags.length}</span>
                      </div>
                      <div className="stat-card">
                        <span className="stat-label">Last Activity</span>
                        <span className="stat-value">
                          {Math.floor((Date.now() - selectedInvestigation.lastActivityDate) / 60000)}m ago
                        </span>
                      </div>
                    </div>

                    {/* Recent Notes */}
                    <div className="notes-section">
                      <h3>Investigation Notes</h3>
                      {selectedInvestigation.investigationNotes.length === 0 ? (
                        <p className="empty-notes">No notes yet</p>
                      ) : (
                        <div className="notes-list">
                          {selectedInvestigation.investigationNotes.map((note) => (
                            <div key={note.id} className="note-item">
                              <div className="note-header">
                                <span className="note-author">{note.authorName}</span>
                                <span className="note-time">
                                  {new Date(note.createdAt).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="note-content">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {showNewNote ? (
                        <div className="add-note-form">
                          <textarea
                            value={newNoteContent}
                            onChange={(e) => setNewNoteContent(e.target.value)}
                            placeholder="Add investigation note..."
                            className="note-textarea"
                          />
                          <div className="form-buttons">
                            <button className="btn btn-primary" onClick={handleAddNote}>
                              Add Note
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowNewNote(false)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-primary" onClick={() => setShowNewNote(true)}>
                          + Add Note
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Violations Tab */}
                {activeTab === 'violations' && (
                  <div className="violations-section">
                    {selectedInvestigation.violations.map((violation) => (
                      <div key={violation.id} className="violation-card">
                        <div className="violation-header">
                          <span
                            className="severity-badge"
                            style={{ backgroundColor: getSeverityColor(violation.severity) }}
                          >
                            {violation.severity}
                          </span>
                          <span className="violation-type">{violation.type}</span>
                          <span className="violation-status">{violation.status}</span>
                        </div>
                        <p className="violation-description">{violation.description}</p>
                        <div className="violation-meta">
                          <span>Reported by: {violation.reportedBy}</span>
                          <span>{new Date(violation.reportedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Economic Flags Tab */}
                {activeTab === 'economic' && (
                  <div className="economic-section">
                    {selectedInvestigation.economicFlags.map((flag) => (
                      <div key={flag.id} className="flag-card">
                        <div className="flag-header">
                          <span className="flag-type">{flag.type}</span>
                          <span className="flag-severity" style={{ color: getRiskColor(flag.severity) }}>
                            Severity: {flag.severity}
                          </span>
                        </div>
                        <p className="flag-description">{flag.description}</p>
                        <div className="flag-meta">
                          <span>Detected: {new Date(flag.detectedAt).toLocaleString()}</span>
                          <span>{flag.evidence.length} pieces of evidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Behavior Flags Tab */}
                {activeTab === 'behavior' && (
                  <div className="behavior-section">
                    {selectedInvestigation.behaviorFlags.map((flag) => (
                      <div key={flag.id} className="flag-card">
                        <div className="flag-header">
                          <span className="flag-type">{flag.type}</span>
                          <span className="flag-frequency">x{flag.frequency}</span>
                        </div>
                        <p className="flag-description">{flag.description}</p>
                        <div className="flag-meta">
                          <span>Last: {new Date(flag.lastOccurrence).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions Tab */}
                {activeTab === 'actions' && (
                  <div className="actions-section">
                    <h3>Moderation Actions</h3>
                    <div className="action-buttons-grid">
                      <button
                        className="action-btn warning-btn"
                        onClick={() => handleTakeAction('warning', 'light')}
                      >
                        📌 Issue Warning
                      </button>
                      <button
                        className="action-btn mute-btn"
                        onClick={() => handleTakeAction('mute', 'medium', 24 * 60 * 60 * 1000)}
                      >
                        🔇 Mute (24h)
                      </button>
                      <button
                        className="action-btn suspend-btn"
                        onClick={() => handleTakeAction('suspend', 'heavy', 7 * 24 * 60 * 60 * 1000)}
                      >
                        ⏸️ Suspend (7d)
                      </button>
                      <button
                        className="action-btn ban-btn"
                        onClick={() => handleTakeAction('ban', 'heavy')}
                      >
                        🚫 Ban (Permanent)
                      </button>
                      <button
                        className="action-btn correction-btn"
                        onClick={() => handleTakeAction('economic_correction', 'medium')}
                      >
                        💰 Economic Correction
                      </button>
                    </div>

                    <h3>Action History</h3>
                    {selectedInvestigation.violations
                      .filter((v) => v.resolution)
                      .map((violation) =>
                        violation.resolution ? (
                          <div key={violation.id} className="action-history-item">
                            <span className="action-type">{violation.resolution.actionType}</span>
                            <span className="action-reason">{violation.resolution.reason}</span>
                            <span className="action-date">
                              {new Date(violation.resolution.appliedAt).toLocaleString()}
                            </span>
                          </div>
                        ) : null
                      )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a player to view investigation details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestigationDashboard;
