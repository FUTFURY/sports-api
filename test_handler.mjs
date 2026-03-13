import handler from './api/entity/[id].js';

async function run() {
    const req = {
        query: { id: '60b7f272f75a663f6962fda6', type: 'league', sportId: '66' },
        headers: { origin: 'http://localhost' },
        method: 'GET'
    };

    const res = {
        status: function (code) {
            console.log("Status:", code);
            return this;
        },
        json: function (data) {
            console.log(JSON.stringify(data, null, 2));
            return this;
        },
        setHeader: function (key, val) {
            console.log(`Header: ${key} = ${val}`);
        }
    };

    console.log("Running league test...");
    await handler(req, res);

    req.query = { id: '5abf2e56494765f3cafefafa', type: 'athlete' };
    console.log("\n\nRunning athlete test...");
    await handler(req, res);
}

run();
