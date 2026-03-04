import { gotScraping } from 'got-scraping';

async function findApiRoot() {
    try {
        const res = await gotScraping.get('https://1xbet.com/en/results/');
        const html = res.body;

        const scripts = [...html.matchAll(/src="([^"]+\.js[^"]*)"/g)].map(m => m[1]);
        console.log(`Found ${scripts.length} scripts in HTML`);

        for (const scriptUrl of scripts) {
            if (scriptUrl.includes('metrika')) continue;
            let fullUrl = scriptUrl;
            if (fullUrl.startsWith('/')) fullUrl = 'https://1xbet.com' + fullUrl;

            try {
                const jsRes = await gotScraping.get(fullUrl);
                const js = jsRes.body;
                if (js.includes('bff-api/results') || js.includes('champId=')) {
                    console.log(`\nFound something in ${fullUrl}!`);
                    const matches = js.match(/(?:(?:https?:\/\/[^/]+)?\/+)?(?:[a-zA-Z0-9_-]+\/)*bff-api(?:[a-zA-Z0-9_/-]*)/g);
                    if (matches) {
                        const unique = [...new Set(matches)];
                        console.log("Matches:", unique);
                    }
                }
            } catch (e) { }
        }
    } catch (e) {
        console.log("Err:", e.message);
    }
}
findApiRoot();
