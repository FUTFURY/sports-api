import puppeteer from 'puppeteer';

(async () => {
    console.log('Ouverture du navigateur automatisé en mode visible...');
    // headless: false so the user can see it and solve captcha if needed
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized']
    });
    const page = await browser.newPage();

    console.log('Écoute des requêtes API en cours...');
    page.on('request', request => {
        const url = request.url();
        if (url.toLowerCase().includes('result') || url.toLowerCase().includes('eventsstat') || url.toLowerCase().includes('livefeed') || url.toLowerCase().includes('linefeed')) {
            if (request.resourceType() === 'xhr' || request.resourceType() === 'fetch') {
                console.log(`\n========================================`);
                console.log(`🔥 ENDPOINT TROUVÉ : ${request.method()} ${url}`);
                const headers = request.headers();
                console.log(`📑 HEADERS:`, JSON.stringify(headers, null, 2));
                if (request.postData()) {
                    console.log(`📦 PAYLOAD:`, request.postData());
                }
                console.log(`========================================\n`);
            }
        }
    });

    try {
        console.log('Navigation vers 1xBet Results...');
        await page.goto('https://1xbet.com/en/results/', { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('✅ Page chargée ! Le script va rester ouvert 2 minutes.');
        console.log('👉 S T P : Si un CAPTCHA apparait, résous-le. Ensuite, clique sur "Tennis" et lance une recherche de résultats.');

        await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes for user interaction
    } catch (e) {
        console.error('Erreur:', e.message);
    }

    console.log('Fermeture du navigateur...');
    await browser.close();
})();
