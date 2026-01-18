import type { NextApiRequest, NextApiResponse } from 'next';

const matchHistory = new Map<string, any[]>();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { address } = req.query;

  if (req.method === 'GET') {
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Invalid address' });
    }

    try {
      // Return mock match history
      const history = matchHistory.get(address.toLowerCase()) || [];

      return res.status(200).json(history);
    } catch (error) {
      console.error('Error fetching match history:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
