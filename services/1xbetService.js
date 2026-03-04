// Version: 1.0.3 (Robust mirror fix)
import { gotScraping } from 'got-scraping';
import cache from '../utils/cache.js';
import { mapMatch, mapTournament, mapRanking, mapPlayerDetails, mapH2H } from '../mappers/1xbet.js';
import { fetchWithRotation } from './robustSearchService.js';

// Configuration du domaine et des constantes
const MAIN_BASE_URL = 'https://sa.1xbet.com';
const RANKING_BASE_URL = 'https://sa.1xbet.com/en/services-api/SiteService/RatingDetailedNewBySelectors';
const SPORT_ID_TENNIS = 4;

const ATP_TOURN_ID = '5b19067ef87e5825813fb409';
const WTA_TOURN_ID = '5b19057ef87e5825813dc074';

// Configuration des headers "Ninja" pour passer les anti-bots
const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://sa.1xbet.com/en/live/tennis',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

// Helper pour faire les requêtes via gotScraping
async function scrapingGet(url, customHeaders = {}) {
    const response = await gotScraping.get(url, {
        headers: { ...COMMON_HEADERS, ...customHeaders },
        responseType: 'text', // Better to handle JSON vs HTML manually
        timeout: {
            request: 10000 // 10s timeout to avoid serverless hang
        }
    });

    if (!response.body) return null;

    // Auto-parse JSON if it looks like it, otherwise return body
    if (response.body.trim().startsWith('{') || response.body.trim().startsWith('[')) {
        try {
            return JSON.parse(response.body);
        } catch (e) {
            return response.body;
        }
    }
    return response.body;
}

// -- 1XBET MAIN API FETCHERS --

export const fetchLiveMatches = async () => {
    const cacheKey = 'live_matches';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LiveFeed/Get1x2_VZip?sports=${SPORT_ID_TENNIS}&count=40&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true&noFilterBlockEvent=true`;
        const data = await scrapingGet(url);
        const matches = data?.Value || [];
        const normalized = matches.map(mapMatch).filter(Boolean);
        cache.set(cacheKey, normalized, 60);
        return normalized;
    } catch (error) {
        console.error('Error fetching live matches:', error.message);
        return [];
    }
};

export const fetchUpcomingMatches = async () => {
    const cacheKey = 'upcoming_matches';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=${SPORT_ID_TENNIS}&count=40&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;
        const data = await scrapingGet(url);
        const matches = data?.Value || [];
        const normalized = matches.map(mapMatch).filter(Boolean);
        cache.set(cacheKey, normalized, 300);
        return normalized;
    } catch (error) {
        console.error('Error fetching upcoming matches:', error.message);
        return [];
    }
};

export const fetchResults = async (date) => {
    const cacheKey = `results_${date}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // day format: YYYY-MM-DD
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/GetResultsZip?sports=${SPORT_ID_TENNIS}&lng=en&day=${date}&country=158`;
        const data = await scrapingGet(url);

        let allMatches = [];
        if (Array.isArray(data?.Value)) {
            data.Value.forEach(league => {
                if (Array.isArray(league.G)) {
                    league.G.forEach(g => {
                        const m = mapMatch(g);
                        if (m) {
                            // Ensure league info is attached if missing in game object
                            if (!m.tournamentName) m.tournamentName = league.L;
                            if (!m.tournamentId) m.tournamentId = league.I;
                            allMatches.push(m);
                        }
                    });
                }
            });
        }

        cache.set(cacheKey, allMatches, 3600);
        return allMatches;
    } catch (error) {
        console.error(`Error fetching results for ${date}:`, error.message);
        return [];
    }
};

export const fetchTournaments = async () => {
    const cacheKey = 'active_tournaments';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Derive tournaments from matches since the GetChampsZip endpoint is unreliable
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(),
            fetchUpcomingMatches()
        ]);

        const allMatches = [...live, ...upcoming];
        const tournamentsMap = new Map();

        allMatches.forEach(match => {
            if (match.tournamentId && match.tournamentName && !tournamentsMap.has(match.tournamentId)) {
                tournamentsMap.set(match.tournamentId, {
                    id: match.tournamentId,
                    name: match.tournamentName,
                    eventsStatId: match.venueImageId || null,
                    isTop: false // We can't easily determine this when deriving
                });
            }
        });

        const normalized = Array.from(tournamentsMap.values()).map(mapTournament);
        cache.set(cacheKey, normalized, 3600);
        return normalized;
    } catch (error) {
        console.error('Error deriving tournaments:', error.message);
        return [];
    }
};

export const fetchMatchDetails = async (id, isLive = false) => {
    const cacheKey = `match_details_${id}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const endpoint = isLive ? '/service-api/LiveFeed/GetGameZip' : '/service-api/LineFeed/GetGameZip';
        const url = `${MAIN_BASE_URL}${endpoint}?id=${id}&lng=en&mode=4&country=158`;
        const data = await scrapingGet(url);
        const game = data?.Value || data;
        if (!game) return null;
        const g = Array.isArray(game) ? game[0] : game;
        let normalized = mapMatch(g);
        if (normalized) {
            normalized._debug = {
                keys: Object.keys(g),
                hasSC: !!g.SC,
                scKeys: g.SC ? Object.keys(g.SC) : [],
                stFirstGroup: (g.SC && g.SC.ST && g.SC.ST[0]) ? {
                    hasValue: !!g.SC.ST[0].Value,
                    valueType: typeof g.SC.ST[0].Value,
                    val0Kind: (g.SC.ST[0].Value && g.SC.ST[0].Value[0]) ? typeof g.SC.ST[0].Value[0] : 'none'
                } : null
            };
        }
        cache.set(cacheKey, normalized, 60);
        return normalized;
    } catch (error) {
        console.error(`Error fetching match details for ID ${id}:`, error.message);
        return null;
    }
};

// -- EVENTSSTAT RANKING API FETCHERS --

export const fetchRankings = async (tournId, type) => {
    const cacheKey = `ranking_${type}_top100`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Use eventsstat.com endpoint with forced Referer to bypass WAF block
        const url = `https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors?tournId=${tournId}&recLimit=l.100&ln=en&partner=1&geo=158`;
        const data = await scrapingGet(url, {
            'Referer': `https://sa.1xbet.com/en/statistic/rating/tennis/${tournId}`
        });

        let players = [];
        if (data?.T?.R?.[0]) {
            const rows = data.T.R[0];
            const metaArray = Object.values(data.T.TM || {});

            players = rows.map(row => {
                const cols = row.C || [];
                const rank = cols[0]?.V?.[0] || cols[0]?.C;
                const playerId = cols[1]?.C;
                const age = cols[2]?.V?.[0] || cols[2]?.C || null;

                // ATP: col[3]=points col[4]=tourneys
                // WTA: col[3]=tourneys col[4]=points  (column order differs!)
                const isWTA = type === 'wta';
                const points = isWTA
                    ? (cols[4]?.V?.[0] || cols[4]?.C)
                    : (cols[3]?.V?.[0] || cols[3]?.C);
                const tourneys = isWTA
                    ? (cols[3]?.V?.[0] || cols[3]?.C)
                    : (cols[4]?.V?.[0] || cols[4]?.C);

                // Search for player in metadata array
                const playerData = metaArray.find(m => m.I === playerId);
                const playerName = playerData?.T || `Player_${playerId?.substring(0, 5)}`;

                return {
                    ...playerData,
                    I: playerId,
                    N: playerName,
                    P: rank,
                    Pts: points,
                    Age: age,
                    Tourneys: tourneys
                };
            }).filter(p => p.I);
        }

        const normalized = players.map(mapRanking).filter(Boolean);
        cache.set(cacheKey, normalized, 3600);
        return normalized;
    } catch (error) {
        console.error(`Error fetching ${type} ranking:`, error.message);
        return [];
    }
};

export const getATPTop100 = () => fetchRankings(ATP_TOURN_ID, 'atp');
export const getWTATop100 = () => fetchRankings(WTA_TOURN_ID, 'wta');

// -- EVENTSSTAT DETAILED STATS API FETCHERS --

export const fetchPlayerDetails = async (playerId) => {
    const cacheKey = `player_details_${playerId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Use eventsstat.com endpoint with forced Referer to bypass WAF block
        // Also ensure partner=1 to match rankings ID domain
        const url = `https://eventsstat.com/en/services-api/SiteService/PlayerDetailed?playerId=${playerId}&ln=en&partner=1&geo=158`;
        const data = await scrapingGet(url, {
            'Referer': `https://sa.1xbet.com/en/statistic/player/tennis/${playerId}`
        });

        if (!data) {
            return null;
        }

        const normalized = mapPlayerDetails(data);
        cache.set(cacheKey, normalized, 3600); // Cache for 1 hour
        return normalized;
    } catch (error) {
        console.error(`Error fetching player details for ${playerId}:`, error.message);
        return null;
    }
};

export const fetchTournamentDetails = async (tournamentId) => {
    const cacheKey = `tournament_details_${tournamentId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://sa.1xbet.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${tournamentId}&sId=4&ln=en&partner=0&geo=1`;
        const data = await scrapingGet(url);

        // If blocked by 1xBet (Status 203 or HTML response)
        if (!data || typeof data === 'string' || !data.T) {
            console.warn(`Official API blocked for tid ${tournamentId}. Trying EventsStat fallback scraping...`);
            const bracketFallback = await fetchTournamentBracket(tournamentId);
            if (bracketFallback) {
                cache.set(cacheKey, bracketFallback, 3600);
                return bracketFallback;
            }
            return null;
        }

        cache.set(cacheKey, data, 3600);
        return data;
    } catch (error) {
        console.error(`Error fetching tournament details for ${tournamentId}:`, error.message);
        // Last resort: try scraping even on exception
        return await fetchTournamentBracket(tournamentId);
    }
};

export const fetchHeadToHead = async (gameId) => {
    const cacheKey = `h2h_${gameId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://eventsstat.com/en/services-api/SiteService/HeadToHead?gameId=${gameId}&partner=1&ln=en&geo=158`;
        const data = await scrapingGet(url, {
            'Referer': `https://sa.1xbet.com/en/statistic/game/tennis/${gameId}`
        });

        if (!data) {
            return null;
        }

        const normalized = mapH2H(data);
        cache.set(cacheKey, normalized, 3600);
        return normalized;
    } catch (error) {
        console.error(`Error fetching H2H for game ${gameId}:`, error.message);
        return null;
    }
};

export const fetchTournamentBracket = async (hexId) => {
    const cacheKey = `bracket_${hexId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://eventsstat.com/en/statistic/stage/tennis/${hexId}`;
        const res = await gotScraping.get(url, {
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            },
            timeout: {
                request: 10000
            }
        });

        const body = res.body;
        const match = body.match(/window\.__NUXT__=(\(function\(.*?\}\(.*?\)\));/);
        if (!match) return null;

        const data = eval(match[1]);

        const findStagesMap = (obj) => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj.stagesMap) return obj.stagesMap;

            if (Array.isArray(obj.tabs)) {
                for (const tab of obj.tabs) {
                    if (Array.isArray(tab.items)) {
                        for (const item of tab.items) {
                            if ((item.title === 'Draw' || item.title === 'Tableau' || item.title === 'Net') && item.extra?.stageId) {
                                return item.extra.stageId;
                            }
                        }
                    }
                }
            }

            for (let key in obj) {
                if (typeof obj[key] === 'object' && key !== 'parent' && key !== '_root') {
                    const res = findStagesMap(obj[key]);
                    if (res) return res;
                }
            }
            return null;
        };

        let stagesMap = findStagesMap(data);
        if (!stagesMap) return null;

        if (typeof stagesMap === 'string' && /^[0-9a-f]{24}$/.test(stagesMap)) {
            return await fetchTournamentBracket(stagesMap);
        }

        const stageId = Object.keys(stagesMap)[0];
        const stageData = stagesMap[stageId];
        if (!stageData || !stageData.stageNetsItem) return null;

        const net = stageData.stageNetsItem;
        const stageNets = net.stageNets || [];
        const teamsMap = net.teamsMap || {};
        const scoresMap = net.matchInfoMiniMap || {};

        const stages = stageNets.map(sn => {
            const snStages = sn.stages || [];
            const allSubStages = snStages.flatMap(st => st.subStages || []);
            if (allSubStages.length === 0) return null;

            return allSubStages.map(sub => ({
                N: sub.title,
                Games: (sub.nodes || []).flat().filter(node => node.gameIdList?.length > 0).map(node => {
                    const gid = node.gameIdList[0];
                    const score = scoresMap[gid] || {};
                    const t1Id = node.teamIds?.[0];
                    const t2Id = node.teamIds?.[1];
                    const t1 = teamsMap[t1Id] || {};
                    const t2 = teamsMap[t2Id] || {};

                    const isFinished = !!score.winner || (score.status === 'g' || score.status === 3);

                    return {
                        I: gid,
                        D: score.date || null,
                        W: score.winner || null,
                        St: isFinished ? 3 : 1, // 3=Finished, 1=Scheduled
                        H: { XI: t1Id, T: t1.title || "À déterminer" },
                        A: { XI: t2Id, T: t2.title || "À déterminer" },
                        S1: score.score1 || score.scorePlayer1 || null,
                        S2: score.score2 || score.scorePlayer2 || null,
                        P: isFinished ? "FT" : null
                    };
                })
            }));
        }).flat().filter(Boolean);

        const result = { T: { N: stageData.title, Stages: stages } };
        cache.set(cacheKey, result, 3600);
        return result;
    } catch (error) {
        console.error(`Error scraping bracket for ${hexId}:`, error.message);
        return null;
    }
};

export const searchGlobal = async (term, sportId = 'all') => {
    let entities = [];
    try {
        const sportParam = sportId === 'all' ? '' : `&sportId=${sportId}`;
        const path = `/en/services-api/core-api/v1/search?search=${encodeURIComponent(term)}${sportParam}&lng=en&ref=1&fcountry=91&gr=285`;
        const data = await fetchWithRotation(path, 'stat').catch(() => ({ data: [] }));
        entities = data.data || [];
    } catch (e) {
        console.error('[searchGlobal] Entity rotation failed:', e.message);
    }

    let events = [];
    try {
        const pathLine = `/service-api/LineFeed/Web_SearchZip?text=${encodeURIComponent(term)}&limit=20&lng=en&country=158&mode=4`;
        const dLine = await fetchWithRotation(pathLine, '1xbet').catch(() => ({ Value: [] }));
        if (dLine && dLine.Value) events = [...events, ...dLine.Value];
    } catch (e) {
        console.error('Events line rotation failed:', e.message);
    }

    try {
        const pathLive = `/service-api/LiveFeed/Web_SearchZip?text=${encodeURIComponent(term)}&limit=10&lng=en&country=158&mode=4`;
        const dLive = await fetchWithRotation(pathLive, '1xbet').catch(() => ({ Value: [] }));
        if (dLive && dLive.Value) events = [...events, ...dLive.Value];
    } catch (e) {
        console.error('Events live rotation failed:', e.message);
    }

    const results = [];

    // Process search results
    entities.forEach(item => {
        let cat = 'Unknown';
        let type = 'unknown';
        if (item.type === 6) { cat = 'Teams'; type = 'team'; }
        else if (item.type === 7) { cat = 'Athletes'; type = 'player'; }
        else if (item.type === 10) { cat = 'Leagues'; type = 'league'; }

        if (cat !== 'Unknown') {
            results.push({
                id: String(item.id),
                name: item.title,
                subtitle: null,
                type: type,
                category: cat,
                isLive: false,
                rank: null,
                image: item.image || null
            });
        }
    });

    const uniqueEvents = Array.from(new Map(events.map(e => [e.I, e])).values());
    uniqueEvents.forEach(e => {
        results.push({
            id: String(e.I),
            name: `${e.O1} v ${e.O2}`,
            subtitle: e.L,
            type: 'event',
            category: 'Events',
            isLive: null,
            image: (e.O1IMG && e.O1IMG.length > 0) ? e.O1IMG[0] : null
        });
    });

    // Fallback: Local match lookup across loaded tennis matches
    try {
        const [live, upcoming, atp, wta] = await Promise.all([
            fetchLiveMatches().catch(() => []),
            fetchUpcomingMatches().catch(() => []),
            getATPTop100().catch(() => []),
            getWTATop100().catch(() => [])
        ]);

        const q = term.toLowerCase();
        [...live, ...upcoming].forEach(m => {
            if ((m.player1?.toLowerCase().includes(q) || m.player2?.toLowerCase().includes(q) || m.tournamentName?.toLowerCase().includes(q)) &&
                !results.some(r => r.id === String(m.id))) {
                results.push({
                    id: String(m.id),
                    name: `${m.player1} vs ${m.player2}`,
                    subtitle: m.tournamentName,
                    type: 'event',
                    category: 'Events',
                    isLive: m.isLive,
                    rank: null,
                    image: m.player1Image || null
                });
            }
        });

        [...atp, ...wta].forEach(p => {
            if (p.name?.toLowerCase().includes(q)) {
                const id = String(p.xId || p.id);
                if (!results.some(r => r.id === id)) {
                    results.push({
                        id,
                        name: p.name,
                        type: 'player',
                        category: 'Athletes',
                        isLive: false,
                        rank: p.rank,
                        image: p.image || null
                    });
                }
            }
        });
    } catch (e) {
        console.error('Fallback lookup error:', e.message);
    }

    return results;
};

export default {
    fetchLiveMatches,
    fetchUpcomingMatches,
    fetchTournaments,
    fetchMatchDetails,
    getATPTop100,
    getWTATop100,
    fetchPlayerDetails,
    fetchTournamentDetails,
    fetchHeadToHead,
    fetchResults,
    fetchTournamentBracket,
    searchGlobal
};
