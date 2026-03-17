// Version: 1.0.3 (Robust mirror fix)
import { gotScraping } from 'got-scraping';
import cache from '../utils/cache.js';
import { mapMatch, mapTournament, mapRanking, mapPlayerDetails, mapH2H } from '../mappers/1xbet.js';
import { fetchWithRotation } from './robustSearchService.js';

// Configuration du domaine et des constantes
const MAIN_BASE_URL = 'https://sa.1xbet.com';
const RANKING_BASE_URL = 'https://sa.1xbet.com/en/services-api/SiteService/RatingDetailedNewBySelectors';
const DEFAULT_SPORT_ID = 4; // Tennis

const ATP_TOURN_ID = '5b19067ef87e5825813fb409';
const WTA_TOURN_ID = '5b19057ef87e5825813dc074';

const DEFAULT_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'x-svc-source': '___BETTING_APP___',
    'x-app-n': '___BETTING_APP___'
};

// Helper to fetch dynamic sports list - USES DIRECT GOT TO AVOID RECURSION
export const fetchSports = async (lng = 'fr') => {
    const cacheKey = `sports_list_${lng}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://1xbet.et/service-api/restcore/api/External/v1/Web/Sports?lng=${lng}`;
        const response = await gotScraping.get(url, {
            headers: DEFAULT_HEADERS,
            responseType: 'json',
            timeout: { request: 5000 }
        });

        if (Array.isArray(response.body)) {
            cache.set(cacheKey, response.body, 86400);
            return response.body;
        }
        return [];
    } catch (e) {
        console.error('Error fetching sports list:', e.message);
        return [];
    }
};

// Simplified Referer helper to avoid async overhead where possible
function getRefererPath(sportId) {
    const map = { 1: 'football', 2: 'ice-hockey', 3: 'basketball', 4: 'tennis', 6: 'volleyball', 8: 'handball' };
    return map[sportId] || 'tennis';
}

// Configuration des headers "Ninja"
const getHeaders = (sportId = DEFAULT_SPORT_ID) => {
    return {
        ...DEFAULT_HEADERS,
        'Referer': `https://sa.1xbet.com/en/live/${getRefererPath(sportId)}`
    };
};

// Helper pour faire les requêtes via gotScraping
async function scrapingGet(url, customHeaders = {}, sportId = DEFAULT_SPORT_ID) {
    // Try both partner=1 and partner=368 if not specified
    const partners = customHeaders.partner ? [customHeaders.partner] : ['1', '368'];
    let lastError = null;

    for (const p of partners) {
        try {
            // Apply partner to URL if it contains partner=
            let finalUrl = url;
            if (url.includes('partner=') && !customHeaders.partner) {
                finalUrl = url.replace(/partner=[^&]+/, `partner=${p}`);
            } else if (url.includes('ref=') && !customHeaders.partner) {
                finalUrl = url.replace(/ref=[^&]+/, `ref=${p}`);
            }

            const response = await gotScraping.get(finalUrl, {
                headers: { ...getHeaders(sportId), ...customHeaders },
                responseType: 'text',
                timeout: { request: 5000 }
            });

            if (!response.body) continue;

            if (response.body.trim().startsWith('{') || response.body.trim().startsWith('[')) {
                try {
                    const parsed = JSON.parse(response.body);
                    if (parsed) return parsed;
                } catch (e) { }
            }
            if (response.body) return response.body;
        } catch (e) {
            lastError = e;
            console.error(`[scrapingGet] Partner ${p} failed for ${url}: ${e.message}`);
        }
    }
    return null;
}

// -- 1XBET MAIN API FETCHERS --

export const fetchLiveMatches = async (sportId = DEFAULT_SPORT_ID, lang = 'en', tz = '3') => {
    const cacheKey = `live_matches_${sportId}_${lang}_${tz}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LiveFeed/Get1x2_VZip?sports=${sportId}&count=40&lng=${lang}&mode=4&country=158&getEmpty=true&virtualSports=true&noFilterBlockEvent=true&tf=${tz}`;
        const data = await scrapingGet(url, {}, sportId);
        const matches = data?.Value || [];
        const normalized = matches.map(mapMatch).filter(Boolean);
        cache.set(cacheKey, normalized, 60);
        return normalized;
    } catch (error) {
        console.error(`Error fetching live matches for sport ${sportId}:`, error.message);
        return [];
    }
};

export const fetchUpcomingMatches = async (sportId = DEFAULT_SPORT_ID, lang = 'en', tz = '3') => {
    const cacheKey = `upcoming_matches_${sportId}_${lang}_${tz}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=${sportId}&count=40&lng=${lang}&mode=4&country=158&getEmpty=true&virtualSports=true&tf=${tz}`;
        const data = await scrapingGet(url, {}, sportId);
        const matches = data?.Value || [];
        const normalized = matches.map(mapMatch).filter(Boolean);
        cache.set(cacheKey, normalized, 300);
        return normalized;
    } catch (error) {
        console.error(`Error fetching upcoming matches for sport ${sportId}:`, error.message);
        return [];
    }
};

export const fetchResults = async (date, sportId = DEFAULT_SPORT_ID, lang = 'en', tz = '3') => {
    const cacheKey = `results_${date}_${sportId}_${lang}_${tz}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `${MAIN_BASE_URL}/service-api/LineFeed/GetResultsZip?sports=${sportId}&lng=${lang}&day=${date}&country=158&tf=${tz}`;
        const data = await scrapingGet(url, {}, sportId);

        let allMatches = [];
        if (Array.isArray(data?.Value)) {
            data.Value.forEach(league => {
                if (Array.isArray(league.G)) {
                    league.G.forEach(g => {
                        const m = mapMatch(g);
                        if (m) {
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
        console.error(`Error fetching results for ${date} sport ${sportId}:`, error.message);
        return [];
    }
};

export const fetchTournaments = async (sportId = DEFAULT_SPORT_ID, lang = 'en', tz = '3') => {
    const cacheKey = `active_tournaments_${sportId}_${lang}_${tz}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches(sportId, lang, tz),
            fetchUpcomingMatches(sportId, lang, tz)
        ]);

        const allMatches = [...live, ...upcoming];
        const tournamentsMap = new Map();

        allMatches.forEach(match => {
            if (match.tournamentId && match.tournamentName && !tournamentsMap.has(match.tournamentId)) {
                tournamentsMap.set(match.tournamentId, {
                    id: match.tournamentId,
                    name: match.tournamentName,
                    eventsStatId: match.venueImageId || null,
                    isTop: false
                });
            }
        });

        const normalized = Array.from(tournamentsMap.values()).map(mapTournament);
        cache.set(cacheKey, normalized, 3600);
        return normalized;
    } catch (error) {
        console.error(`Error deriving tournaments for sport ${sportId}:`, error.message);
        return [];
    }
};

export const fetchMatchDetails = async (id, isLive = false, sportId = DEFAULT_SPORT_ID, lang = 'en', tz = '3') => {
    const cacheKey = `match_details_${id}_${lang}_${tz}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const endpoint = isLive ? '/service-api/LiveFeed/GetGameZip' : '/service-api/LineFeed/GetGameZip';
        const url = `${MAIN_BASE_URL}${endpoint}?id=${id}&lng=${lang}&mode=4&country=158&tf=${tz}`;
        const data = await scrapingGet(url, {}, sportId);
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

export const fetchTournamentDetails = async (tournamentId, sportId = DEFAULT_SPORT_ID) => {
    const cacheKey = `tournament_details_${tournamentId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const url = `https://sa.1xbet.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${tournamentId}&sId=${sportId}&ln=en&partner=0&geo=1`;
        const data = await scrapingGet(url, {}, sportId);

        // If blocked by 1xBet (Status 203 or HTML response)
        if (!data || typeof data === 'string' || !data.T) {
            console.warn(`Official API blocked for tid ${tournamentId}. Trying EventsStat fallback scraping...`);
            if (sportId === 4) {
                const bracketFallback = await fetchTournamentBracket(tournamentId);
                if (bracketFallback) {
                    cache.set(cacheKey, bracketFallback, 3600);
                    return bracketFallback;
                }
            }
            return null;
        }

        cache.set(cacheKey, data, 3600);
        return data;
    } catch (error) {
        console.error(`Error fetching tournament details for ${tournamentId}:`, error.message);
        if (sportId === 4) return await fetchTournamentBracket(tournamentId);
        return null;
    }
};

export const fetchHeadToHead = async (gameId, sportId = DEFAULT_SPORT_ID) => {
    const cacheKey = `h2h_${gameId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    try {
        const sportsMap = { 1: 'football', 3: 'basketball', 4: 'tennis' };
        const sportName = sportsMap[sportId] || 'tennis';
        const url = `https://eventsstat.com/en/services-api/SiteService/HeadToHead?gameId=${gameId}&partner=1&ln=en&geo=158`;
        const data = await scrapingGet(url, {
            'Referer': `https://sa.1xbet.com/en/statistic/game/${sportName}/${gameId}`
        }, sportId);

        if (!data) return null;

        const normalized = mapH2H(data);
        cache.set(cacheKey, normalized, 3600);
        return normalized;
    } catch (error) {
        console.error(`Error fetching H2H for game ${gameId}:`, error.message);
        return null;
    }
};

export const fetchMatchDetailed = async (gameId, sportId = DEFAULT_SPORT_ID) => {
    const cacheKey = `match_detailed_${gameId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const sportsMap = { 1: 'football', 3: 'basketball', 4: 'tennis' };
    const sportName = sportsMap[sportId] || 'tennis';

    // Try MatchDetailed first, then Game endpoint as fallback
    const endpoints = [
        `https://eventsstat.com/en/services-api/SiteService/MatchDetailed?gameId=${gameId}&partner=1&ln=en&geo=158`,
        `https://eventsstat.com/services-api/SiteService/Game?gameId=${gameId}&partner=368&ln=en&geo=158`
    ];

    for (const url of endpoints) {
        try {
            const data = await scrapingGet(url, {
                'Referer': `https://sa.1xbet.com/en/statistic/game/${sportName}/${gameId}`
            }, sportId);

            if (data) {
                cache.set(cacheKey, data, 3600);
                return data;
            }
        } catch (error) {
            console.error(`Error fetching match info from ${url}:`, error.message);
        }
    }
    return null;
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

export const searchGlobal = async (term, lang = 'fr', tz = '1') => {
    let entities = [];
    const termEncoded = encodeURIComponent(term);

    // 1. Search for Entities (Teams, Players, Leagues) 
    // We try multiple endpoint variations to maximize data capture (the "Open Data" request)
    const searchEndpoints = [
        `/service-api/LineFeed/Web_SearchZip?text=${termEncoded}&limit=30&lng=${lang}&mode=4&country=158&gr=1208`,
        `/services-api/SiteService/Search?search=${termEncoded}&ln=${lang}&partner=1&geo=158&gr=1208`
    ];

    const mirrors = ['https://eventsstat.com', 'https://1xstavka.ru'];

    for (const mirror of mirrors) {
        const resultsPerMirror = [];
        for (const path of searchEndpoints) {
            try {
                const data = await scrapingGet(`${mirror}${path}`, {
                    'Referer': `${mirror}/${lang}/`
                });

                // Handle core-api or Web_SearchZip results
                if (data && data.Value && Array.isArray(data.Value)) {
                    // Extract leagues and teams from Web_SearchZip
                    data.Value.forEach(v => {
                        // Extract League as a potential entity
                        if (v.LI && v.L) {
                            resultsPerMirror.push({
                                id: String(v.LI),
                                name: v.L,
                                type: 10, // League
                                sportId: v.SI,
                                sportName: v.SN
                            });
                        }
                    });
                }
                else if (data && data.data && Array.isArray(data.data)) {
                    data.data.forEach(item => {
                        resultsPerMirror.push({
                            id: String(item.id),
                            name: item.title || item.name,
                            type: item.type,
                            image: item.image,
                            sportId: item.sportId,
                            sportName: item.sportName
                        });
                    });
                }
                // Handle SiteService format (data.D)
                else if (data && data.D && Array.isArray(data.D)) {
                    data.D.forEach(item => {
                        resultsPerMirror.push({
                            id: String(item.I),
                            name: item.T,
                            type: item.SI === 1 ? 6 : (item.P === 7 ? 7 : 10),
                            image: item.M,
                            sportId: item.SI,
                            sportName: null
                        });
                    });
                }
            } catch (e) {
                console.error(`[searchGlobal] mirror ${mirror} fail for ${path}:`, e.message);
            }
        }
        if (resultsPerMirror.length > 0) {
            entities = [...entities, ...resultsPerMirror];
            // Si on a déjà assez de résultats d'un miroir fiable, on peut s'arrêter
            if (entities.length > 10) break;
        }
    }

    // De-duplicate entities by ID
    const uniqueEntitiesMap = new Map();
    entities.forEach(e => { if (e.id && !uniqueEntitiesMap.has(e.id)) uniqueEntitiesMap.set(e.id, e); });
    entities = Array.from(uniqueEntitiesMap.values());

    if (entities.length === 0) {
        // Last-ditch attempt via fetchWithRotation if scrapingGet fails
        try {
            const data = await fetchWithRotation(searchPath, 'stat').catch(() => ({ data: [] }));
            entities = data.data || [];
        } catch (e) { }
    }

    let events = [];
    try {
        const pathLine = `/service-api/LineFeed/Web_SearchZip?text=${encodeURIComponent(term)}&limit=20&lng=${lang}&country=158&mode=4&tf=${tz}`;
        const dLine = await fetchWithRotation(pathLine, '1xbet').catch(() => ({ Value: [] }));
        if (dLine && dLine.Value) events = [...events, ...dLine.Value];
    } catch (e) {
        console.error('Events line rotation failed:', e.message);
    }

    try {
        const pathLive = `/service-api/LiveFeed/Web_SearchZip?text=${encodeURIComponent(term)}&limit=10&lng=${lang}&country=158&mode=4&tf=${tz}`;
        const dLive = await fetchWithRotation(pathLive, '1xbet').catch(() => ({ Value: [] }));
        if (dLive && dLive.Value) events = [...events, ...dLive.Value];
    } catch (e) {
        console.error('Events live rotation failed:', e.message);
    }

    const results = [];

    // Map pour stocker les noms "propres" (traduits) trouvés dynamiquement dans les events
    const cleanNamesMap = new Map();

    const normalizeName = (name) => {
        if (!name) return name;
        // Supprime les prefixes type "PAYS: " (ex: "ANGLIYa: League 1" -> "League 1")
        // Fonctionne sur n'importe quelle langue car on cible la structure "TEXTE: "
        const parts = name.includes(':') ? name.split(':') : [name];
        let n = parts.length > 1 ? parts[1].trim() : parts[0].trim();

        // Si le nom contient encore des caractères russes, on ne peut rien faire sans API, 
        // mais au moins le préfixe casse-pieds est parti.
        return n;
    };

    const uniqueEvents = Array.from(new Map(events.map(e => [e.I, e])).values());
    uniqueEvents.forEach(e => {
        // On profite des events pour mapper les vrais noms traduits des ligues et teams
        if (e.LI && e.L) cleanNamesMap.set(String(e.LI), e.L);
        if (e.O1I && e.O1) cleanNamesMap.set(String(e.O1I), e.O1);
        if (e.O2I && e.O2) cleanNamesMap.set(String(e.O2I), e.O2);

        results.push({
            id: String(e.I),
            name: `${e.O1} v ${e.O2}`,
            subtitle: normalizeName(e.L),
            type: 'event',
            category: 'Events',
            isLive: null,
            image: (e.O1IMG && e.O1IMG.length > 0) ? `https://sa.1xbet.com/sfiles/logo_teams/${e.O1IMG[0]}` : null,
            homeImage: (e.O1IMG && e.O1IMG.length > 0) ? `https://sa.1xbet.com/sfiles/logo_teams/${e.O1IMG[0]}` : null,
            awayImage: (e.O2IMG && e.O2IMG.length > 0) ? `https://sa.1xbet.com/sfiles/logo_teams/${e.O2IMG[0]}` : null,
            sportId: e.SI
        });
    });

    // Process search results (Entities) en utilisant notre map de noms enrichis
    entities.forEach(item => {
        let cat = 'Unknown';
        let typeStr = 'unknown';

        const rawType = parseInt(item.type);
        if (rawType === 6) { cat = 'Teams'; typeStr = 'team'; }
        else if (rawType === 7) { cat = 'Athletes'; typeStr = 'player'; }
        else if (rawType === 10) { cat = 'Leagues'; typeStr = 'league'; }

        if (cat !== 'Unknown') {
            // Enrichissement : si on a trouvé un meilleur nom (traduit) dans les events, on l'utilise
            const enrichedName = cleanNamesMap.get(item.id);
            const finalName = enrichedName || normalizeName(item.name);

            let finalImage = item.image;
            if (finalImage && !finalImage.startsWith('http')) {
                const isNumericPlaceholder = typeStr === 'league' && /^\d+\.png$/.test(finalImage) && finalImage.length > 10;
                if (isNumericPlaceholder) {
                    finalImage = null;
                } else {
                    const folder = (typeStr === 'league') ? 'logo_ligas' : 'logo_teams';
                    finalImage = `https://sa.1xbet.com/sfiles/${folder}/${finalImage}`;
                }
            }

            results.push({
                id: item.id,
                name: finalName || 'Unknown',
                subtitle: item.sportName || null,
                type: typeStr,
                category: cat,
                isLive: false,
                rank: null,
                image: finalImage,
                sportId: parseInt(item.sportId) || null
            });
        }
    });

    // Fallback: Local match lookup across loaded matches (default to tennis for performance)
    try {
        const [live, upcoming] = await Promise.all([
            fetchLiveMatches().catch(() => []),
            fetchUpcomingMatches().catch(() => [])
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
                    image: m.player1Image ? `https://sa.1xbet.com/sfiles/logo_teams/${m.player1Image}` : null,
                    sportId: m.sportId
                });
            }
        });
    } catch (e) {
        console.error('Search fallback error:', e.message);
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
    fetchMatchDetailed,
    fetchResults,
    fetchTournamentBracket,
    searchGlobal,
    fetchSports
};
