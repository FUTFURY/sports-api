import cors from 'cors';

// In Vercel serverless functions, we wrap the standard Express cors middleware.
const corsOptions = {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

const corsMiddleware = cors(corsOptions);

// Helper method to wait for a middleware to execute before continuing
export function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

export const withCors = (handler) => async (req, res) => {
    await runMiddleware(req, res, corsMiddleware);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    return handler(req, res);
};

export default { withCors, runMiddleware };
