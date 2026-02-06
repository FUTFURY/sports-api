import searchHandler from '../api/search.js';
// Mock process.env
process.env.ONEXBET_COOKIE = "";
process.env.ONEXBET_X_HD = "";

// Mock req, res
const req = {
    query: { text: 'Paris Saint-Germain', lng: 'fr' },
    method: 'GET'
};

const res = {
    setHeader: () => { },
    status: (code) => ({
        json: (data) => {
            console.log("--- STATUS CODE:", code, "---");
            console.log(JSON.stringify(data, null, 2));
            return res;
        }
    })
};

console.log("Testing api/search.js with text='psg'...");
searchHandler(req, res);
