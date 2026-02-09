
// Mock request/response for local testing of the handler
import handler from '../api/get-game-stats.js';

const req = {
    method: 'GET',
    query: {
        id: '694233938', // The ID we found earlier in the probe
        lng: 'fr'
    }
};

const res = {
    setHeader: (k, v) => console.log(`[Header] ${k}: ${v}`),
    status: (code) => ({
        json: (data) => console.log(`[${code}]`, JSON.stringify(data, null, 2).substring(0, 1000)),
        end: () => console.log(`[${code}] End`)
    })
};

// Mock process.env
process.env.ONEXBET_COOKIE = "";
process.env.ONEXBET_X_HD = "";

console.log("Testing get-game-stats.js...");
handler(req, res);
