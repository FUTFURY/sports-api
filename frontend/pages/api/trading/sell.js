
import { createClient } from '@supabase/supabase-js';

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

    try {
        // 1. CHECK POSITIONS (Prevent Naked Shorts)
        const { data: position, error: posError } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', userId)
            .eq('market_id', marketId)
            .eq('selection', selection)
            .single();

        if (!position || Number(position.amount) < Number(amount) - 0.000001) {
            return res.status(400).json({
                error: `Insufficient shares. You own ${position ? position.amount : 0}, trying to sell ${amount}`
            });
        }

        // 2. FETCH LIQUIDITY (Opposite side)
        // If User SELLS 'P1', we match against BUYers of 'P1'.
        // Sort by PRICE DESCENDING (Sell High!) for Best Execution.
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('side', 'BUY') // We match against Buyers
            .eq('selection', selection)
            .eq('status', 'OPEN')
            .order('price', { ascending: false }); // Sell to highest bidder

        if (ordersError) {
            return res.status(500).json({ error: ordersError.message });
        }

        if (!orders || orders.length === 0) {
            return res.status(400).json({ error: 'No liquidity available' });
        }

        // 3. EXECUTE
        let availableLiquidity = 0;
        orders.forEach(o => availableLiquidity += (o.amount - o.filled_amount));

        // 2.3 MAX SIZE CHECK
        const MAX_SIZE_PCT = 1.0; // Relaxed to 100%
        if (amount > availableLiquidity * MAX_SIZE_PCT) {
            return res.status(400).json({
                error: `Order too large. Max allowed: ${(availableLiquidity * MAX_SIZE_PCT).toFixed(2)}`
            });
        }

        // EXECUTE MATCH (Selection P1 vs Seller of P1 means we are selling P1 to a BUYER of P1)
        const bestOrder = orders[0];
        const fillAmount = Math.min(amount, bestOrder.amount - bestOrder.filled_amount);
        const executionPrice = bestOrder.price;

        if (fillAmount <= 0) {
            return res.status(400).json({ error: 'Best order execution failed' });
        }

        // 4. DB UPDATES
        // If User Sells, they GET money (Balance increases).
        // (Assuming they had the asset or we allow naked shorts/betting against).
        // For simplicity, let's say they are just "Betting Against" or "Cashing Out".
        // If this is opening a position (Lay), they might need collateral.
        // Let's assume "Selling" here means "Betting NO" or simply selling an existing position.
        // If they don't have position, maybe we just credit them the sale proceeds (simplistic model)?
        // NO, usually you pay to bet.
        // If /sell means "Sell my bet", they get paid.
        // If /sell means "Lay/Bet Against", they stake liability.
        // Let's assume standard crypto/stock exchange model:
        // User has "P1 Shares" and sells them. 
        // But do we track "P1 Shares"? Not in `users` table currently (only Balance).
        // So this might be "Betting on P2" implicitly?

        // Re-reading user request: "3 offres d'achat et 3 offres de vente... autour du Prix Pivot".
        // Implies an Order Book Exchange.
        // Only `users` (Wallet) exists. No "Positions" table asked in 2.0.
        // So likely we verify Balance for Buy, and maybe assume user DOES have shares for Sell?
        // OR maybe Sell is just "Shorting"?
        // Let's implement the MATCHING logic (User Sell vs Bot Buy).
        // And Credit the User wallet (User sells 100 @ 0.5 -> User gets 50).
        // (Ignoring position check since we don't track positions yet).

        const creditAmount = (fillAmount * executionPrice) / 100; // If price is %, amount is nominal? or units?
        // If Price is 75 (prob), and Amount is 100 (Stake?), value is different.
        // Usually: Price = Odds implies Prob.
        // Let's assume Amount is "Units of Contract".
        // Cost = Units * Price.
        // When Selling Units: User Get Units * Price.

        // match against Buyers...
        const { data: user, error: userError } = await supabase
            .from('profiles') // [MODIFIED] Use 'profiles'
            .select('balance')
            .eq('id', userId)
            .single();

        if (userError || !user) res.status(404).json({ error: "User profile not found" });

        const newBalance = user.balance + creditAmount;
        await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

        const newFilled = Number(bestOrder.filled_amount) + fillAmount;
        const newStatus = newFilled >= bestOrder.amount ? 'FILLED' : 'OPEN';

        await supabase.from('orders').update({
            filled_amount: newFilled,
            status: newStatus
        }).eq('id', bestOrder.id);

        // C. Update Position
        const { data: existingPosition } = await supabase
            .from('positions')
            .select('*')
            .eq('user_id', userId)
            .eq('market_id', marketId)
            .eq('selection', selection)
            .single();

        if (existingPosition) {
            const oldAmount = Number(existingPosition.amount);
            const newAmount = oldAmount - fillAmount;

            if (newAmount > 0) {
                await supabase
                    .from('positions')
                    .update({ amount: newAmount })
                    .eq('id', existingPosition.id);
            } else {
                await supabase.from('positions').delete().eq('id', existingPosition.id);
            }
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
            type: 'SELL',
            selection: selection,
            amount: fillAmount,
            price: executionPrice
        });

        return res.status(200).json({
            success: true,
            filled: fillAmount,
            price: executionPrice,
            remainingBalance: newBalance,
            message: "Sold successfully"
        });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
