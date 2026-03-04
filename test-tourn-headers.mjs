import { gotScraping } from 'got-scraping';

async function testWithHeaders(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=4&ln=en&partner=1&geo=1`;
    console.log(`Testing with HEADERS for ID: ${id}`);
    try {
        const res = await gotScraping.get(url, {
            headers: {
                'Referer': 'https://eventsstat.com/en/statistics/tennis/',
                'User-Agent': "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                'Accept': 'application/json, text/plain, */*'
            }
        });
        console.log('Status code:', res.statusCode);
        console.log('Body length:', res.body.length);
        console.log('Body start:', res.body.substring(0, 200));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testWithHeaders('699a0b7b5e99bd05c6eaabba');
