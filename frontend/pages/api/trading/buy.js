
import { createClient } from '@supabase/supabase-js';

// TODO: Move to shared config
const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { userId, marketId, amount, selection } = req.body;

    // VALIDATION
    if (!userId || !marketId || !amount || !selection) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
        return res.status(400).json({ error: 'Amount must be positive' });
    }

    try {
        // 1. CHECK USER PENDING BALANCE (Simple check)
        // [MODIFIED] Use 'profiles' instead of 'users'
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            return res.status(404).json({ error: 'User profile not found. Please sign up.' });
        }

        if (user.balance < amount) { // Wait, amount here is SHARES.
            // Check logic: "amount" in body is QUANTITY.
            // Cost is unknown until we check order book.
            // We can only check approximate balance or check later.
            // But let's check basic balance > 0
        }

        // 2. FETCH LIQUIDITY (Opposite side)
        // If we BUY 'P1', we need SELLers of 'P1'.
        // Sort by PRICE ASCENDING (Cheapest first) for Best Execution.
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('side', 'SELL') // We match against Sellers
            .eq('selection', selection)
            .eq('status', 'OPEN')
            .order('price', { ascending: true }); // Buy low!

        if (ordersError) {
            return res.status(500).json({ error: ordersError.message });
        }

        if (!orders || orders.length === 0) {
            return res.status(400).json({ error: 'No liquidity available' });
        }

        // 3. EXECUTE (Simple Mock - Fill first available or fail if not enough)
        // In real order book, we iterate and fill multiple.
        // Simplified Phase 2: Fill the best price if it covers the amount OR partial fill.
        // LIMIT CHECK (2.3): Check max size (10% of total liquidity?)

        let availableLiquidity = 0;
        orders.forEach(o => availableLiquidity += (o.amount - o.filled_amount));

        // 2.3 MAX SIZE CHECK
        const MAX_SIZE_PCT = 1.0; // Relaxed to 100% for demo
        if (amount > availableLiquidity * MAX_SIZE_PCT) {
            return res.status(400).json({
                error: `Order too large. Max allowed: ${(availableLiquidity * MAX_SIZE_PCT).toFixed(2)}`
            });
        }

        // EXECUTE MATCH
        // Just match against the best order for this demo simplified logic
        const bestOrder = orders[0];
        const fillAmount = Math.min(amount, bestOrder.amount - bestOrder.filled_amount);
        const executionPrice = bestOrder.price;

        if (fillAmount <= 0) {
            return res.status(400).json({ error: 'Best order execution failed' }); // Should not happen given liquidity check
        }

        // 4. DB UPDATES
        // A. Deduct User Balance (Cost = Quantity * Price)
        const totalCost = fillAmount * executionPrice;

        // RPC might not exist. If not, we do unsafe client-side calc for prototype.
        const newBalance = user.balance - totalCost;

        // Double check balance again before update (optimistic)
        if (newBalance < 0) {
            return res.status(400).json({ error: `Insufficient balance for trade cost $${totalCost.toFixed(2)}` });
        }

        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

        // B. Update Order (Reduce liquidity)
        const newFilled = Number(bestOrder.filled_amount) + fillAmount;
        const newStatus = newFilled >= bestOrder.amount ? 'FILLED' : 'OPEN';

        await supabase.from('orders').update({
            filled_amount: newFilled,
            status: newStatus
        }).eq('id', bestOrder.id);

        // C. Update Position
        const { data: existingPosition, error: posError } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', userId)
            .eq('market_id', marketId)
            .eq('selection', selection)
            .single();

        if (existingPosition) {
            // Update Average Price & Amount
            const oldAmount = Number(existingPosition.amount);
            const oldAvg = Number(existingPosition.average_price);
            const newAmount = oldAmount + fillAmount;
            const newAvg = ((oldAmount * oldAvg) + (fillAmount * executionPrice)) / newAmount;

            await supabase
                .from('positions')
                .update({ amount: newAmount, average_price: newAvg })
                .eq('id', existingPosition.id);
        } else {
            // Create New Position
            await supabase
                .from('positions')
                .insert({
                    user_id: userId,
                    market_id: marketId,
                    selection: selection,
                    amount: fillAmount,
                    average_price: executionPrice
                });
        }

        // D. RECORD TRADE HISTORY (For Chart)
        await supabase.from('market_history').insert({
            market_id: marketId,
            price: executionPrice
        });

        // E. [NEW] RECORD USER TRANSACTION HISTORY
        await supabase.from('user_transactions').insert({
            user_id: userId,
            market_id: marketId,
            type: 'BUY',
            selection: selection,
            amount: fillAmount,
            price: executionPrice
        });

        return res.status(200).json({
            success: true,
            filled: fillAmount,
            price: executionPrice,
            remainingBalance: newBalance
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
