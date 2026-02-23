import NodeCache from 'node-cache';

// Standard TTL is 60 seconds.
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export default cache;
