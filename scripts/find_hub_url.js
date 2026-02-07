
// using global fetch
// Script to find SignalR endpoint URL in the bundle

async function findSignalRUrl() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets";
    const mainJs = "index-B89oW5A2.js"; // Based on previous finding
    const url = `${baseUrl}/${mainJs}`;

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    console.log(`Fetching ${url} to extract Hub URL...`);
    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) { console.log("Failed"); return; }
        const text = await resp.text();

        // Strategy: Look for HubConnectionBuilder usage patterns
        // Often: .withUrl("URL") or .withUrl(VARIABLE)

        // 1. Find .withUrl(
        let pos = 0;
        while (true) {
            const idx = text.indexOf(".withUrl(", pos);
            if (idx === -1) break;

            // Extract the argument
            const start = idx + 9;
            const end = text.indexOf(")", start);
            const arg = text.substring(start, end);
            console.log(`Found .withUrl argument: ${arg}`);

            // If it's a variable, try to find where it's defined nearby?
            // Usually minified code is like: e.withUrl(t+"...")

            pos = end;
        }

        // 2. Look for hardcoded signalr paths
        const commonPaths = ["/videohstream", "/zstream", "/live-feed", "/games"];
        commonPaths.forEach(p => {
            if (text.includes(p)) console.log(`Found common path literal: ${p}`);
        });

        // 3. Look for string concatenation involving valid protocols
        // "wss://" or "https://"
        const protoMatches = text.match(/["'](wss?|https?):\/\/[^"']*["']/g);
        if (protoMatches) {
            console.log("\nProtocol Strings:");
            protoMatches.forEach(m => console.log(m));
        }

    } catch (e) { console.error(e); }
}

findSignalRUrl();
