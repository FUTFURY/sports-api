import { fetchPlayerDetails } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Player ID is required' });
    }

    try {
        const playerDetails = await fetchPlayerDetails(id);

        if (!playerDetails || Object.keys(playerDetails).length === 0) {
            return res.status(404).json({ error: 'Player not found or data unavailable' });
        }

        res.status(200).json(playerDetails);
    } catch (error) {
        console.error(`Error in /api/player/${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch player details' });
    }
}

export default withCors(handler);
