// API Route: /api/match/:id
// Returns data for a single match by ID

import { createClient } from '@supabase/supabase-js';
import { getLiveMatches } from '@/lib/1xbet';

const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ2trZG5peHF4aXZ0dXVob2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTgyOTgzOSwiZXhwIjoyMDUxNDA1ODM5fQ.x_5Ia2o1LjbP0jbN8PaVQbEQI-ggLcPDShCJIgqN3DY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {


    const id = req.params?.id || req.query?.id;

    if (!id) {
        return res.status(400).json({ error: 'Match ID required' });
    }

    try {
        // 1. Try to get from markets table first
        const { data: marketData, error: marketError } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (marketData) {
            return res.json(marketData);
        }

        // 2. If not in markets, fetch from live matches
        // Fix: Use internal lib
        const matches = await getLiveMatches();
        let match = matches.find(m => m.id.toString() === id.toString());

        // FALLBACK: If not in the list, try fetching single match directly from source
        if (!match) {
            // console.log(`Match ${id} not found in list, trying direct fetch...`);
            const singleMatchUrl = `https://sa.1xbet.com/service-api/LiveFeed/GetGameZip?id=${id}&lng=fr&isSubGames=true&grouped=true`;
            try {
                const smRes = await fetch(singleMatchUrl, {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
                        "Referer": "https://sa.1xbet.com/fr/live/tennis",
                        "Cookie": process.env.ONEXBET_COOKIE || "",
                        "x-hd": process.env.ONEXBET_X_HD || ""
                    }
                });

                if (smRes.ok) {
                    const smData = await smRes.json();
                    if (smData.Value && smData.Value.I) {
                        const m = smData.Value;

                        // Safe extraction of score components
                        let sets_p1 = m.SC?.FS?.S1 || 0;
                        let sets_p2 = m.SC?.FS?.S2 || 0;

                        let games_p1 = 0;
                        let games_p2 = 0;

                        // Games: Last element of PS (Period Scores)
                        if (m.SC?.PS && Array.isArray(m.SC.PS) && m.SC.PS.length > 0) {
                            const lastPoint = m.SC.PS[m.SC.PS.length - 1]; // Latest set games
                            if (lastPoint?.Value) {
                                games_p1 = lastPoint.Value.S1;
                                games_p2 = lastPoint.Value.S2;
                            }
                        }

                        let points_p1 = m.SC?.S1 ?? m.SC?.QP?.S1 ?? 0;
                        let points_p2 = m.SC?.S2 ?? m.SC?.QP?.S2 ?? 0;

                        match = {
                            id: m.I,
                            p1: m.O1,
                            p2: m.O2,
                            league: m.L,
                            score: `${sets_p1}-${sets_p2}`,
                            sets_p1, sets_p2,
                            games_p1, games_p2,
                            points_p1, points_p2,
                            hasOdds: true, // Assume active if we can fetch it
                            startTime: m.S ? new Date(m.S * 1000).toISOString() : null
                        };
                    }
                }
            } catch (e) {
                console.error("Fallback fetch failed:", e);
            }
        }

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Enrich match with pivot_price from markets if exists
        const { data: enrichedData } = await supabase
            .from('markets')
            .select('pivot_price')
            .eq('id', id)
            .maybeSingle();

        const result = {
            id: match.id,
            p1_name: match.p1,
            p2_name: match.p2,
            league: match.league,
            score: match.score,
            points_p1: match.points_p1 || 0,
            points_p2: match.points_p2 || 0,
            games_p1: match.games_p1 || 0,
            games_p2: match.games_p2 || 0,

            // Add Sets and Period Scores
            sets_p1: match.SC?.FS?.S1 ?? match.sets_p1 ?? 0,
            sets_p2: match.SC?.FS?.S2 ?? match.sets_p2 ?? 0,
            period_scores: match.SC?.PS?.map(p => ({
                s1: p.Value?.S1,
                s2: p.Value?.S2
            })) ?? match.period_scores ?? [],

            pivot_price: enrichedData?.pivot_price || 50, // Default 50 if no market data
            status: 'ACTIVE',
            has_odds: match.hasOdds
        };

        return res.json(result);

    } catch (error) {
        console.error('Error fetching match:', error);
        return res.status(500).json({ error: error.message });
    }
};
