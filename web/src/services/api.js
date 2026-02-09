import axios from 'axios';

// During development, we want to hit the local server if we are running it, 
// or the production server. 
// For now, let's assume the user IS running the backend locally on port 3000 (standard for Vercel dev)
// OR we can make it relative if served from same origin.

// Strategy: Use an environment variable or default to local for dev
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
    baseURL: API_URL,
});

export const getSports = async (dateFrom, dateTo, lng = 'fr') => {
    try {
        const response = await api.get('/get-sports', {
            params: { dateFrom, dateTo, lng }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching sports:", error);
        return [];
    }
};

export const getLeagues = async (sportId, dateFrom, dateTo, lng = 'fr') => {
    try {
        const response = await api.get('/get-leagues', {
            params: { sportId, dateFrom, dateTo, lng }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching leagues:", error);
        return [];
    }
};

export const getGames = async (champId, dateFrom, dateTo, lng = 'fr') => {
    try {
        const response = await api.get('/get-games', {
            params: { champId, dateFrom, dateTo, lng }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching games:", error);
        return [];
    }
};

export const getLiveGames = async (lng = 'fr') => {
    try {
        const response = await api.get('/get-live-games', {
            params: { lng }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching live games:", error);
        return [];
    }
};

export const getGameStats = async (id, lng = 'fr') => {
    try {
        const response = await api.get('/get-game-stats', {
            params: { id, lng }
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching game stats:", error);
        return null;
    }
};

export const searchEvents = async (text, lng = 'fr') => {
    try {
        const response = await api.get('/search', {
            params: { text, lng }
        });

        const data = response.data;

        // Check if we received the raw "rotten" JSON (has 'sport' array)
        if (data && data.sport && Array.isArray(data.sport) && !Array.isArray(data)) {
            console.log("Detected raw search results, cleaning in frontend...");
            return cleanSearchResults(data, text);
        }

        return data;
    } catch (error) {
        console.error("Error searching events:", error);
        return [];
    }
};

// Helper to clean raw 1xBet data if the backend returns it directly
const cleanSearchResults = (data, query) => {
    let results = [];
    const sports = data.sport || [];
    const lowerQuery = query.toLowerCase();

    sports.forEach(s => {
        const sportName = (s.name || "").trim();

        (s.champs || []).forEach(c => {
            // Add League
            results.push({
                type: 'League',
                id: c.id,
                name: c.name,
                sportName: sportName,
                logo: c.image,
                count: (c.games || []).length,
                leagueName: c.name // Self-reference for scoring
            });

            // Add Games
            (c.games || []).forEach(g => {
                results.push({
                    type: 'Game',
                    id: g.id,
                    name: `${g.opp1} - ${g.opp2}`,
                    team1: g.opp1,
                    team2: g.opp2,
                    score: g.score,
                    startTime: g.dateStart,
                    leagueId: c.id,
                    leagueName: c.name,
                    sportName: sportName
                });
            });
        });
    });

    // --- Extract Teams ---
    const distinctTeams = new Map();
    results.filter(r => r.type === 'Game').forEach(g => {
        [g.team1, g.team2].forEach(teamName => {
            const lowerTeam = teamName.toLowerCase();
            // Fuzzy match: if team name contains query or query contains team name
            if (lowerTeam.includes(lowerQuery) || lowerQuery.includes(lowerTeam)) {
                if (!distinctTeams.has(teamName)) {
                    distinctTeams.set(teamName, {
                        type: 'Team',
                        id: `team_${teamName.replace(/\s+/g, '_')}`, // Virtual ID
                        name: teamName,
                        sportName: g.sportName,
                        leagueName: g.leagueName // Just for scoring context
                    });
                }
            }
        });
    });

    results.push(...distinctTeams.values());

    // --- Relevance Scoring ---
    const penaltyKeywords = ["women", "femmes", "u19", "u21", "u23", "reserve", "youth", "esports", "cyber", "simulated", "rl", "2x4", "liga pro", " srl"];
    const majorLeagues = ["champions league", "ligue 1", "premier league", "laliga", "serie a", "bundesliga", "nba", "nhl", "euroleague"];
    const userAskedForSecondary = penaltyKeywords.some(k => lowerQuery.includes(k));

    results = results.map(item => {
        let score = 0;
        const lowerName = item.name.toLowerCase();
        const lowerLeague = (item.leagueName || "").toLowerCase();

        // 1. Match Quality
        if (lowerName === lowerQuery) score += 100;
        else if (lowerName.startsWith(lowerQuery)) score += 50;
        else if (lowerName.includes(lowerQuery)) score += 20;

        // 2. Penalties (The "Real Team" heuristic)
        // If the item (team names or league) contains "Women" but the user didn't type "Women", penalize it.
        const isSecondary = penaltyKeywords.some(k => lowerName.includes(k) || lowerLeague.includes(k));

        if (isSecondary && !userAskedForSecondary) {
            score -= 50;
        }

        // 3. League Boost (Prioritize top-tier events)
        if (majorLeagues.some(l => lowerLeague.includes(l))) {
            score += 25;
        }

        // 4. Time Boost (Slight boost for recent/upcoming vs far future)
        // (Optional, keeping it simple for now)

        return { ...item, _score: score };
    });

    // Sort by score descending
    results.sort((a, b) => b._score - a._score);

    return results;
};
