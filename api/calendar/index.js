import { fetchUpcomingMatches, fetchPastMatches, fetchLiveMatches, fetchFutureMatches } from '../../services/1xbetService.js';
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

        const sport = parseInt(req.query.sport) || 4; // Defaults to Tennis

        if (requestedDate < today) {
            // It's a past date, fetch past results using new API
            filtered = await fetchPastMatches(date);
        } else if (requestedDate === today) {
            // It's today, fetch live + upcoming imminent
            const [upcoming, live] = await Promise.all([
                fetchUpcomingMatches(sport),
                fetchLiveMatches() // Live API usually covers all sports but we filter later
            ]);

            const allActive = [...live, ...upcoming];

            filtered = allActive.filter(match => {
                if (!match.startTime) return false;
                const matchTimeMs = match.startTime * 1000;
                return matchTimeMs >= requestedDate && matchTimeMs < nextDate;
            });
        } else {
            // It's a future date, use Get1x2_Zip for targeted day
            filtered = await fetchFutureMatches(date, sport);
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
