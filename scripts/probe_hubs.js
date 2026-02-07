
// using global fetch
// Script to probe candidate SignalR Hub URLs

async function probeHubs() {
    const candidates = [
        "https://new.maxizone.win/playerzone",
        "https://maxizone.win/playerzone",
        "https://sa.1xbet.com/zone-static/playerzone" // Just in case it's relative
    ];

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
        "accept": "application/json",
        "origin": "https://sa.1xbet.com",
        "referer": "https://sa.1xbet.com/"
    };

    for (let base of candidates) {
        // Try negotiate endpoint
        // SignalR Core: POST /negotiate
        // ASP.NET SignalR: GET /negotiate

        const negotiateUrl = `${base}/negotiate?negotiateVersion=1`;
        console.log(`\nProbing ${negotiateUrl} (POST)...`);

        try {
            const resp = await fetch(negotiateUrl, { method: 'POST', headers });
            console.log(`Status: ${resp.status}`);
            if (resp.ok) {
                const text = await resp.text();
                console.log("SUCCESS! Response:", text);
            } else {
                console.log("Failed POST. Trying GET...");
                const respGet = await fetch(negotiateUrl, { method: 'GET', headers });
                console.log(`GET Status: ${respGet.status}`);
                if (respGet.ok) console.log("SUCCESS GET!", await respGet.text());
                else console.log(await respGet.text());
            }

        } catch (e) { console.error(`Error probing ${base}:`, e.message); }
    }
}

probeHubs();
