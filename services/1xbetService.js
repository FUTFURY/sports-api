import { gotScraping } from 'got-scraping';
import cache from '../utils/cache.js';
import { mapMatch, mapTournament, mapRanking, mapPlayerDetails, mapPastMatch } from '../mappers/1xbet.js';

// Configuration du domaine et des constantes
const MAIN_BASE_URL = 'https://sa.1xbet.com';
const RANKING_BASE_URL = 'https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors';
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

const BFF_HEADERS = {
    'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
    'Origin': 'https://sa.1xbet.com',
    'Referer': 'https://sa.1xbet.com/en/results',
    'x-app-n': '__RESULTS_FRONTEND__',
    'x-requested-with': 'XMLHttpRequest',
    'x-svc-source': '__RESULTS_FRONTEND__'
};

// Helper pour faire les requêtes via gotScraping
async function scrapingGet(url, customHeaders = null) {
    const response = await gotScraping.get(url, {
        headers: customHeaders || COMMON_HEADERS,
        responseType: 'json'
    });
    return response.body;
}

// -- 1XBET MAIN API FETCHERS --

export const fetchLiveMatches = async () => {
    const cacheKey = 'live_matches';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LiveFeed/Get1x2_VZip?sports=${SPORT_ID_TENNIS}&count=500&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true&noFilterBlockEvent=true`;
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

export const fetchUpcomingMatches = async (sportId = SPORT_ID_TENNIS) => {
    const cacheKey = `upcoming_matches_${sportId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=${sportId}&count=500&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;
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

export const fetchFutureMatches = async (date, sportId = SPORT_ID_TENNIS) => {
    // date: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    // Align with 1xbet day logic (approximated)
    const startOfDay = Date.UTC(year, month - 1, day);
    const tsFrom = Math.floor(startOfDay / 1000) - (3600 * 3); // 21:00 previous day
    const tsTo = tsFrom + 86400;

    const cacheKey = `future_matches_${sportId}_${date}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        // Use Get1x2_Zip (without V) as it supports deep future timestamps
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_Zip?sports=${sportId}&tsFrom=${tsFrom}&tsTo=${tsTo}&count=500&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;
        const data = await scrapingGet(url);
        const matches = data?.Value || [];
        const normalized = matches.map(mapMatch).filter(Boolean);
        cache.set(cacheKey, normalized, 300);
        return normalized;
    } catch (error) {
        console.error(`Error fetching future matches for ${date}:`, error.message);
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

export const fetchPastMatches = async (date) => {
    // Expected format for date parameter: 'YYYY-MM-DD'
    const [year, month, day] = date.split('-').map(Number);
    // 1xBet expects exactly 21:00:00 UTC of previous day to 21:00:00 UTC of current day for its result queries
    const requestedDate = Date.UTC(year, month - 1, day);
    const tsFrom = Math.floor(requestedDate / 1000) - (3600 * 3); // 21:00 previous day
    const tsTo = tsFrom + 86400; // 21:00 current day

    const cacheKey = `past_matches_${tsFrom}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const champsUrl = `${MAIN_BASE_URL}/service-api/result/web/api/v2/champs?dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1&sportIds=${SPORT_ID_TENNIS}`;

        let champsData;
        try {
            // Include cookie from test since v2/champs requires varying auth or is more strict.
            const customHeaders = {
                ...BFF_HEADERS,
                'Cookie': 'SESSION=80016c4acd5f2d7df457a551ba7acd14'
            };
            const rawBody = await scrapingGet(champsUrl, customHeaders);
            champsData = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
        } catch (e) {
            console.error('Cannot retrieve champs on this date:', e.message);
            return [];
        }

        const champs = champsData?.items || [];
        console.log(`Found ${champs.length} champs.`);
        if (!champs.length) return [];

        let allMatches = [];

        // Use Promise.all to fetch games for each championship concurrently, with a small concurrency limit if needed.
        // For standard size, doing it directly is usually fine.
        const promises = champs.map(async (champ) => {
            const gamesUrl = `${MAIN_BASE_URL}/service-api/result/web/api/v3/games?champId=${champ.id}&dateFrom=${tsFrom}&dateTo=${tsTo}&lng=en&ref=1`;
            try {
                const rawGames = await scrapingGet(gamesUrl, BFF_HEADERS);
                const gamesData = typeof rawGames === 'string' ? JSON.parse(rawGames) : rawGames;
                if (gamesData?.items && Array.isArray(gamesData.items)) {
                    return gamesData.items.map(mapPastMatch).filter(Boolean);
                }
            } catch (e) {
                // Ignore silent specific champ errors to retrieve others
            }
            return [];
        });

        const resultsArray = await Promise.all(promises);

        // Flatten
        for (const res of resultsArray) {
            allMatches = allMatches.concat(res);
        }

        cache.set(cacheKey, allMatches, 3600 * 24); // Cache for 24h since past matches do not change
        return allMatches;
    } catch (e) {
        console.error('Error fetching past matches:', e.message);
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
        const normalized = mapMatch(Array.isArray(game) ? game[0] : game);
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
        // partner=0 is required for player names (metadata) to be included in T.TM
        const url = `${RANKING_BASE_URL}?tournId=${tournId}&recLimit=l.100&ln=en&partner=0&geo=1`;
        const data = await scrapingGet(url);

        let players = [];
        if (data?.T?.R?.[0]) {
            const rows = data.T.R[0];
            const metaArray = Object.values(data.T.TM || {});

            players = rows.map(row => {
                const cols = row.C || [];
                const rank = cols[0]?.V?.[0] || cols[0]?.C;
                const playerId = cols[1]?.C;
                const points = cols[3]?.V?.[0] || cols[3]?.C;

                // Search for player in metadata array
                const playerData = metaArray.find(m => m.I === playerId);
                const playerName = playerData?.T || `Player_${playerId?.substring(0, 5)}`;

                return {
                    ...playerData, // Spread metadata first so 'P' (boolean) gets overwritten
                    I: playerId,
                    N: playerName,
                    P: rank,       // Ensure numerical rank is kept
                    Pts: points
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
        const url = `https://eventsstat.com/en/services-api/SiteService/PlayerDetailed?playerId=${playerId}&ln=en&partner=0&geo=1`;
        const data = await scrapingGet(url);

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
        const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${tournamentId}&sId=4&ln=en&partner=0&geo=1`;
        const data = await scrapingGet(url);

        if (!data || !data.T) {
            return null;
        }

        cache.set(cacheKey, data, 3600); // Cache for 1 hour
        return data; // Returning raw JSON structure for now as requested
    } catch (error) {
        console.error(`Error fetching tournament details for ${tournamentId}:`, error.message);
        return null;
    }
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
    fetchPastMatches
};
