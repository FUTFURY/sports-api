import fetch from 'node-fetch';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_SERVICE_URL = 'http://localhost:3000/api/scores';
const POLL_INTERVAL = 10000;

// Track running bots: matchId -> process
const runningBots = new Map();

async function getLiveMatches() {
    try {
        const res = await fetch(`${DATA_SERVICE_URL}/matches-live`);
        if (!res.ok) throw new Error('Data Service unreachable');
        const data = await res.json();
        return data.matches || [];
    } catch (e) {
        console.error('Failed to get live matches:', e.message);
        return [];
    }
}

function startBot(matchId) {
    if (runningBots.has(matchId)) return;

    console.log(`🚀 Starting bot for match ${matchId}...`);

    const scriptPath = path.join(__dirname, 'engine.js');
    const child = spawn('node', [scriptPath, matchId], {
        stdio: 'inherit' // Pipe logs to main console
    });

    runningBots.set(matchId, child);

    child.on('close', (code) => {
        console.log(`🤖 Bot ${matchId} exited with code ${code}`);
        runningBots.delete(matchId);
    });
}

function stopBot(matchId) {
    const child = runningBots.get(matchId);
    if (child) {
        console.log(`🛑 Stopping bot ${matchId}...`);
        child.kill();
        runningBots.delete(matchId);
    }
}

async function run() {
    console.log('🤖 BOT MANAGER STARTED');

    const loop = async () => {
        const matches = await getLiveMatches();
        const activeIds = new Set(matches.map(m => m.id.toString()));

        // Start new bots
        for (const m of matches) {
            // Simple filter: Only start bots for matches with odds? Or all?
            // Let's start for all live matches for now to be safe.
            startBot(m.id.toString());
        }

        // Stop bots for finished matches
        for (const [id, proc] of runningBots) {
            if (!activeIds.has(id)) {
                // stopBot(id); // Optional: Keep running until manual stop? 
                // Better to stop if match is gone from live feed.
                console.log(`Match ${id} no longer live. Stopping bot.`);
                stopBot(id);
            }
        }

        setTimeout(loop, POLL_INTERVAL);
    };

    loop();
}

run();
