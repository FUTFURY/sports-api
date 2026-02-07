
// using global fetch
// Script to find SignalR method names in the bundle

async function findMethods() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets";
    const mainJs = "index-B89oW5A2.js";
    const url = `${baseUrl}/${mainJs}`;

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    console.log(`Fetching ${url}...`);
    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) return;
        const text = await resp.text();

        // Look for .invoke("MethodName", ...)
        // Regex: .invoke\(["']([^"']+)["']

        const invokeRegex = /\.invoke\(\s*["']([^"']+)["']/g;
        let match;
        const methods = new Set();

        while ((match = invokeRegex.exec(text)) !== null) {
            methods.add(match[1]);
        }

        console.log("Invoked Methods:");
        Array.from(methods).forEach(m => console.log(`- ${m}`));

        // Look for .on("MethodName", ...) (Server to Client messages)
        const onRegex = /\.on\(\s*["']([^"']+)["']/g;
        const events = new Set();

        while ((match = onRegex.exec(text)) !== null) {
            events.add(match[1]);
        }

        console.log("\nListened Events (Server -> Client):");
        Array.from(events).forEach(e => console.log(`- ${e}`));

    } catch (e) { console.error(e); }
}

findMethods();
