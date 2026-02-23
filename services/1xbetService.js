import { gotScraping } from 'got-scraping';
import cache from '../utils/cache.js';
import { mapMatch, mapTournament, mapRanking, mapPlayerDetails } from '../mappers/1xbet.js';

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

// Helper pour faire les requêtes via gotScraping
async function scrapingGet(url) {
    const response = await gotScraping.get(url, {
        headers: COMMON_HEADERS,
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
    fetchTournamentDetails
};
