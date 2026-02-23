import { fetchLiveMatches, fetchUpcomingMatches } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(),
            fetchUpcomingMatches()
        ]);

        res.status(200).json({
            success: true,
            data: {
                live,
                upcoming
            }
        });
    } catch (error) {
        console.error('API Error /matches:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
