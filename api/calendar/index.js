import { fetchUpcomingMatches } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const { date } = req.query; // Expected format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
        }

        const requestedDate = new Date(date).setHours(0, 0, 0, 0);
        const nextDate = new Date(requestedDate).setDate(new Date(requestedDate).getDate() + 1);

        const upcoming = await fetchUpcomingMatches();

        // Filter by timestamp 'S'.
        // 1xbet uses Unix timestamp in seconds for 'S'
        const filtered = upcoming.filter(match => {
            if (!match.startTime) return false;
            const matchTimeMs = match.startTime * 1000; // Convert to JS ms
            return matchTimeMs >= requestedDate && matchTimeMs < nextDate;
        });

        res.status(200).json({
            success: true,
            data: filtered,
            count: filtered.length
        });
    } catch (error) {
        console.error('API Error /calendar:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
