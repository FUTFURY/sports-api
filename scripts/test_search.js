import handler from '../api/search.js';

const req = {
    method: 'GET',
    query: { text: 'Real', lng: 'fr' }
};

const res = {
    setHeader: (key, value) => { },
    status: (code) => {
        console.log(`[Status] ${code}`);
        return res;
    },
    json: (data) => {
        console.log('[JSON Response]:');
        console.log(JSON.stringify(data, null, 2));
        return res;
    },
    end: () => console.log('[End]')
};

console.log("Running local test for api/search.js with 'Real'...");
handler(req, res).catch(err => console.error("Handler Error:", err));
