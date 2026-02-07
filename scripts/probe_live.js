
// using global fetch
// Script to probe 1xBet Live Feed endpoints

async function probeLive() {
    const baseUrl = "https://sa.1xbet.com/LiveFeed";
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "Referer": "https://sa.1xbet.com/fr/live/football"
    };

    // Candidates
    const candidates = [
        // Standard "Top Live" or "All Live"
        `${baseUrl}/Get1x2_VZip?sports=1&count=20&lng=fr&mode=4&country=1`,
        `${baseUrl}/BestGamesZip?sports=1&lng=fr&count=20`,
        `${baseUrl}/GetGamesZip?sports=1&lng=fr&count=20`
    ];

    for (let url of candidates) {
        console.log(`Fetching ${url}...`);
        try {
            const resp = await fetch(url, { headers });
            if (resp.ok) {
                console.log(`SUCCESS: ${resp.status}`);
                const json = await resp.json();

                // Inspect structure
                const firstGame = (json.Value || [])[0];
                if (firstGame) {
                    console.log("First Game Found:");
                    console.log("ID:", firstGame.I);
                    console.log("Team 1:", firstGame.O1);
                    console.log("Team 2:", firstGame.O2);
                    console.log("League:", firstGame.L);
                    console.log("Score:", firstGame.SC?.FS?.S1 + ":" + firstGame.SC?.FS?.S2);
                    // Check if it has Video or Zone info
                    // VA: Video Available? typically 1 if yes
                    console.log("Video Available (VA):", firstGame.VA);
                } else {
                    console.log("Response OK but Value is empty or malformed.");
                    console.log("Keys:", Object.keys(json));
                }
            } else {
                console.log(`FAILED: ${resp.status}`);
            }
        } catch (e) { console.error("Error", e.message); }
    }
}

probeLive();
