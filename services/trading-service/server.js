import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Initialize Supabase (Use env variables ideally, but hardcoding for now as seen in other files)
const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZ2trZG5peHF4aXZ0dXVob2tsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTgyOTgzOSwiZXhwIjoyMDUxNDA1ODM5fQ.x_5Ia2o1LjbP0jbN8PaVQbEQI-ggLcPDShCJIgqN3DY';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Helper for sending generic error
const sendError = (res, msg, status = 400) => res.status(status).json({ success: false, error: msg });

// Buy Endpoint
app.post('/trade/buy', async (req, res) => {
    const { userId, marketId, amount, selection } = req.body; // amount is in SHARES or DOLLARS? Let's assume DOLLARS and calc shares based on price? Or SHARES directly?
    // Based on previous code: "amount: quantityToSend" was being sent as SHARES.
    // Let's stick to SHARES for consistency with previous logic, but be clearer.

    if (!userId || !marketId || !amount || !selection) {
        return sendError(res, 'Missing required fields');
    }

    try {
        // 1. Get user balance
        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (profileError || !userProfile) return sendError(res, 'User not found');

        // 2. Get market price (from Data Service or simulate/mock for now since Data Service holds live price)
        // Ideally Trading Service calls Data Service. For MVP, we'll fetch price from the request body or re-fetch from Data Service. 
        // Let's assume the client sends the *expected* price OR fetch live.
        // Simplified: Fetch price from Data Service (3001).

        const priceRes = await fetch(`http://localhost:3001/match/${marketId}`);
        if (!priceRes.ok) return sendError(res, 'Market closed or not found');

        const marketData = await priceRes.json();
        const price = selection === 'P1' ? (marketData.pivot_price || 50) : (100 - (marketData.pivot_price || 50));

        // Calculate Cost
        // If amount is SHARES: Cost = amount * price
        // If amount is DOLLARS: Shares = amount / price

        // Let's assume amount is SHARES for now as per previous logic
        const cost = amount * (price / 100); // Price is 0-100 (cents), cost in dollars

        if (userProfile.balance < cost) {
            return sendError(res, `Insufficient funds. Cost: $${cost.toFixed(2)}, Balance: $${userProfile.balance}`);
        }

        // 3. Execute Trade via RPC (Atomic Transaction)
        const { data: rpcData, error: txError } = await supabase.rpc('execute_buy_order', {
            p_user_id: userId,
            p_market_id: marketId,
            p_shares: amount,   // Renamed to match SQL param p_shares
            p_price: price,     // Price per share (cents)
            p_selection: selection
        });

        if (txError || (rpcData && !rpcData.success)) {
            console.error("RPC Error:", txError, rpcData);
            return sendError(res, txError ? txError.message : rpcData.error);
        }

        res.json({ success: true, message: `Bought ${amount} shares at ${price}¢`, newBalance: rpcData.new_balance });

    } catch (e) {
        console.error("Buy error:", e);
        sendError(res, e.message, 500);
    }
});

app.listen(PORT, () => {
    console.log(`✅ TRADING SERVICE running on http://localhost:${PORT}`);
});
