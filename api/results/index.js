import { fetchResults } from '../../services/1xbetService.js';
import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';

/**
 * GET /api/results?date=YYYY-MM-DD
 *
 * Returns finished matches for the given date, grouped by tournament.
 * Response shape:
 * {
 *   success: true,
 *   date: "2026-02-27",
 *   tournaments: [
 *     { id, name, country, matches: [...] },
 *     ...
 *   ]
 * }
 */
const handler = async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({
            success: false,
            message: 'Query param "date" (YYYY-MM-DD) is required.'
        });
    }

    // Reject future dates (results only exist for past/today)
    const requestedDate = new Date(date).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    if (requestedDate > today) {
        return res.status(400).json({
            success: false,
            message: 'Cannot fetch results for a future date.'
        });
    }

    try {
        const { lang, lng, tz, sportId } = req.query;
        const finalLang = lang || lng || 'fr';
        const finalTz = tz || '1';
        const finalSportId = sportId || '1';

        const matches = await fetchResults(date, finalSportId, finalLang, finalTz);

        // Group matches by tournament
        const grouped = new Map();
        for (const match of matches) {
            const tId = match.tournamentId ?? 0;
            if (!grouped.has(tId)) {
                grouped.set(tId, {
                    id: tId,
                    name: match.tournamentName ?? 'Unknown Tournament',
                    country: match.tournamentCountry ?? null,
                    matches: []
                });
            }
            grouped.get(tId).matches.push(match);
        }

        const tournaments = Array.from(grouped.values())
            .sort((a, b) => b.matches.length - a.matches.length); // biggest groups first

        res.status(200).json({
            success: true,
            version: VERSION,
            date,
            count: matches.length,
            tournaments
        });
    } catch (error) {
        console.error('API Error /results:', error);
        res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
    }
};

export default withCors(handler);
