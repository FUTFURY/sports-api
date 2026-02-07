
// using global fetch
// Script to find SignalR endpoint URL in the bundle

async function findMethodsRefined() {
    const baseUrl = "https://sa.1xbet.com/zone-static/getZone/xzone/v2/assets";
    const mainJs = "index-B89oW5A2.js";
    const url = `${baseUrl}/${mainJs}`;

    const headers = {
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36"
    };

    try {
        const resp = await fetch(url, { headers });
        if (!resp.ok) return;
        const text = await resp.text();

        // Regex to capture arguments to .invoke(...) and .on(...)
        // allowing for more whitespace or different quoting
        const invokeRegex = /\.invoke\(\s*["']([^"']+)["']/g;
        const onRegex = /\.on\(\s*["']([^"']+)["']/g;
        // Also .off(...)
        const offRegex = /\.off\(\s*["']([^"']+)["']/g;

        const methods = new Set();
        let match;
        while ((match = invokeRegex.exec(text)) !== null) methods.add("INVOKE: " + match[1]);
        while ((match = onRegex.exec(text)) !== null) methods.add("ON: " + match[1]);
        while ((match = offRegex.exec(text)) !== null) methods.add("OFF: " + match[1]);

        console.log("--- SignalR Methods Found ---");
        if (methods.size > 0) {
            Array.from(methods).forEach(m => console.log(m));
        } else {
            console.log("No explicit string literals found. Dumping context around 'invoke' and 'on'...");
            const kws = [".invoke(", ".on(", ".off("];
            kws.forEach(kw => {
                let pos = 0;
                while (true) {
                    const idx = text.indexOf(kw, pos);
                    if (idx === -1) break;
                    console.log(`\nContext for '${kw}':`);
                    console.log(text.substring(idx, idx + 100)); // Print 100 chars after
                    pos = idx + 1;
                }
            });
        }

    } catch (e) { console.error(e); }
}

findMethodsRefined();
