import express from 'express';
import cors from 'cors';
import getSports from './get-sports.js';
import getLeagues from './get-leagues.js';
import getGames from './get-games.js';
import getLiveGames from './get-live-games.js';
import getGameStats from './get-game-stats.js';
import search from './search.js';
import getStandings from './get-standings.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Helper to adapt Vercel-like handlers (req, res) to Express
const adapt = (handler) => async (req, res) => {
    // Vercel/Next handlers often use res.json() which Express supports,
    // but sometimes they use res.status().json() chaining.
    // Express supports this out of the box.
    try {
        await handler(req, res);
    } catch (err) {
        console.error("API Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

app.get('/api/get-sports', adapt(getSports));
app.get('/api/get-leagues', adapt(getLeagues));
app.get('/api/get-games', adapt(getGames));
app.get('/api/get-live-games', adapt(getLiveGames));
app.get('/api/get-game-stats', adapt(getGameStats));
app.get('/api/search', adapt(search));
app.get('/api/get-standings', adapt(getStandings));

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
