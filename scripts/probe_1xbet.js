
// fetch is global in modern Node.js
import fs from 'fs/promises';
import path from 'path';

async function probe() {
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/",
        "Cookie": process.env.ONEXBET_COOKIE || "",
        "x-hd": process.env.ONEXBET_X_HD || ""
    };

    try {
        // 1. Get a Live Game ID
        console.log("Fetching Live Games...");
        // Increase count to find a major game (likely to have stats)
        const liveUrl = "https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=1&count=20&lng=fr&mode=4";
        const liveRes = await fetch(liveUrl, { headers });
        const liveData = await liveRes.json();

        if (!liveData.Value || liveData.Value.length === 0) {
            console.log("No live games found to probe.");
            return;
        }

        // Ideally find a game with stats available
        const game = liveData.Value.find(g => g.SC) || liveData.Value[0];
        const gameId = game.I;
        console.log(`Probing Game ID: ${gameId} (${game.O1} vs ${game.O2})`);

        // 2. Probe Game Detail (GetGameZip)
        const detailUrl = `https://sa.1xbet.com/service-api/LiveFeed/GetGameZip?id=${gameId}&lng=fr&isSubGames=true&grouped=true`;
        console.log(`Fetching Detail: ${detailUrl}`);
        const detailRes = await fetch(detailUrl, { headers });
        const detailData = await detailRes.json();

        // 3. Save to File
        const cwd = process.cwd();
        const detailPath = path.resolve(cwd, 'probe_game_detail.json');
        await fs.writeFile(detailPath, JSON.stringify(detailData, null, 2));
        console.log(`✅ Game Details Saved to '${detailPath}'`);

        // 4. Probe League Table (GetChampZip) - New Strategy: `GetChamp`
        const leagueId = game.LI; // e.g. 88637
        console.log(`\nProbing League ID: ${leagueId} (${game.L})`);

        // Attempt different 'standings' endpoints
        // Endpoints gathered from various public GitHub repos analyzing 1xBet
        const endpoints = [
            `https://sa.1xbet.com/service-api/result/web/api/v1/Table/GetTable?champId=${leagueId}&lng=fr`,
            `https://sa.1xbet.com/LiveFeed/GetChampsZip?sport=1&lng=fr&tf=2200000&tz=3&country=1&partner=159&virtualSports=true`,
        ];

        for (const url of endpoints) {
            console.log(`Trying Table Endpoint: ${url}`);
            const res = await fetch(url, { headers });
            if (res.ok) {
                const txt = await res.text();
                // Validate if it's JSON
                try {
                    const json = JSON.parse(txt);
                    const tablePath = path.resolve(cwd, `probe_table_${leagueId}.json`);
                    await fs.writeFile(tablePath, JSON.stringify(json, null, 2));
                    console.log(`✅ Table Data Saved to '${tablePath}'`);
                } catch (e) {
                    console.log("⚠️ Response was not JSON.");
                }
            } else {
                console.log(`❌ Failed: ${res.status}`);
            }
        }

    } catch (e) {
        console.error("Probe Error:", e);
    }
}

probe();
