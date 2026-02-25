import { fetchUpcomingMatches, fetchPastMatches, fetchLiveMatches } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';

const handler = async (req, res) => {
    try {
        const { date } = req.query; // Expected format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
        }

        const requestedDateTime = new Date(date);
        const requestedDate = requestedDateTime.setHours(0, 0, 0, 0);
        const nextDate = new Date(requestedDate).setDate(new Date(requestedDate).getDate() + 1);
        const today = new Date().setHours(0, 0, 0, 0);

        let filtered = [];

        if (requestedDate < today) {
            // It's a past date, fetch past results using new API
            filtered = await fetchPastMatches(date);
        } else {
            // It's today or future, fetch upcoming (and potentially live)
            const [upcoming, live] = await Promise.all([
                fetchUpcomingMatches(),
                fetchLiveMatches()
            ]);

            const allActive = [...live, ...upcoming];

            filtered = allActive.filter(match => {
                if (!match.startTime) return false;
                const matchTimeMs = match.startTime * 1000;
                return matchTimeMs >= requestedDate && matchTimeMs < nextDate;
            });
        }

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
