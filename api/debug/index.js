import { withCors } from '../../utils/cors.js';

// This is a proxy endpoint that makes requests server-side and relays the response.
// EventsStat blocks Vercel's datacenter IPs, so we proxy through this endpoint
// to add the right headers that allow access.
const handler = async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'Missing url param' });

    try {
        const decodedUrl = decodeURIComponent(url);
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://eventsstat.com/en/statistic/',
                'Origin': 'https://eventsstat.com',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            }
        });

        const text = await response.text();
        // Try to parse as JSON, return as-is if not
        try {
            const json = JSON.parse(text);
            res.status(200).json(json);
        } catch {
            res.status(200).send(text);
        }
    } catch (e) {
        res.status(200).json({ error: e.message });
    }
};

export default withCors(handler);
