// Integration Guide: Anti-Cheat System Setup

/**
 * STEP 1: Update guestMode.ts recordMatch() return type
 * 
 * Current:
 *   static recordMatch(...): GuestPlayer | null
 * 
 * New:
 *   static recordMatch(...): { player: GuestPlayer | null; validation: ValidationResult }
 * 
 * Already done in guestMode.ts - validation is now returned
 */

/**
 * STEP 2: Use in LiveMatch component when match ends
 */

// Example: After match completion in LiveMatch or GameEnd
import { GuestModeManager } from '@/lib/guestMode';
import { MatchValidator } from '@/lib/matchValidator';

export function handleMatchEnd(matchResult: MatchResult) {
  const player = GuestModeManager.getGuestPlayer();
  if (!player) return;

  // Record match with validation
  const { player: updatedPlayer, validation } = GuestModeManager.recordMatch(
    matchResult.homeTeam.name,
    matchResult.awayTeam.name,
    matchResult.homeTeam.goals,
    matchResult.awayTeam.goals,
    matchResult.playerTeam,
    matchResult.playerGoals,
    matchResult.playerAssists,
    matchResult.duration
  );

  if (!updatedPlayer) return;

  // Show validation result to player
  if (MatchValidator.isSuspicious(validation)) {
    console.warn('Match flagged:', validation);
    // Show warning banner: "This match has been flagged for review"
    // But still record it - don't block legitimate play
  }

  // Log validation for analytics
  console.log(`Match validation score: ${validation.score}/100`);
  if (validation.issues.length > 0) {
    console.log('Issues:', validation.issues);
  }
}

/**
 * STEP 3: Display fairness score in player profile
 */

import { FairnessValidator } from '@/components/FairnessValidator';
import { PlayerProfile } from '@/components/PlayerProfile';

export function PlayerDashboard() {
  const [showProfile, setShowProfile] = useState(false);
  const [showFairness, setShowFairness] = useState(false);
  const player = GuestModeManager.getGuestPlayer();

  if (!player) return null;

  // Calculate fairness score
  const validations = player.matchHistory.map(m =>
    MatchValidator.validateMatch(m, undefined, player.matchHistory)
  );
  const avgScore = validations.length > 0
    ? Math.round(validations.reduce((s, v) => s + v.score, 0) / validations.length)
    : 100;
  const suspiciousCount = validations.filter(v => MatchValidator.isSuspicious(v)).length;

  return (
    <>
      <div className="flex gap-4">
        <button
          onClick={() => setShowProfile(true)}
          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-bold"
        >
          👤 Profile
        </button>

        {/* Fairness Score Badge */}
        <button
          onClick={() => setShowFairness(true)}
          className={`px-4 py-2 rounded-lg font-bold text-white ${
            avgScore >= 90
              ? 'bg-green-600 hover:bg-green-700'
              : avgScore >= 70
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          🛡️ Fairness {avgScore}
          {suspiciousCount > 0 && (
            <span className="ml-2 bg-white bg-opacity-30 px-2 py-1 rounded">
              ⚠️ {suspiciousCount}
            </span>
          )}
        </button>
      </div>

      {showProfile && (
        <PlayerProfile
          player={player}
          onClose={() => setShowProfile(false)}
        />
      )}

      {showFairness && (
        <FairnessValidator
          player={player}
          onClose={() => setShowFairness(false)}
        />
      )}
    </>
  );
}

/**
 * STEP 4: Show validation warning after match ends
 */

export function MatchResultScreen({ matchResult }: { matchResult: MatchResult }) {
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  useEffect(() => {
    const player = GuestModeManager.getGuestPlayer();
    if (player) {
      const match = player.matchHistory[0]; // Most recent
      const val = MatchValidator.validateMatch(match, undefined, player.matchHistory);
      setValidation(val);
    }
  }, [matchResult]);

  return (
    <div className="space-y-4">
      {/* Match Score Display */}
      <div className="text-center">
        <h2 className="text-3xl font-bold">
          {matchResult.homeTeam.goals} - {matchResult.awayTeam.goals}
        </h2>
      </div>

      {/* Validation Warning (if needed) */}
      {validation && !validation.isValid && (
        <div className="bg-red-900 bg-opacity-20 border border-red-700 p-4 rounded-lg">
          <p className="text-red-300 font-bold mb-2">
            ⚠️ Match Validation Issues Detected
          </p>
          <p className="text-red-200 text-sm mb-3">
            This match has been flagged for review. Please verify the data is correct.
          </p>
          <div className="space-y-1 text-red-300 text-sm">
            {validation.issues.slice(0, 3).map((issue, idx) => (
              <p key={idx}>• {issue.message}</p>
            ))}
          </div>
          <p className="text-xs text-red-400 mt-2">
            Report: {MatchValidator.generateReport(validation)}
          </p>
        </div>
      )}

      {/* Validation Success */}
      {validation?.isValid && validation.score >= 90 && (
        <div className="bg-green-900 bg-opacity-20 border border-green-700 p-4 rounded-lg">
          <p className="text-green-300 font-bold">
            ✓ Match Verified ({validation.score}/100)
          </p>
        </div>
      )}

      {/* Fair Warning */}
      {validation?.isValid && validation.score >= 70 && validation.score < 90 && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 p-4 rounded-lg">
          <p className="text-yellow-300 font-bold">
            📊 Match Score: {validation.score}/100
          </p>
          <p className="text-yellow-200 text-xs mt-1">
            {validation.warnings.length} minor inconsistencies detected
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * STEP 5: Add fairness filter to leaderboard (future)
 */

export function Leaderboard() {
  const [filterFairness, setFilterFairness] = useState<'all' | 'verified' | 'clean'>('all');

  // Calculate fairness for each player
  const playerFairnessScores = players.map(player => {
    const validations = player.matchHistory.map(m =>
      MatchValidator.validateMatch(m, undefined, player.matchHistory)
    );
    const avgScore = validations.length > 0
      ? validations.reduce((s, v) => s + v.score, 0) / validations.length
      : 100;
    return { player, fairnessScore: Math.round(avgScore) };
  });

  // Filter based on selection
  let filtered = playerFairnessScores;
  if (filterFairness === 'verified') {
    filtered = filtered.filter(p => p.fairnessScore >= 90);
  } else if (filterFairness === 'clean') {
    filtered = filtered.filter(p => p.fairnessScore >= 70);
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilterFairness('all')}
          className={`px-4 py-2 rounded ${filterFairness === 'all' ? 'bg-blue-600' : 'bg-gray-600'}`}
        >
          All Players
        </button>
        <button
          onClick={() => setFilterFairness('clean')}
          className={`px-4 py-2 rounded ${filterFairness === 'clean' ? 'bg-green-600' : 'bg-gray-600'}`}
        >
          ✓ Clean (70+)
        </button>
        <button
          onClick={() => setFilterFairness('verified')}
          className={`px-4 py-2 rounded ${filterFairness === 'verified' ? 'bg-emerald-600' : 'bg-gray-600'}`}
        >
          ✓✓ Verified (90+)
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map(({ player, fairnessScore }, idx) => (
          <div key={player.id} className="flex items-center gap-4 p-3 bg-gray-800 rounded">
            <span className="font-bold text-lg text-yellow-400">#{idx + 1}</span>
            <div className="flex-1">
              <p className="font-bold text-white">{player.username}</p>
              <p className="text-sm text-gray-400">{player.stats.wins}W {player.stats.losses}L</p>
            </div>
            <div className="text-right">
              <p className="font-bold">
                {player.stats.totalGoals} Goals
              </p>
              <p className={`text-sm font-bold ${
                fairnessScore >= 90 ? 'text-green-400' : fairnessScore >= 70 ? 'text-blue-400' : 'text-red-400'
              }`}>
                🛡️ {fairnessScore}
              </p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * STEP 6: Add validation to match replay/review (future)
 */

export function MatchReplayReview({ matchId }: { matchId: string }) {
  const player = GuestModeManager.getGuestPlayer();
  const match = player?.matchHistory.find(m => m.id === matchId);

  if (!match) return null;

  const validation = MatchValidator.validateMatch(match, undefined, player?.matchHistory);
  const report = MatchValidator.generateReport(validation);

  return (
    <div className="space-y-4">
      {/* Match Score */}
      <div>
        <h2 className="text-2xl font-bold">
          {match.homeTeam} {match.homeScore} - {match.awayScore} {match.awayTeam}
        </h2>
      </div>

      {/* Match Details */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-gray-400 text-sm">Player Contribution</p>
          <p className="text-xl font-bold text-white mt-1">
            ⚽ {match.playerGoals} · 🤝 {match.playerAssists}
          </p>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-gray-400 text-sm">Result</p>
          <p className="text-xl font-bold text-white mt-1 capitalize">
            {match.result === 'win' ? '🏆' : match.result === 'loss' ? '😢' : '🤝'} {match.result}
          </p>
        </div>
        <div className="bg-gray-800 p-3 rounded">
          <p className="text-gray-400 text-sm">Duration</p>
          <p className="text-xl font-bold text-white mt-1">{match.duration}'</p>
        </div>
      </div>

      {/* Validation Report */}
      <div className="bg-gray-800 p-4 rounded border border-gray-700">
        <h3 className="font-bold text-white mb-3">Validation Report</h3>
        <pre className="text-sm text-gray-400 whitespace-pre-wrap font-mono">
          {report}
        </pre>
      </div>

      {/* Review Action */}
      {validation.score < 70 && (
        <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
          📋 Request Manual Review
        </button>
      )}
    </div>
  );
}

/**
 * STEP 7: Analytics & Monitoring
 */

export function AdminDashboard() {
  const players = getAllPlayers();

  const stats = {
    totalPlayers: players.length,
    totalMatches: players.reduce((s, p) => s + p.matchHistory.length, 0),
    avgFairnessScore: Math.round(
      players.reduce((s, p) => {
        const validations = p.matchHistory.map(m =>
          MatchValidator.validateMatch(m, undefined, p.matchHistory)
        );
        const avg = validations.length > 0
          ? validations.reduce((s2, v) => s2 + v.score, 0) / validations.length
          : 100;
        return s + avg;
      }, 0) / players.length
    ),
    suspiciousPlayers: players.filter(p => {
      const validations = p.matchHistory.map(m =>
        MatchValidator.validateMatch(m, undefined, p.matchHistory)
      );
      const suspicious = validations.filter(v => MatchValidator.isSuspicious(v)).length;
      return suspicious > p.matchHistory.length * 0.2; // >20% flagged
    }).length,
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">🛡️ Anti-Cheat Admin Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-900 p-4 rounded-lg">
          <p className="text-blue-300 text-sm">Total Players</p>
          <p className="text-3xl font-bold text-white">{stats.totalPlayers}</p>
        </div>
        <div className="bg-green-900 p-4 rounded-lg">
          <p className="text-green-300 text-sm">Total Matches</p>
          <p className="text-3xl font-bold text-white">{stats.totalMatches}</p>
        </div>
        <div className="bg-yellow-900 p-4 rounded-lg">
          <p className="text-yellow-300 text-sm">Avg Fairness</p>
          <p className="text-3xl font-bold text-white">{stats.avgFairnessScore}</p>
        </div>
        <div className="bg-red-900 p-4 rounded-lg">
          <p className="text-red-300 text-sm">Suspicious</p>
          <p className="text-3xl font-bold text-white">{stats.suspiciousPlayers}</p>
        </div>
      </div>

      {/* Suspicious Players List */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h3 className="font-bold text-white mb-4">Players Under Review</h3>
        {/* List suspicious players with their flagged match counts */}
      </div>
    </div>
  );
}

/**
 * USAGE SUMMARY
 * 
 * 1. Import MatchValidator from '@/lib/matchValidator'
 * 2. Import FairnessValidator component from '@/components/FairnessValidator'
 * 3. Call MatchValidator.validateMatch() when recording matches
 * 4. Display FairnessValidator when user clicks fairness button
 * 5. Use validation results for warnings, leaderboard filtering, reports
 * 6. Monitor admin dashboard for suspicious patterns
 * 7. Plan Phase 2 with server-side validation for competitive play
 */
