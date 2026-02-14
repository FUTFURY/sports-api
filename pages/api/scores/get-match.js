// Get single match data by ID
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ2trZG5peHF4aXZ0dXVob2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTgyOTgzOSwiZXhwIjoyMDUxNDA1ODM5fQ.x_5Ia2o1LjbP0jbN8PaVQbEQI-ggLcPDShCJIgqN3DY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function getMatch(req, res) {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ error: 'Match ID required' });
    }

    try {
        // 1. Try to get from markets table first
        const { data: marketData } = await supabase
            .from('markets')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (marketData) {
            return res.json(marketData);
        }

        // 2. If not in markets, fetch from live matches
        const liveResponse = await fetch('http://localhost:3001/api/matches/live');

        if (!liveResponse.ok) {
            throw new Error('Failed to fetch live matches');
        }

        const liveData = await liveResponse.json();
        const match = liveData.matches?.find(m => m.id.toString() === id.toString());

        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Return match data with default pivot price
        const result = {
            id: match.id,
            p1_name: match.p1,
            p2_name: match.p2,
            league: match.league,
            score: match.score,
            pivot_price: 50, // Default 50-50
            status: 'ACTIVE',
            has_odds: match.hasOdds
        };

        return res.json(result);

    } catch (error) {
        console.error('Error fetching match:', error);
        return res.status(500).json({ error: error.message });
    }
}
