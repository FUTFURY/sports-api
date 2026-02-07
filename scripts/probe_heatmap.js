
// using global fetch
// Script to probe 1xBet API for Heatmap/1xZone data

async function probeHeatmap() {
    const baseUrl = "https://sa.1xbet.com/service-api/LiveFeed";
    const headers = {
        "accept": "application/json, text/plain, */*",
        "accept-encoding": "gzip, deflate",
        "accept-language": "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/fr/line/golf?platform_type=desktop",
        "sec-ch-ua": '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "x-app-n": "__BETTING_APP__",
        "x-hd": "Y6mGTs6B1g4AtkRvJ5Be2k3WHr/XZR3DVr7qjTCmnDyUOmmpamuvSt8iQX6u1p/p04KBwwlrk1mLq56gddtcOoktLfKXiTlS9rzc6Gh+7+daHhi2XZbqotG1rx4HaPaGJyGjJRWqc9HIQ+0xWMzShECiZR4PjWG1IqzyuSvJSF486tY0Vthq/p9WQvRWFAb4rdZs8b06bYbg1WEoyKRXbD+pc2fXvc9aQE4yRLQqYiIMupvscZw8TZIh6rOcNiHPG7UBx3HqBsNVMQOx8SkSR0cA4ZUpWadvVV1pN2BArvISx+MxwvQhXG1pwiH5JJemrNOUr0ph06RDFrFj/1FycC/TVsTGAycmg2+MO0KtD2rmQkzzW9st0QvfEuTM+VtOjOh2eKnVPYTs5CAyRSMVBaAAAUkYgREcTFnEmtjy8qLQ74az1se2VeUG3m+ZBWfu89gU93VMSSsnLFJtww8pawycozVlSqTdDIo2WdaOJ9G/MoisBEETn+MT1Vq2FR1lXoJ7RniE4YcxG2jcZU8olTwOf1XNokEwKQLtEnnHQN2zx9K77oIiMZUmWMZoKpStjT9PsqFPr5EF5tE+pmVeG2sG/MMTHbw=",
        "x-mobile-project-id": "0",
        "x-requested-with": "XMLHttpRequest",
        "x-svc-source": "__BETTING_APP__"
    };

    // 1. Search for a live football game (football usually has 1xZone)
    console.log("Searching for live football game...");
    const searchParams = new URLSearchParams({
        text: "football",
        limit: "10",
        gr: "1208",
        lng: "fr",
        country: "158",
        mode: "4"
    });

    let gameId = null;

    try {
        const searchResp = await fetch(`${baseUrl}/Web_SearchZip?${searchParams.toString()}`, { headers });
        if (!searchResp.ok) throw new Error(`Search failed: ${searchResp.status}`);
        const searchData = await searchResp.json();

        const items = searchData.Value || [];
        // Find a football game (Sport ID 1 usually) that is Live
        const game = items.find(item => item.SN === "Football" || item.SN === "Football " || item.KI === 1); // KI=1 often Football

        if (game) {
            console.log("Found football game:", game.O1, "vs", game.O2);
            console.log("Game ID:", game.I);
            gameId = game.I;
        } else {
            console.log("No football game found. Using first available.");
            if (items.length > 0) gameId = items[0].I;
        }

    } catch (e) {
        console.error("Search error:", e);
        return;
    }

    if (!gameId) return;

    // 2. Fetch Detailed Game Data
    console.log(`\nProbing GetGameZip for ID: ${gameId}...`);
    const gameParams = new URLSearchParams({
        id: gameId,
        lng: "fr",
        isSubGames: "true",
        GroupEvents: "true",
        allEventsGroupSubGames: "true",
        countevents: "250",
        partner: "158",
        marketType: "1",
        isNewZone: "true" // Guessing this param based on naming
    });

    try {
        const gameResp = await fetch(`${baseUrl}/GetGameZip?${gameParams.toString()}`, { headers });
        const gameData = await gameResp.json();
        const val = gameData.Value;

        if (val) {
            console.log("Keys in Value:", Object.keys(val));

            // Check for potential Zone/Heatmap keys
            const interestingKeys = ['GE', 'Z', 'ZONE', 'S', 'SC', '1xZone', 'stat', 'Stat'];
            interestingKeys.forEach(k => {
                if (val[k]) console.log(`Found interesting key '${k}':`, typeof val[k] === 'object' ? "Object/Array" : val[k]);
            });

            // Inspect SC (Score/Stats?)
            if (val.SC) {
                console.log("\nInspecting SC (Score/Stats):", JSON.stringify(val.SC, null, 2));
            }

            // Inspect GE (Game Events?)
            if (val.GE) {
                console.log("\nInspecting GE (Game Events):", JSON.stringify(val.GE, null, 2).substring(0, 500) + "...");
            }

            // 3. Probing Speculative Endpoints for Zone/Events
            const probes = [
                `${baseUrl}/GetGameEvents?id=${gameId}&lng=fr`,
                `${baseUrl}/Get1xZone?id=${gameId}&lng=fr`,
                `${baseUrl}/GetLiveInfo?id=${gameId}&lng=fr`,
                `${baseUrl}/GetMatchZone?id=${gameId}&lng=fr`
            ];

            console.log("\nProbing Speculative Endpoints...");
            for (let url of probes) {
                try {
                    console.log(`Trying ${url}...`);
                    const resp = await fetch(url, { headers });
                    if (resp.ok) {
                        console.log(`SUCCESS: ${url} returned ${resp.status}`);
                        const json = await resp.json();
                        console.log("Keys:", Object.keys(json));
                    } else {
                        console.log(`Failed: ${url} -> ${resp.status}`);
                    }
                } catch (e) { console.log(`Error probing ${url}: ${e.message}`); }
            }

        }
    } catch (e) { console.error("GetGameZip Error", e); }
}

probeHeatmap();
