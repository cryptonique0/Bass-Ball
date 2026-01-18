import type { NextApiRequest, NextApiResponse } from 'next';

// Mock database - replace with actual database
const playerDatabase = new Map<string, any>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (req.method === 'GET') {
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Invalid address' });
    }

    try {
      // Fetch or create player
      let player = playerDatabase.get(address.toLowerCase());

      if (!player) {
        player = {
          address: address.toLowerCase(),
          name: `Player ${address.slice(0, 6)}`,
          rating: 1000,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          badges: 0,
          createdAt: new Date().toISOString(),
        };
        playerDatabase.set(address.toLowerCase(), player);
      }

      return res.status(200).json({
        ...player,
        winRate: player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0,
      });
    } catch (error) {
      console.error('Error fetching player stats:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
