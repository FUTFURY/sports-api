const axios = require('axios');
const fs = require('fs');

async function test() {
    const res = await axios.get('https://eventsstat.com/en/services-api/SiteService/RatingDetailedNewBySelectors?tournId=5b19067ef87e5825813fb409&recLimit=l.100&ln=en&partner=1&geo=158');
    fs.writeFileSync('rankings.json', JSON.stringify(res.data, null, 2));
    console.log('Saved to rankings.json');
}
test();
