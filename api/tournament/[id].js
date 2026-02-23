import { fetchTournamentDetails } from '../../../services/1xbetService.js';
import cors from '../../../utils/cors.js';

export default async function handler(req, res) {
    // Enable CORS
    cors(req, res);

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Tournament ID is required' });
    }

    try {
        const tournamentDetails = await fetchTournamentDetails(id);

        if (!tournamentDetails || Object.keys(tournamentDetails).length === 0) {
            return res.status(404).json({ error: 'Tournament not found or data unavailable' });
        }

        res.status(200).json(tournamentDetails);
    } catch (error) {
        console.error(`Error in /api/tournament/${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch tournament details' });
    }
}
