
// using global fetch
// Script to probe 1xBet API for video details

async function probeVideo() {
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

    // 1. First, search for a live game with video
    console.log("Searching for live game with video...");
    const searchParams = new URLSearchParams({
        text: "football",
        limit: "50", // Fetch enough to find one with video
        gr: "1208", // Not sure what this is, but copying from working request
        lng: "fr",
        country: "158",
        mode: "4"
    });

    let gameId = null;
    let videoId = null;

    try {
        const searchResp = await fetch(`${baseUrl}/Web_SearchZip?${searchParams.toString()}`, { headers });
        if (!searchResp.ok) throw new Error(`Search failed: ${searchResp.status}`);
        const searchData = await searchResp.json();

        const items = searchData.Value || [];
        const videoItem = items.find(item => item.VA === 1 && item.VI);

        if (videoItem) {
            console.log("Found game with video:", videoItem.O1, "vs", videoItem.O2);
            console.log("Game ID:", videoItem.I);
            console.log("Video ID (VI):", videoItem.VI);
            gameId = videoItem.I;
            videoId = videoItem.VI;
            const isLive = videoItem.SC && videoItem.SC.CPS !== "Début dans";
            console.log("Is Live:", isLive);

            // Try guessing m3u8 URLs
            const streamId = videoId.split('_').pop();
            const schemes = [
                `https://video.1xbet.com/video/${streamId}/playlist.m3u8`,
                `https://video.1xbet.com/video/${videoId}/playlist.m3u8`,
                `https://live.1xbet.com/video/${streamId}/playlist.m3u8`,
                `https://sc.1xbet.com/video/${streamId}/playlist.m3u8`,
                `https://ns.1xbet.com/video/${streamId}/playlist.m3u8`
            ];

            console.log("\nProbing Stream URLs...");
            for (let url of schemes) {
                try {
                    console.log(`Trying ${url}...`);
                    const resp = await fetch(url, { method: 'HEAD' }); // HEAD request
                    console.log(`Status: ${resp.status}`);
                    if (resp.status === 200) console.log("SUCCESS! Found stream:", url);
                } catch (e) { console.log("Error:", e.message); }
            }

        } else {
            console.log("No game with video found in search results.");
            // Default to a known ID if search fails? No, better to stop.
            return;
        }
    } catch (e) {
        console.error("Search error:", e);
        return;
    }

    // 2. Try fetching detailed game info
    if (gameId) {
        console.log(`\nProbing GetGameZip for ID: ${gameId}...`);
        const gameParams = new URLSearchParams({
            id: gameId,
            lng: "fr",
            isSubGames: "true",
            GroupEvents: "true",
            allEventsGroupSubGames: "true",
            countevents: "250",
            partner: "158",
            marketType: "1"
        });

        try {
            const gameResp = await fetch(`${baseUrl}/GetGameZip?${gameParams.toString()}`, { headers });
            if (gameResp.ok) {
                const gameData = await gameResp.json();
                console.log("GetGameZip Response received.");
                // Log relevant fields
                const val = gameData.Value;
                if (val) {
                    console.log("GetGameZip Value Keys:", Object.keys(val));

                    // Recursive search for the integer part of VI
                    const viInt = videoId.split('_').pop();
                    console.log(`Searching for ${viInt} in GetGameZip response...`);

                    function deepSearch(obj, target) {
                        if (obj === target) return true;
                        if (typeof obj === 'object' && obj !== null) {
                            for (let key in obj) {
                                if (deepSearch(obj[key], target)) {
                                    console.log(`Found ${target} at key: ${key}`);
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                    if (!deepSearch(gameData, parseInt(viInt)) && !deepSearch(gameData, viInt)) {
                        console.log("Video ID parts not found in detailed response.");
                    }

                    // Try PROBING with the VI directly
                    console.log(`\nProbing GetVideo for VI: ${videoId}...`);
                    try {
                        // Guess 1: id=VI
                        let resp = await fetch(`${baseUrl}/GetVideo?id=${videoId}&lng=fr`, { headers });
                        if (resp.ok) console.log("GetVideo?id=VI success:", await resp.status);
                        else console.log("GetVideo?id=VI failed:", resp.status);

                        // Guess 2: id=GameID&video=VI
                        resp = await fetch(`${baseUrl}/GetVideo?id=${gameId}&video=${videoId}&lng=fr`, { headers });
                        if (resp.ok) console.log("GetVideo?id=G&video=VI success:", await resp.status);
                        else console.log("GetVideo?id=G&video=VI failed:", resp.status);

                    } catch (e) { console.error("Probe error", e); }

                } else {
                    console.log("No Value in response", gameData);
                }
            } else {
                console.log("GetGameZip failed:", gameResp.status);
            }
        } catch (e) {
            console.error("GetGameZip error:", e);
        }
    }
}

probeVideo();
