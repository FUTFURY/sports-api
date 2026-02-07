
// using global fetch
async function analyzeBundle() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets";
    const mainJs = "index-B89oW5A2.js";
    const url = `${baseUrl}/${mainJs}`;

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    console.log(`Fetching ${url}...`);
    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
            console.log("Failed to fetch bundle:", resp.status);
            return;
        }

        const text = await resp.text();
        console.log("Bundle Size:", text.length);

        // 1. Search for TriangleAttack hash
        // Vite usually does: "TriangleAttack-" + "hash" + ".js" or similar in imports
        // Look for string literals containing "TriangleAttack"
        const triangleRegex = /TriangleAttack-[a-zA-Z0-9]+/g;
        const matches = text.match(triangleRegex);
        if (matches) {
            console.log("Found TriangleAttack chunks:", [...new Set(matches)]);
        } else {
            console.log("No explicit TriangleAttack filenames found in bundle (might be dynamic import with variable).");
            // Look for "TriangleAttack" literally
            const idx = text.indexOf("TriangleAttack");
            if (idx !== -1) {
                console.log("Found 'TriangleAttack' at index", idx);
                console.log("Context:", text.substring(idx - 50, idx + 50));
            }
        }

        // 2. Search for WebSocket or API keywords
        const keywords = ["hub", "/signalr", "HubConnection", ".build()", ".start()", "invoke", "on("];
        console.log("\n--- Connection Keywords ---");
        keywords.forEach(k => {
            if (text.includes(k)) {
                console.log(`Found '${k}'`);
                // Print one context example
                const idx = text.indexOf(k);
                console.log(`...${text.substring(idx - 30, idx + 80)}...`);
            }
        });

    } catch (e) { console.error("Error", e); }
}

analyzeBundle();
