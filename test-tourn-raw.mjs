import { gotScraping } from 'got-scraping';

async function testRaw(id) {
    const url = `https://eventsstat.com/en/services-api/SiteService/TournSeasonInfo?tournamentId=${id}&sId=4&ln=en&partner=1&geo=1`;
    console.log(`Testing RAW TournSeasonInfo for ID: ${id}`);
    try {
        const res = await gotScraping.get(url);
        console.log('Status code:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('Body length:', res.body.length);
        console.log('Body start:', res.body.substring(0, 200));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testRaw('699a0b7b5e99bd05c6eaabba');
