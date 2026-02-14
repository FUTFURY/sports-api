import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Main route: Get Live Matches
app.get('/matches/live', async (req, res) => {
    try {
        console.log('Fetching live matches from 1xbet...');
        // Using the same reversed logic as before, but cleaner
        const url = 'https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&count=50&lng=fr&mode=4&country=1&partner=159&getEmpty=true&noFilterBlockEvent=true';

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            },
            timeout: 5000
        });

        if (!response.ok) {
            throw new Error(`1xbet responded with ${response.status}`);
        }

        const data = await response.json();
        const matches = (data.Value || []).map(m => ({
            id: m.I,
            p1: m.O1,
            p2: m.O2,
            league: m.L,
            score: m.SC?.FS?.S1 + '-' + m.SC?.FS?.S2 || '0-0',
            hasOdds: !!m.E, // Check if odds exist
            startTime: new Date(m.S * 1000).toISOString()
        }));

        res.json({ count: matches.length, matches });
    } catch (error) {
        console.error('Error fetching matches:', error.message);
        res.status(500).json({ error: 'Failed to fetch matches', details: error.message });
    }
});

// Route for single match details (by ID)
app.get('/match/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Reuse the live feed logic for now since 1xbet doesn't have a reliable single-match endpoint without knowing the game hash
        const url = 'https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=4&count=50&lng=fr&mode=4&country=1&partner=159&getEmpty=true&noFilterBlockEvent=true';

        const response = await fetch(url);
        const data = await response.json();

        const rawMatch = (data.Value || []).find(m => m.I == id);

        if (!rawMatch) {
            return res.status(404).json({ error: 'Match not found' });
        }

        // Return rich object for Bot consumption
        const match = {
            id: rawMatch.I,
            p1_name: rawMatch.O1,
            p2_name: rawMatch.O2,
            league: rawMatch.L,
            score: rawMatch.SC?.FS?.S1 + '-' + rawMatch.SC?.FS?.S2 || '0-0',
            status: 'ACTIVE',
            has_odds: !!rawMatch.E,
            // Raw data needed for Bot Math
            raw_sc: rawMatch.SC,
            raw_e: rawMatch.E
        };

        res.json(match);
    } catch (error) {
        console.error('Error fetching single match:', error);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ DATA SERVICE running on http://localhost:${PORT}`);
});
