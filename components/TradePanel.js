'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function TradePanel({ marketId, userId, market }) {
    const { refreshProfile } = useAuth();
    const [selectedPlayer, setSelectedPlayer] = useState('P1'); // 'P1' or 'P2'
    const [orderSide, setOrderSide] = useState('BUY'); // 'BUY' or 'SELL'
    const [amount, setAmount] = useState('10'); // String for input handling
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Safe access to market data
    const pivot = market?.pivot_price || 50;
    const p1Name = market?.p1_name || 'Player 1';
    const p2Name = market?.p2_name || 'Player 2';

    // Active Player values
    const activePrice = selectedPlayer === 'P1' ? pivot : (100 - pivot);
    const activeName = selectedPlayer === 'P1' ? p1Name : p2Name;
    const activeColor = selectedPlayer === 'P1' ? 'text-green-500' : 'text-green-500'; // Both 'buying' yes for that player is green

    // Derived logic
    const numericAmount = parseFloat(amount) || 0;
    // Wait, previously we aligned that Engine treats price as 0-100 ($50). 
    // BUT user wants Kalshi style "72¢".
    // 72¢ = $0.72. 
    // IF Engine price is 72.00, that is $72.00 per share? Or is it 72 cents?
    // Engine: `balance` is in Dollars. Order `price` is 0-100.
    // If I have $100 balance. Price is 50.
    // Previous logic: `amount / price`. $100 / 50 = 2 shares.
    // Payout = 2 * 100 = $200. Profit $100.
    // This implies 1 share costs $50.00.
    // Kalshi shares cost between $0.01 and $0.99.
    // *Critial Check*: If we want "72¢" UI, we need to artificially display it as cents, but keeping the engine logic (where 1 share = $100 payout) means 1 share costs $72.
    // Use Case:
    // UI says: "Price 72¢". User bets $10.
    // Expectation: $10 / $0.72 = 13.8 shares.
    // Payout: 13.8 * $1.00 = $13.80.
    // Engine Reality: Price is 72. 1 Share = $72.
    // $10 / 72 = 0.138 shares.
    // Payout: 0.138 * 100 = $13.80.
    // RESULT IS THE SAME!
    // So we can display "72¢" and "No. of shares" will just be fractional.
    // And "Payout" will be correct.

    // Logic split for BUY vs SELL
    // BUY: Input is $, convert to Shares.
    // SELL: Input is $, convert to Shares to sell? OR Input is Shares?
    // Kalshi: You toggle "Dollars" or "Shares". We stuck to Dollars only for simplicity.
    // IF SELL DOLLARS: "I want to sell $50 worth of position". 
    // Shares = $50 / Price. 
    // Proceeds = Shares * Price = $50.
    // User basically cashes out $50.

    // Let's keep it simple: Input is ALWAYS Dollars involved.
    // BUY: Pay $Amount. Get `Amount / Price` shares.
    // SELL: Get $Amount. Sell `Amount / Price` shares.

    const estShares = numericAmount / (activePrice / 100);

    const potentialPayout = orderSide === 'BUY'
        ? estShares * 1.00 // If Buy, payout is realized at $1.00
        : numericAmount;   // If Sell, payout is immmediate cash (approx the input amount)

    // Profit logic
    // Buy: Payout ($100) - Cost ($72).
    // Sell: Proceeds ($72) - Cost (Avg Entry). We don't know avg entry here easily without looking up portfolio.
    // So for Sell, let's show "Est. Proceeds".

    const returnPct = orderSide === 'BUY' && numericAmount > 0
        ? ((potentialPayout - numericAmount) / numericAmount) * 100
        : 0;

    const executeTrade = async () => {
        if (numericAmount <= 0) return;
        setLoading(true);
        setMessage('');

        try {
            // Use Next.js proxy to Trading Service
            const endpoint = orderSide === 'BUY'
                ? '/api/trading/buy'
                : '/api/trading/sell';

            // If BUY: Amount is Dollars. backend expects 'amount' as QUANTITY creates confusion?
            // Re-verified api/buy.js: "amount" in body is used as "quantityToSend".
            // My previous code: `quantityToSend = numericAmount / activePrice`.

            // Re-verify `activePrice` (0-100).
            // Example: Price 50. Amount $100.
            // quantityToSend = 100 / 50 = 2.
            // Backend treats as 2 shares. Cost = 2 * 50 = 100. Correct.

            // IF SELL:
            // Input $100. Price 50.
            // quantityToSend = 100 / 50 = 2.
            // Backend: Sells 2 shares. Proceeds = 2 * 50 = 100. Correct.

            const quantityToSend = numericAmount / activePrice;

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    marketId,
                    amount: quantityToSend, // Sends SHARES count
                    selection: selectedPlayer
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage(`✅ ${orderSide === 'BUY' ? 'BOUGHT' : 'SOLD'}!`);
                // CRITICAL: Refresh profile to update balance immediately
                await refreshProfile();
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage(`❌ ${data.error}`);
            }
        } catch (e) {
            setMessage(`❌ Error: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 p-6 shadow-2xl font-sans">
            {/* Header / Outcome Toggle */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Prediction</h2>

                {/* BUY / SELL TOGGLE */}
                <div className="flex bg-black/40 rounded-lg p-1">
                    <button
                        onClick={() => setOrderSide('BUY')}
                        className={`px-4 py-1 text-xs font-bold rounded transition-colors ${orderSide === 'BUY' ? 'bg-[#22c55e] text-black' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Buy
                    </button>
                    <button
                        onClick={() => setOrderSide('SELL')}
                        className={`px-4 py-1 text-xs font-bold rounded transition-colors ${orderSide === 'SELL' ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Sell
                    </button>
                </div>
            </div>

            {/* Outcome Selectors (Tiles) */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={() => setSelectedPlayer('P1')}
                    className={`flex-1 p-4 rounded-lg flex flex-col items-start border-2 transition-all ${selectedPlayer === 'P1'
                        ? 'bg-[#1a2c2c] border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                        : 'bg-[#2a2a2a] border-transparent hover:bg-[#333]'
                        }`}
                >
                    <span className="text-gray-300 font-semibold truncate w-full text-left">{p1Name}</span>
                    <span className={`text-2xl font-bold mt-1 ${selectedPlayer === 'P1' ? 'text-[#22c55e]' : 'text-gray-400'}`}>
                        {pivot}¢
                    </span>
                </button>

                <button
                    onClick={() => setSelectedPlayer('P2')}
                    className={`flex-1 p-4 rounded-lg flex flex-col items-start border-2 transition-all ${selectedPlayer === 'P2'
                        ? 'bg-[#1a2c2c] border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                        : 'bg-[#2a2a2a] border-transparent hover:bg-[#333]'
                        }`}
                >
                    <span className="text-gray-300 font-semibold truncate w-full text-left">{p2Name}</span>
                    <span className={`text-2xl font-bold mt-1 ${selectedPlayer === 'P2' ? 'text-[#22c55e]' : 'text-gray-400'}`}>
                        {100 - pivot}¢
                    </span>
                </button>
            </div>

            {/* Input Section */}
            <div className="mb-6">
                <div className="flex justify-between mb-2">
                    <label className="text-gray-400 text-sm">{orderSide} Amount</label>
                    <div className="text-gray-500 text-sm flex gap-2">
                        <button onClick={() => setAmount('10')} className="hover:text-white">$10</button>
                        <button onClick={() => setAmount('50')} className="hover:text-white">$50</button>
                        <button onClick={() => setAmount('100')} className="hover:text-white">$100</button>
                    </div>
                </div>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">$</span>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className={`w-full bg-[#121212] border border-gray-700 rounded-lg py-4 pl-10 pr-4 text-white text-2xl font-bold outline-none transition-all placeholder-gray-700 ${orderSide === 'BUY' ? 'focus:border-green-500 focus:ring-green-500' : 'focus:border-red-500 focus:ring-red-500'}`}
                        placeholder="0"
                    />
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#2a2a2a] rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Type</span>
                    <span className={`font-bold ${orderSide === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                        {orderSide} {activeName}
                    </span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Avg Price</span>
                    <span className="text-white">{activePrice}¢</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Shares</span>
                    <span className="text-white">{estShares.toFixed(2)}</span>
                </div>

                {orderSide === 'BUY' && (
                    <>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Payout if Yes</span>
                            <span className="text-[#22c55e] text-xl font-bold">${potentialPayout.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-end text-xs text-[#22c55e]">
                            +{returnPct.toFixed(1)}% return
                        </div>
                    </>
                )}
                {orderSide === 'SELL' && (
                    <>
                        <div className="h-px bg-gray-700 my-2"></div>
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 text-sm">Est. Proceeds</span>
                            <span className="text-white text-xl font-bold">${numericAmount.toFixed(2)}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Action Button */}
            <button
                onClick={executeTrade}
                disabled={loading || numericAmount <= 0}
                className={`w-full font-bold py-4 rounded-lg text-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${orderSide === 'BUY'
                    ? 'bg-[#22c55e] hover:bg-[#16a34a] text-black shadow-[0_0_20px_rgba(34,197,94,0.3)]'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                    }`}
            >
                {loading ? 'Processing...' : `${orderSide} ${activeName}`}
            </button>

            {/* Status Message */}
            {message && (
                <div className={`mt-4 text-center text-sm font-medium ${message.includes('❌') ? 'text-red-400' : 'text-green-400'} animate-fade-in`}>
                    {message}
                </div>
            )}
        </div>
    );
}
