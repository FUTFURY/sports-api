import { gotScraping } from 'got-scraping';
async function run() {
    // Let's test with a big match that might have stadium images
    const sgi = "6997ddd95e99bd05c6e96422"; // the football one
    const res = await gotScraping.get(`https://sports-api-hazel.vercel.app/api/match/stats?sgi=${sgi}&sport=football`, { responseType: 'json' });
    console.log(res.body?.data?.venue);
}
run().catch(console.error);
