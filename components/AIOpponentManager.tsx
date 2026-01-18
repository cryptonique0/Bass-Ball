import React, { useState, useEffect } from 'react';
import { AIOpponentSystem } from '@/lib/aiOpponentSystem';

interface AIOpponentManagerProps {
  matchId: string;
  onOpponentSelected: (opponentId: string) => void;
}

export const AIOpponentManager: React.FC<AIOpponentManagerProps> = ({
  matchId,
  onOpponentSelected,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('intermediate');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  useEffect(() => {
    const system = AIOpponentSystem.getInstance();
    const allProfiles = system.getAllAIProfiles();
    setProfiles(allProfiles);
  }, []);

  const filteredProfiles = profiles.filter(p => p.difficulty === selectedDifficulty);

  const handleSelectOpponent = (profileId: string) => {
    setSelectedProfile(profileId);
    onOpponentSelected(profileId);
  };

  return (
    <div className="w-full bg-slate-900 rounded-lg p-6 border border-slate-700">
      <h2 className="text-2xl font-bold text-white mb-6">Select AI Opponent</h2>

      {/* Difficulty Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['beginner', 'intermediate', 'advanced', 'expert', 'legendary'].map(diff => (
          <button
            key={diff}
            onClick={() => setSelectedDifficulty(diff)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              selectedDifficulty === diff
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProfiles.map(profile => (
          <AIOpponentCard
            key={profile.profileId}
            profile={profile}
            isSelected={selectedProfile === profile.profileId}
            onSelect={() => handleSelectOpponent(profile.profileId)}
          />
        ))}
      </div>
    </div>
  );
};

interface AIOpponentCardProps {
  profile: any;
  isSelected: boolean;
  onSelect: () => void;
}

const AIOpponentCard: React.FC<AIOpponentCardProps> = ({ profile, isSelected, onSelect }) => {
  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      beginner: 'bg-green-600',
      intermediate: 'bg-blue-600',
      advanced: 'bg-purple-600',
      expert: 'bg-red-600',
      legendary: 'bg-amber-500',
    };
    return colors[difficulty] || 'bg-slate-600';
  };

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
        isSelected
          ? 'border-emerald-500 bg-slate-800'
          : 'border-slate-600 bg-slate-800 hover:border-slate-500'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{profile.name}</h3>
          <p className="text-sm text-slate-400">{profile.style}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getDifficultyColor(profile.difficulty)}`}>
          {profile.difficulty}
        </div>
      </div>

      {/* Personality Stats */}
      <div className="space-y-2 mb-3">
        <PersonalityStat label="Aggression" value={profile.personality.aggression} />
        <PersonalityStat label="Intelligence" value={profile.personality.intelligence} />
        <PersonalityStat label="Adaptability" value={profile.personality.adaptability} />
        <PersonalityStat label="Risk Taking" value={profile.personality.riskTaking} />
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-green-400 font-semibold mb-1">Strengths</p>
          <ul className="text-slate-400 space-y-1">
            {profile.strengths.slice(0, 2).map((s: string, i: number) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-red-400 font-semibold mb-1">Weaknesses</p>
          <ul className="text-slate-400 space-y-1">
            {profile.weaknesses.slice(0, 2).map((w: string, i: number) => (
              <li key={i}>• {w}</li>
            ))}
          </ul>
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-semibold">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            Selected
          </div>
        </div>
      )}
    </div>
  );
};

interface PersonalityStatProps {
  label: string;
  value: number;
}

const PersonalityStat: React.FC<PersonalityStatProps> = ({ label, value }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400 text-xs w-20">{label}</span>
      <div className="flex-1 bg-slate-700 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-slate-300 text-xs w-8">{value}</span>
    </div>
  );
};
