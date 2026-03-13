import { fetchUpcomingMatches, fetchResults } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

const handler = async (req, res) => {
    try {
        const { date } = req.query; // Expected format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date parameter (YYYY-MM-DD) is required.' });
        }

        const requestedDate = new Date(date).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);

        let matches = [];
        if (requestedDate < today) {
            // Fetch historical results
            const dateStr = date; // date is already YYYY-MM-DD
            matches = await fetchResults(dateStr);
        } else {
            // Fetch current/future line matches
            const upcoming = await fetchUpcomingMatches();
            const nextDate = new Date(requestedDate).setDate(new Date(requestedDate).getDate() + 1);
            matches = upcoming.filter(match => {
                if (!match.startTime) return false;
                const matchTimeMs = match.startTime * 1000;
                return matchTimeMs >= requestedDate && matchTimeMs < nextDate;
            });
        }

        res.status(200).json({
            success: true,
            version: VERSION,
            data: matches,
            count: matches.length
        });
    } catch (error) {
        console.error('API Error /calendar:', error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
