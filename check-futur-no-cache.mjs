import { gotScraping } from 'got-scraping';

const COMMON_HEADERS = {
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://sa.1xbet.com/en/live/tennis',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br'
};

async function checkFuturLine() {
    const MAIN_BASE_URL = 'https://sa.1xbet.com';
    const url = `${MAIN_BASE_URL}/service-api/LineFeed/Get1x2_VZip?sports=4&count=1000&lng=en&mode=4&country=158&getEmpty=true&virtualSports=true`;
    console.log("Fetching: " + url);
    const response = await gotScraping.get(url, { headers: COMMON_HEADERS, responseType: 'json' });
    const matches = response.body?.Value || [];
    console.log(`✅ Loaded ${matches.length} upcoming matches programmed in the future.\n`);

    const daysCount = {};
    matches.forEach(match => {
        if (!match.S) return;
        const d = new Date(match.S * 1000);
        d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString().split('T')[0];
        daysCount[dateStr] = (daysCount[dateStr] || 0) + 1;
    });

    const sortedDays = Object.keys(daysCount).sort();
    console.log("📅 MATCHS FUTURS PROGRAMMÉS PAR JOUR :");
    sortedDays.forEach(day => {
        console.log(`- ${day} : ${daysCount[day]} matchs prévus`);
    });
}

checkFuturLine();
