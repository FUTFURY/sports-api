import { fetchLiveMatches, fetchUpcomingMatches, fetchTournamentBracket, fetchTournaments } from '../../../services/1xbetService.js';
import { withCors } from '../../../utils/cors.js';
import { VERSION } from '../../../utils/version.js';

/**
 * GET /api/tournament/:id (or /api/tournaments when id is 'all' / 'index')
 */
const handler = async (req, res) => {
    const { id, lang, lng, tz, sportId } = req.query;

    // Handle list all tournaments (/api/tournaments)
    if (!id || id === 'all' || id === 'index') {
        try {
            const finalLang = lang || lng || 'fr';
            const finalTz = tz || '1';
            const finalSportId = sportId || '1';

            const tournaments = await fetchTournaments(finalSportId, finalLang, finalTz);

            return res.status(200).json({
                success: true,
                version: VERSION,
                data: tournaments,
                count: tournaments.length
            });
        } catch (error) {
            console.error('API Error /tournaments:', error);
            return res.status(500).json({ success: false, version: VERSION, message: 'Internal Server Error' });
        }
    }

    // A: Try direct scraping with the provided ID (numeric OR hex)
    try {
        const bracket = await fetchTournamentBracket(id);
        if (bracket && bracket.T?.Stages && bracket.T.Stages.length > 0) {
            return res.status(200).json({
                success: true,
                version: VERSION,
                data: bracket
            });
        }
    } catch (e) {
        console.warn(`Direct scraping for ID ${id} failed:`, e.message);
    }

    // B: FALLBACK - Contextual lookup
    let tournamentId = parseInt(id, 10);
    const isNumeric = !isNaN(tournamentId);

    try {
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(),
            fetchUpcomingMatches()
        ]);

        const allMatches = [...live, ...upcoming];
        let targetMatches = [];

        if (isNumeric) {
            targetMatches = allMatches.filter(m => m.tournamentId === tournamentId);
        }

        const hexId = targetMatches.find(m => m.venueImageId)?.venueImageId;
        if (hexId && hexId !== id) {
            try {
                const bracket = await fetchTournamentBracket(hexId);
                if (bracket && bracket.T?.Stages && bracket.T.Stages.length > 0) {
                    return res.status(200).json({
                        success: true,
                        version: VERSION,
                        data: bracket
                    });
                }
            } catch (fallbackErr) {
                console.warn(`Fallback bracket fetching failed for hexId ${hexId}:`, fallbackErr.message);
            }
        }

        if (targetMatches.length === 0) {
            return res.status(200).json({
                success: true,
                version: VERSION,
                data: { T: { N: null, Stages: [] } }
            });
        }

        const tournamentName = targetMatches[0]?.tournamentName ?? null;
        const stageMap = new Map();
        for (const match of targetMatches) {
            const round = match.round ?? 'Matchs';
            if (!stageMap.has(round)) stageMap.set(round, []);

            stageMap.get(round).push({
                I: String(match.id),
                D: match.startTime,
                W: null,
                St: match.isLive ? 2 : 1,
                H: { XI: match.player1Id, T: match.player1 },
                A: { XI: match.player2Id, T: match.player2 },
                S1: match.score?.gamesPlayer1 ?? null,
                S2: match.score?.gamesPlayer2 ?? null,
                P: null
            });
        }

        const ROUND_ORDER = [
            'Round of 128', 'Round of 64', 'Round of 32', 'Round of 16',
            'Quarter-final', 'Semi-final', 'Final'
        ];
        const stages = Array.from(stageMap.entries()).map(([N, Games]) => ({ N, Games }));
        stages.sort((a, b) => {
            const ai = ROUND_ORDER.indexOf(a.N);
            const bi = ROUND_ORDER.indexOf(b.N);
            if (ai === -1 && bi === -1) return 0;
            if (ai === -1) return -1;
            if (bi === -1) return 1;
            return ai - bi;
        });

        return res.status(200).json({
            success: true,
            version: VERSION,
            data: { T: { N: tournamentName, Stages: stages } }
        });

    } catch (error) {
        return res.status(200).json({
            success: false,
            version: VERSION,
            data: { T: { N: "Matches", Stages: [] } }
        });
    }
};

export default withCors(handler);
