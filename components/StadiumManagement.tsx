'use client';

import React, { useState } from 'react';

interface StadiumUpgrade {
  id: string;
  name: string;
  icon: string;
  category: 'capacity' | 'facilities' | 'atmosphere';
  currentLevel: number;
  maxLevel: number;
  cost: number;
  benefits: string;
  description: string;
}

interface StadiumProps {
  name: string;
  capacity: number;
  maxCapacity: number;
  atmosphere: number;
  fame: number;
  facilities: number;
}

export function StadiumManagement({ name, capacity, maxCapacity, atmosphere, fame, facilities }: StadiumProps) {
  const [selectedUpgrade, setSelectedUpgrade] = useState<StadiumUpgrade | null>(null);
  const [budget, setBudget] = useState(500000);

  const upgrades: StadiumUpgrade[] = [
    {
      id: 'seating',
      name: 'Seating Capacity',
      icon: '🎫',
      category: 'capacity',
      currentLevel: 2,
      maxLevel: 5,
      cost: 250000,
      benefits: '+2,000 capacity, +5 fame',
      description: 'Expand stadium seating area',
    },
    {
      id: 'pitch',
      name: 'Pitch Quality',
      icon: '🌱',
      category: 'facilities',
      currentLevel: 3,
      maxLevel: 5,
      cost: 150000,
      benefits: '+10 atmosphere, better ball movement',
      description: 'Upgrade pitch surface and maintenance',
    },
    {
      id: 'lighting',
      name: 'Stadium Lighting',
      icon: '💡',
      category: 'facilities',
      currentLevel: 2,
      maxLevel: 4,
      cost: 120000,
      benefits: '+8 atmosphere, night matches enabled',
      description: 'Install modern LED lighting system',
    },
    {
      id: 'commercials',
      name: 'Commercial Spaces',
      icon: '🏪',
      category: 'facilities',
      currentLevel: 1,
      maxLevel: 5,
      cost: 200000,
      benefits: '+15% match revenue',
      description: 'Expand hospitality and commercial areas',
    },
    {
      id: 'atmosphere',
      name: 'Fan Experience',
      icon: '🎊',
      category: 'atmosphere',
      currentLevel: 2,
      maxLevel: 5,
      cost: 100000,
      benefits: '+12 atmosphere, better crowd support',
      description: 'Improve fan experience and entertainment',
    },
    {
      id: 'training',
      name: 'Training Ground',
      icon: '🏋️',
      category: 'facilities',
      currentLevel: 1,
      maxLevel: 4,
      cost: 180000,
      benefits: '+20% training effectiveness',
      description: 'Develop advanced training facilities',
    },
  ];

  const handleUpgrade = (upgrade: StadiumUpgrade) => {
    if (upgrade.currentLevel < upgrade.maxLevel && budget >= upgrade.cost) {
      setBudget(budget - upgrade.cost);
      setSelectedUpgrade(upgrade);
      setTimeout(() => setSelectedUpgrade(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stadium Overview */}
      <div className="card p-6">
        <h3 className="text-2xl font-bold mb-4">🏟️ {name}</h3>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Capacity */}
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-sm">Capacity</p>
            <p className="text-2xl font-bold">{capacity.toLocaleString()}</p>
            <div className="w-full bg-gray-700 rounded h-2 mt-2">
              <div
                className="h-full bg-blue-500 rounded transition-all"
                style={{ width: `${(capacity / maxCapacity) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">{maxCapacity.toLocaleString()} max</p>
          </div>

          {/* Atmosphere */}
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-sm">Atmosphere</p>
            <p className="text-2xl font-bold">{atmosphere}/100</p>
            <div className="w-full bg-gray-700 rounded h-2 mt-2">
              <div
                className="h-full bg-purple-500 rounded transition-all"
                style={{ width: `${(atmosphere / 100) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Crowd support</p>
          </div>

          {/* Fame */}
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-sm">Stadium Fame</p>
            <p className="text-2xl font-bold text-yellow-400">{fame}</p>
            <p className="text-xs text-gray-400 mt-1">Global reputation</p>
          </div>

          {/* Facilities */}
          <div className="bg-gray-800 p-4 rounded">
            <p className="text-gray-400 text-sm">Facilities Level</p>
            <p className="text-2xl font-bold text-green-400">{facilities}</p>
            <p className="text-xs text-gray-400 mt-1">Infrastructure</p>
          </div>
        </div>

        {/* Budget */}
        <div className="border-t border-gray-700 pt-4">
          <p className="text-sm text-gray-400 mb-2">Available Budget</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-500">{budget.toLocaleString()}</span>
            <span className="text-gray-400">coins</span>
          </div>
        </div>
      </div>

      {/* Upgrade Sections */}
      {['capacity', 'facilities', 'atmosphere'].map((category) => (
        <div key={category} className="card p-6">
          <h4 className="text-lg font-bold mb-4">
            {category === 'capacity'
              ? '🎫 Capacity Upgrades'
              : category === 'facilities'
              ? '⚙️ Facility Upgrades'
              : '🎊 Atmosphere Upgrades'}
          </h4>

          <div className="space-y-3">
            {upgrades
              .filter((u) => u.category === category)
              .map((upgrade) => (
                <div key={upgrade.id} className="bg-gray-800 p-4 rounded">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h5 className="font-bold mb-1">
                        {upgrade.icon} {upgrade.name}
                      </h5>
                      <p className="text-sm text-gray-400">{upgrade.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        Level {upgrade.currentLevel}/{upgrade.maxLevel}
                      </p>
                      <p className="text-lg font-bold text-yellow-400 mt-1">
                        {upgrade.cost.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Level Progress */}
                  <div className="w-full bg-gray-700 rounded h-2 mb-3">
                    <div
                      className="h-full bg-blue-500 rounded transition-all"
                      style={{ width: `${(upgrade.currentLevel / upgrade.maxLevel) * 100}%` }}
                    ></div>
                  </div>

                  {/* Benefits */}
                  <p className="text-sm text-green-400 mb-3">✓ {upgrade.benefits}</p>

                  {/* Upgrade Button */}
                  <button
                    onClick={() => handleUpgrade(upgrade)}
                    disabled={upgrade.currentLevel >= upgrade.maxLevel || budget < upgrade.cost}
                    className={`w-full py-2 rounded font-bold transition-colors ${
                      upgrade.currentLevel >= upgrade.maxLevel
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : budget >= upgrade.cost
                        ? 'btn btn-primary'
                        : 'bg-gray-700 text-red-400 cursor-not-allowed'
                    }`}
                  >
                    {upgrade.currentLevel >= upgrade.maxLevel
                      ? '✓ Max Level'
                      : budget >= upgrade.cost
                      ? 'Upgrade'
                      : 'Insufficient Funds'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      ))}

      {/* Upgrade History */}
      <div className="card p-6">
        <h4 className="text-lg font-bold mb-4">📋 Recent Upgrades</h4>

        <div className="space-y-2">
          {[
            { name: 'Pitch Quality Upgraded to Level 3', time: '2 days ago' },
            { name: 'Seating Capacity Expanded', time: '1 week ago' },
            { name: 'Stadium Lighting Installed', time: '2 weeks ago' },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm bg-gray-800 p-3 rounded">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-gray-400 text-xs">{item.time}</p>
              </div>
              <span className="text-green-500">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Stadium Selection Component
interface StadiumOption {
  name: string;
  city: string;
  capacity: number;
  atmosphere: number;
  cost: number;
  icon: string;
}

export function StadiumSelection({ onSelect }: { onSelect: (stadium: string) => void }) {
  const stadiums: StadiumOption[] = [
    {
      name: 'Metropolitan Arena',
      city: 'New York',
      capacity: 70000,
      atmosphere: 85,
      cost: 50000000,
      icon: '🏟️',
    },
    {
      name: 'Sunset Park Stadium',
      city: 'Los Angeles',
      capacity: 65000,
      atmosphere: 78,
      cost: 45000000,
      icon: '🏟️',
    },
    {
      name: 'Central Park Field',
      city: 'Chicago',
      capacity: 55000,
      atmosphere: 72,
      cost: 35000000,
      icon: '⚽',
    },
    {
      name: 'Riverside Ground',
      city: 'Miami',
      capacity: 45000,
      atmosphere: 80,
      cost: 25000000,
      icon: '⚽',
    },
  ];

  return (
    <div className="card p-6">
      <h3 className="text-xl font-bold mb-4">🏟️ Choose Your Stadium</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stadiums.map((stadium) => (
          <button
            key={stadium.name}
            onClick={() => onSelect(stadium.name)}
            className="bg-gray-800 hover:bg-gray-700 p-4 rounded border-2 border-gray-700 hover:border-blue-500 transition-colors text-left"
          >
            <h4 className="font-bold text-lg mb-2">
              {stadium.icon} {stadium.name}
            </h4>
            <p className="text-sm text-gray-400 mb-3">{stadium.city}</p>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-gray-400 text-xs">Capacity</p>
                <p className="font-bold">{(stadium.capacity / 1000).toFixed(0)}K</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Atmosphere</p>
                <p className="font-bold text-purple-400">{stadium.atmosphere}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Cost</p>
                <p className="font-bold text-yellow-400">{(stadium.cost / 1000000).toFixed(0)}M</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
