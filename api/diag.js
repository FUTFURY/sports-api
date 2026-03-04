import { withCors } from '../utils/cors.js';

const handler = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(200).json({ error: 'Missing q' });

    const logs = [];
    let entities = [];
    let events = [];

    try {
        const rawUrl = `https://eventsstat.com/en/services-api/core-api/v1/search?search=${encodeURIComponent(q)}&lng=en&ref=1&fcountry=91&gr=285`;
        logs.push('Fetching: ' + rawUrl);
        const r = await fetch(rawUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://eventsstat.com/en/statistic/',
                'Accept': 'application/json'
            }
        });
        const text = await r.text();
        logs.push('Status: ' + r.status + ' len: ' + text.length);
        logs.push('Preview: ' + text.substring(0, 200));
        const data = JSON.parse(text);
        entities = data.data || [];
        logs.push('Entities count: ' + entities.length);
    } catch (e) {
        logs.push('EventsStat error: ' + e.message);
    }

    try {
        const urlLine = `https://sa.1xbet.com/service-api/LineFeed/Web_SearchZip?text=${encodeURIComponent(q)}&limit=20&lng=en&country=158&mode=4`;
        const r2 = await fetch(urlLine);
        const d2 = await r2.json();
        events = d2.Value || [];
        logs.push('Events count: ' + events.length);
    } catch (e2) {
        logs.push('1xbet error: ' + e2.message);
    }

    res.status(200).json({ logs, entities: entities.length, events: events.length });
};

export default withCors(handler);
