import { gotScraping } from 'got-scraping';
import { fetchPlayerDetails, getATPTop100, getWTATop100, fetchLiveMatches, fetchUpcomingMatches, fetchHeadToHead } from '../../../services/1xbetService.js';
import { withCors } from '../../../utils/cors.js';
import { VERSION } from '../../../utils/version.js';

const handler = async (req, res) => {
    try {
        const { id, name: playerName } = req.query;

        if (!id) {
            return res.status(400).json({ error: 'Player ID is required' });
        }

        let stringId = id;

        // If the ID looks numeric (1xBet integer ID), try to find its string counterpart
        if (/^\d+$/.test(id)) {
            const numId = parseInt(id, 10);

            // Fetch rankings to resolve id
            const [atp, wta] = await Promise.all([
                getATPTop100(),
                getWTATop100()
            ]);

            const allPlayers = [...atp, ...wta];
            const found = allPlayers.find(p => p.xId === numId);

            if (found && found.id) {
                stringId = found.id;
            } else if (playerName) {
                // FALLBACK 1: Search by name in top 100 rankings metadata
                const foundByName = allPlayers.find(p =>
                    p.name && (
                        p.name.toLowerCase().includes(playerName.toLowerCase()) ||
                        playerName.toLowerCase().includes(p.name.toLowerCase())
                    )
                );
                if (foundByName && foundByName.id) {
                    stringId = foundByName.id;
                }
            }

            if (stringId === id) { // Still not found
                // FALLBACK 2: Search in live and upcoming matches
                const [live, upcoming] = await Promise.all([
                    fetchLiveMatches(),
                    fetchUpcomingMatches()
                ]);
                const match = [...live, ...upcoming].find(m => m.player1Id === numId || m.player2Id === numId);

                if (match?.id) {
                    try {
                        const h2hRes = await gotScraping.get(`https://eventsstat.com/en/services-api/SiteService/HeadToHead?gameId=${match.id}&partner=1&ln=en&geo=158`, {
                            headers: { 'Referer': `https://sa.1xbet.com/en/statistic/game/tennis/${match.id}` },
                            responseType: 'json'
                        });
                        const h2h = h2hRes.body;

                        // Recursive search for exact XI property match in HeadToHead data
                        const searchRecursively = (obj) => {
                            if (!obj || typeof obj !== 'object') return;
                            if (obj.XI === numId && obj.I && typeof obj.I === 'string') {
                                stringId = obj.I;
                                return;
                            }
                            for (const key of Object.keys(obj)) {
                                if (stringId !== id) return; // Stop if already found
                                searchRecursively(obj[key]);
                            }
                        }
                        searchRecursively(h2h);
                    } catch (err) {
                        console.error("H2H Fallback Error mapping player:", err.message);
                    }
                }
            }
        }

        const playerDetails = await fetchPlayerDetails(stringId);

        // If not found, create a fallback profile so the iOS app doesn't crash.
        const fallbackProfile = {
            id: stringId,
            name: playerName || "Unknown Player",
            image: null,
            countryId: null,
            countryName: null,
            birthDate: null,
            earnings: [],
            form: []
        };

        const finalDetails = (playerDetails && Object.keys(playerDetails).length > 0) ? playerDetails : fallbackProfile;

        // Try to fetch form/h2h for this player
        let form = null;
        try {
            // Find any match involving this player to get their form from H2H endpoint
            const [live, upcoming] = await Promise.all([
                fetchLiveMatches(),
                fetchUpcomingMatches()
            ]);

            const pIdNum = parseInt(id, 10);
            const match = [...live, ...upcoming].find(m => {
                if (!isNaN(pIdNum)) {
                    return m.player1Id === pIdNum || m.player2Id === pIdNum;
                } else if (playerName) {
                    const searchName = playerName.toLowerCase();
                    return (m.player1?.toLowerCase().includes(searchName) ||
                        m.player2?.toLowerCase().includes(searchName));
                }
                return false;
            });

            if (match) {
                const h2h = await fetchHeadToHead(match.id);
                if (h2h) {
                    // Determine which form to use based on name match if pIdNum is NaN
                    const isP1 = !isNaN(pIdNum) ? (match.player1Id === pIdNum) : (match.player1?.toLowerCase().includes(playerName.toLowerCase()));
                    form = isP1 ? h2h.player1Form : h2h.player2Form;
                }
            }
        } catch (err) {
            console.error("Error fetching player form:", err.message);
        }

        res.status(200).json({
            success: true,
            version: VERSION,
            data: {
                ...finalDetails,
                form: form || finalDetails.form
            }
        });

    } catch (error) {
        console.error(`Error in /api/player/${req.query.id}:`, error);

        // Return 200 with minimal empty profile to avoid iOS -1011 error
        res.status(200).json({
            success: false,
            version: VERSION,
            data: {
                id: req.query.id,
                name: req.query.name || "Unknown Player",
                form: [],
                earnings: []
            }
        });
    }
};

export default withCors(handler);
