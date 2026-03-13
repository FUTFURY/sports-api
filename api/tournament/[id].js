import { fetchLiveMatches, fetchUpcomingMatches, fetchTournamentBracket } from '../../../services/1xbetService.js';
import { withCors } from '../../../utils/cors.js';
import { VERSION } from '../../../utils/version.js';

/**
 * GET /api/tournament/:id
 *
 * Returns a bracket-compatible structure for the given 1xbet tournament ID (LI).
 * Builds bracket stages from live + line matches grouped by round.
 * Always returns 200 (empty Stages if no matches found) — never crashes the iOS app.
 */
const handler = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Tournament ID is required' });
    }

    // A: Try direct scraping with the provided ID (numeric OR hex)
    // Both types of IDs work on the EventsStat stage endpoint.
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

    // B: FALLBACK - Contextual lookup (useful if the provided ID is a category ID 
    // or if 1xbet numeric ID differs from EventsStat numeric ID)
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

        // Try to find the EventsStat Hex ID or other venueImageId from matches
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

        // C: LAST FALLBACK - Manual grouping of currently active matches
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
                St: match.isLive ? 2 : 1, // 2=Live, 1=Scheduled
                H: { XI: match.player1Id, T: match.player1 },
                A: { XI: match.player2Id, T: match.player2 },
                S1: match.score?.gamesPlayer1 ?? null,
                S2: match.score?.gamesPlayer2 ?? null,
                P: null
            });
        }

        // Sort stages by logical tournament round order
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
