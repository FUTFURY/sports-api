import { gotScraping } from 'got-scraping';

async function testSubagentId(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=4&ln=en&partner=1&geo=1`;
    console.log(`Testing with SUBAGENT ID: ${id}`);
    try {
        const res = await gotScraping.get(url, { responseType: 'json' });
        if (res.body && res.body.T) {
            console.log(`✅ Success! Tournament:`, res.body.T.T);
        } else {
            console.log(`❌ Failed. Body length:`, JSON.stringify(res.body).length);
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testSubagentId('5abc9cf7494765f3cac8d2f7');
