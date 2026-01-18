import type { NextApiRequest, NextApiResponse } from 'next';

const playerDatabase = new Map<string, any>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { period = 'month' } = req.query;

  if (req.method === 'GET') {
    try {
      // Create mock leaderboard
      const leaderboard = Array.from(playerDatabase.values())
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 100)
        .map((player, index) => ({
          rank: index + 1,
          address: player.address,
          name: player.name,
          rating: player.rating,
          wins: player.wins || 0,
          gamesPlayed: player.gamesPlayed || 0,
          badges: (player.badges || []).length,
        }));

      // Add default players if empty
      if (leaderboard.length === 0) {
        const defaultPlayers = [
          {
            rank: 1,
            address: '0x1234567890123456789012345678901234567890',
            name: 'Top Player',
            rating: 2500,
            wins: 150,
            gamesPlayed: 200,
            badges: 6,
          },
          {
            rank: 2,
            address: '0x0987654321098765432109876543210987654321',
            name: 'Pro Gamer',
            rating: 2200,
            wins: 140,
            gamesPlayed: 200,
            badges: 5,
          },
          {
            rank: 3,
            address: '0x1111111111111111111111111111111111111111',
            name: 'Rising Star',
            rating: 1900,
            wins: 130,
            gamesPlayed: 200,
            badges: 4,
          },
        ];
        return res.status(200).json(defaultPlayers);
      }

      return res.status(200).json(leaderboard);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
