import { gotScraping } from 'got-scraping';
async function run() {
    const res = await gotScraping.get('https://sa.1xbet.com/service-api/LiveFeed/Get1x2_VZip?sports=1&count=100&lng=fr&mode=4&country=158&getEmpty=true', {
        headers: { 'User-Agent': 'Mozilla/5.0' }, responseType: 'json'
    });
    const matches = res.body.Value || [];
    let found = false;
    for (const m of matches) {
        if (m.MIS) {
            const misStr = JSON.stringify(m.MIS);
            if (misStr.includes('.png') || misStr.includes('stadium')) {
                console.log("Match ID:", m.I, "MIS:", m.MIS);
                found = true;
            }
        }
    }
    if (!found) console.log("No .png or stadium found in MIS in LiveFeed.");
}
run().catch(console.error);
