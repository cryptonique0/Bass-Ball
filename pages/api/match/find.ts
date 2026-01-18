import type { NextApiRequest, NextApiResponse } from 'next';

const matchDatabase: any[] = [];
const playerDatabase = new Map<string, any>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { playerAddress, playerRating } = req.body;

    if (!playerAddress) {
      return res.status(400).json({ error: 'Invalid player address' });
    }

    try {
      // Simulate finding an opponent
      const opponentAddress = '0x' + Math.random().toString(16).slice(2, 42);
      const matchId = 'match_' + Date.now();

      const match = {
        id: matchId,
        player1: playerAddress,
        player1Rating: playerRating || 1000,
        player2: opponentAddress,
        player2Rating: Math.floor(Math.random() * 500) + 800,
        status: 'active',
        createdAt: new Date(),
        startedAt: null,
        endedAt: null,
        winner: null,
        score: [0, 0],
      };

      matchDatabase.push(match);

      return res.status(200).json({
        matchId,
        opponent: opponentAddress,
        opponentRating: match.player2Rating,
        status: 'found',
      });
    } catch (error) {
      console.error('Error finding match:', error);
      return res.status(500).json({ error: 'Failed to find match' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
