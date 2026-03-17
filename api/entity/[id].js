import { withCors } from '../../utils/cors.js';
import { VERSION } from '../../utils/version.js';
import { fetchWithRotation } from '../../services/robustSearchService.js';
import { gotScraping } from 'got-scraping';

const EVENTSSTAT_MIRRORS = [
    'https://eventsstat.com',
    'https://1xstavka.ru'
];

async function fetchEntityStat(path, lang = 'en') {
    const partners = ['1', '368'];
    for (const mirror of EVENTSSTAT_MIRRORS) {
        for (const p of partners) {
            try {
                // Force language in path if necessary (SiteService endpoints often use ln=)
                let finalPath = path.replace(/partner=[^&]+/, `partner=${p}`);
                if (lang) {
                    finalPath = finalPath.replace(/ln=[^&]+/, `ln=${lang}`).replace(/lng=[^&]+/, `lng=${lang}`);
                }
                const url = `${mirror}${finalPath}`;

                const res = await gotScraping.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Referer': `${mirror}/en/statistic/`,
                        'Accept': 'application/json'
                    },
                    responseType: 'text',
                    timeout: { request: 4000 } // Shorter timeout to try other mirrors/partners quickly
                });

                if (res.body && (res.body.trim().startsWith('{') || res.body.trim().startsWith('['))) {
                    const parsed = JSON.parse(res.body);
                    if (parsed) return parsed;
                }
            } catch (e) {
                console.error(`[fetchEntityStat] mirror ${mirror} partner ${p} failed:`, e.message);
            }
        }
    }
    return null;
}

const handler = async (req, res) => {
    const { id, type, lang, lng, tz } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Entity ID required' });
    }

    const entityType = type || 'team';
    const finalLang = lang || lng || 'fr'; // Défaut sur Français
    const finalTz = tz || '1';

    try {
        let result = null;

        if (entityType === 'team') {
            const path = `/en/services-api/SiteService/TeamDetailed?teamId=${id}&ln=${finalLang}&partner=1&geo=158`;
            const raw = await fetchEntityStat(path, finalLang);

            if (raw) {
                const team = raw.T || {};
                const stadium = raw.HS || {};
                const country = raw.C || {};

                const achievements = Array.isArray(raw.TA) ? raw.TA.map(a => ({
                    title: a.T,
                    year: a.Y,
                    type: a.TT
                })) : [];

                const tournaments = Array.isArray(raw.TI) ? raw.TI.map(t => ({
                    id: t.I,
                    name: t.T,
                    season: t.SE
                })) : [];

                const recentResults = Array.isArray(raw.R) ? raw.R.slice(0, 10).map(r => ({
                    id: r.I,
                    homeTeam: r.O1 || r.H?.T || 'Unknown',
                    awayTeam: r.O2 || r.A?.T || 'Unknown',
                    homeScore: parseInt(r.S1) || 0,
                    awayScore: parseInt(r.S2) || 0,
                    date: r.T || r.D,
                    phase: r.P,
                    isHome: r.H === '1',
                    winner: r.W
                })) : [];

                const upcomingMatches = Array.isArray(raw.F) ? raw.F.slice(0, 5).map(f => ({
                    id: f.I,
                    homeTeam: f.O1 || f.H?.T || 'Unknown',
                    awayTeam: f.O2 || f.A?.T || 'Unknown',
                    date: f.T || f.D,
                    tournament: f.L
                })) : [];

                // Extract Roster (TR)
                const roster = Array.isArray(raw.TR) ? raw.TR.map(member => ({
                    id: member.P?.I,
                    name: member.P?.N || member.P?.S,
                    image: member.P?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${member.P.M}` : null,
                    position: member.P?.PS || null,
                    country: member.P?.C?.T || null
                })) : [];

                result = {
                    id: team.I || id,
                    name: team.T || team.S?.[0]?.T || 'Unknown',
                    image: team.M ? `https://sa.1xbet.com/sfiles/logo_teams/${team.M}` : null,
                    countryId: country.I,
                    countryName: country.T,
                    countryImage: country.M ? `https://sa.1xbet.com${country.IM}` : null,
                    sportId: parseInt(team.SI || 1),
                    type: 'team',
                    stadium: stadium.T ? {
                        name: stadium.T,
                        city: stadium.G?.T || '',
                        capacity: parseInt(stadium.C) || null,
                        address: stadium.A || null,
                        website: stadium.W || null,
                        images: (stadium.IM || []).map(img => `https://sa.1xbet.com/sfiles/stadiums/${img}`)
                    } : null,
                    achievements,
                    tournaments,
                    recentResults,
                    upcomingMatches,
                    roster
                };
            }
        } else if (entityType === 'athlete' || entityType === 'player') {
            const path = `/en/services-api/SiteService/PlayerDetailed?playerId=${id}&ln=${finalLang}&partner=1&geo=158`;
            const raw = await fetchEntityStat(path, finalLang);

            if (raw) {
                // For non-tennis athletes, info is often in raw.P, for tennis it might be root
                const player = raw.P || raw || {};
                const country = player.C || raw.C || {};

                const stats = Array.isArray(raw.S) ? raw.S.map(s => ({
                    label: s.T || s.N,
                    value: s.V,
                    tournament: s.TN
                })) : [];

                const career = Array.isArray(raw.CH) ? raw.CH.map(c => ({
                    team: c.T || c.N,
                    teamId: c.I,
                    period: c.Y,
                    goals: c.G,
                    apps: c.M
                })) : [];

                // Use G (Games) if available for recent results, or R
                const rawRecent = Array.isArray(raw.R) ? raw.R : (Array.isArray(raw.G) ? raw.G : []);

                result = {
                    id: player.I || id,
                    name: player.N || player.S || player.T || 'Unknown',
                    image: player.M ? `https://sa.1xbet.com/sfiles/logo_teams/${player.M}` : null,
                    countryId: country.I,
                    countryName: country.T,
                    countryImage: country.M ? `https://sa.1xbet.com${country.IM}` : null,
                    sportId: parseInt(player.SI || raw.SI || 4),
                    type: 'player',
                    stats,
                    career,
                    recentResults: rawRecent.slice(0, 10).map(r => ({
                        id: r.I,
                        homeTeam: r.O1 || r.H?.T || 'Unknown',
                        awayTeam: r.O2 || r.A?.T || 'Unknown',
                        homeScore: parseInt(r.S1) || 0,
                        awayScore: parseInt(r.S2) || 0,
                        date: r.T || r.D,
                        winner: r.W
                    })),
                    upcomingMatches: Array.isArray(raw.F) ? raw.F.slice(0, 5).map(f => ({
                        id: f.I,
                        homeTeam: f.O1 || f.H?.T,
                        awayTeam: f.O2 || f.A?.T,
                        date: f.T || f.D,
                        tournament: f.L
                    })) : []
                };
            }
        } else if (entityType === 'league') {
            const sportIdParam = req.query.sportId || '1'; // Default to football si non spécifié
            const path = `/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=${sportIdParam}&ln=${finalLang}&partner=1&geo=158`;

            console.log(`[entity] Fetching league detail for ID ${id} with sportId ${sportIdParam} (lang: ${finalLang})`);
            const raw = await fetchEntityStat(path, finalLang);

            if (raw) {
                console.log(`[entity] League data received for ${id}`);
                const tourn = raw.T || {};
                // Le pays peut être à la racine ou niché dans le premier objet de S (Stages)
                const country = raw.C || (raw.S && raw.S[0] && raw.S[0].C) || {};

                // 1. CLASSEMENTS (Standings)
                let standingsGroups = [];
                if (raw.ST && raw.ST.length > 0 && raw.ST[0].TS) {
                    standingsGroups = raw.ST[0].TS;
                } else if (raw.ST) {
                    standingsGroups = raw.ST; // Fallback
                }

                const standings = standingsGroups.map(group => ({
                    name: group.T || 'Standings',
                    rows: (group.ST || []).map(row => ({
                        rank: parseInt(row.R) || parseInt(row.P) || 0,
                        teamId: row.T?.I || row.I || '',
                        teamName: row.T?.T || row.T?.N || row.N || 'Unknown',
                        teamImage: row.T?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${row.T.M}` : null,
                        games: parseInt(row.M) || parseInt(row.G) || 0,
                        wins: parseInt(row.W) || 0,
                        draws: parseInt(row.D) || 0,
                        losses: parseInt(row.L) || 0,
                        score: (row.F !== undefined && row.A !== undefined) ? `${row.F}-${row.A}` : (row.S || "0-0"),
                        points: parseInt(row.P) || parseInt(row.Pts) || 0
                    }))
                }));

                // 2. IMAGE DE LA LIGUE (Priorité au logo spécifique, puis au drapeau du pays)
                let leagueImage = null;
                if (tourn.IM) {
                    leagueImage = tourn.IM.startsWith('http') ? tourn.IM : `https://sa.1xbet.com${tourn.IM}`;
                } else if (country.IM) {
                    leagueImage = `https://sa.1xbet.com${country.IM}`;
                } else if (tourn.M) {
                    // Les IDs numériques (ex: 60230225.png) sont souvent des 404 en logo_ligas
                    // On tente quand même mais après les drapeaux
                    leagueImage = `https://sa.1xbet.com/sfiles/logo_ligas/${tourn.M}`;
                }

                // 3. SAISONS (Actuelle et Archives)
                const currentSeason = raw.G ? { id: raw.G.I, year: raw.G.T } : null;
                const availableSeasons = Array.isArray(raw.N) ? raw.N.map(s => ({ id: s.I, year: s.T })) : [];

                // 4. MATCHS RÉCENTS (avec logos et IDs)
                const rawRecent = raw.LG || raw.R || raw.LM || [];
                const recentResults = rawRecent.map(r => ({
                    id: r.I,
                    homeTeam: r.H?.T || r.O1 || 'Unknown',
                    homeTeamId: r.H?.I || null,
                    homeImage: r.H?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${r.H.M}` : null,
                    awayTeam: r.A?.T || r.O2 || 'Unknown',
                    awayTeamId: r.A?.I || null,
                    awayImage: r.A?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${r.A.M}` : null,
                    homeScore: parseInt(r.S1) || 0,
                    awayScore: parseInt(r.S2) || 0,
                    date: r.D || r.T,
                    winner: r.W,
                    status: r.St || r.P
                }));

                // 5. MATCHS À VENIR (avec logos et IDs)
                const rawUpcoming = raw.FG || raw.F || raw.NM || [];
                const upcomingMatches = rawUpcoming.map(f => ({
                    id: f.I,
                    homeTeam: f.H?.T || f.O1 || 'Unknown',
                    homeTeamId: f.H?.I || null,
                    homeImage: f.H?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${f.H.M}` : null,
                    awayTeam: f.A?.T || f.O2 || 'Unknown',
                    awayTeamId: f.A?.I || null,
                    awayImage: f.A?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${f.A.M}` : null,
                    date: f.D || f.T,
                    tournament: f.L || tourn.T
                }));

                // 6. ARBRE DU TOURNOI / PLAYOFFS (Clé S)
                const stages = [];
                if (Array.isArray(raw.S)) {
                    raw.S.forEach(stage => {
                        const categories = stage.A?.C || [];
                        stages.push({
                            id: stage.I,
                            name: stage.N || 'Main Stage', // ex: "USA. MLS"
                            categories: categories.map(cat => ({
                                name: cat.T || 'General', // ex: "Western Conference"
                                matchups: (cat.R || []).map(round => ({
                                    roundName: round.N, // ex: "Play-off: Round of 16"
                                    advancingTeamId: round.T?.I || null,
                                    advancingTeamName: round.T?.T || null,
                                    games: (round.G || []).map(game => ({
                                        id: game.I,
                                        date: game.D || game.T,
                                        homeTeam: game.H?.T || 'Unknown',
                                        homeTeamId: game.H?.I,
                                        homeImage: game.H?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${game.H.M}` : null,
                                        awayTeam: game.A?.T || 'Unknown',
                                        awayTeamId: game.A?.I,
                                        awayImage: game.A?.M ? `https://sa.1xbet.com/sfiles/logo_teams/${game.A.M}` : null,
                                        homeScore: parseInt(game.S1) || 0,
                                        awayScore: parseInt(game.S2) || 0,
                                        winner: game.W,
                                        status: game.St
                                    }))
                                }))
                            }))
                        });
                    });
                }

                // CONSTRUCTION DU RÉSULTAT FINAL
                result = {
                    id: tourn.I || id,
                    name: tourn.T || tourn.N || 'Unknown League',
                    type: 'league',
                    countryName: country.T || tourn.CN,
                    sportId: parseInt(tourn.SI || sportIdParam || 1),
                    image: leagueImage,
                    currentSeason,
                    availableSeasons,
                    standings,
                    recentResults,
                    upcomingMatches,
                    stages
                };
            }
        }

        if (!result) {
            result = { id, name: 'Unknown', type: entityType };
        }

        res.status(200).json({ success: true, version: VERSION, data: result });

    } catch (error) {
        console.error(`[entity/${id}] CRITICAL ERROR:`, error);
        res.status(200).json({
            success: false,
            version: VERSION,
            message: error.message,
            data: { id, name: 'Error', type: entityType }
        });
    }
};

export default withCors(handler);
