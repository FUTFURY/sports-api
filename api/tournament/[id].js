import { fetchTournamentDetails } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
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

export default withCors(handler);
