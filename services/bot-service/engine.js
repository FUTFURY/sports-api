
import fs from 'fs/promises';
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// CONFIGURATION
// CONFIGURATION
const MATCH_ID = process.argv[2] || 695013516; // Eliakim Coulibaly vs Petros Tsitsipas
const POLL_INTERVAL_MS = 5000;
const KILL_SWITCH_LOW = 5;
const KILL_SWITCH_HIGH = 95;

// SUPABASE CONFIG
const SUPABASE_URL = 'https://wcgkkdnixqxivtuuhokl.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// STATE
let lastHash = "";
let isSuspended = false;

// UTILS
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const toPrice = (odds) => (1 / odds) * 100;

async function fetchMatchData() {
    const url = `http://localhost:3000/api/scores/match/${MATCH_ID}`;

    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.log(`DEBUG: Data Service error ${res.status}`);
            return null;
        }
        const data = await res.json();

        // Normalize to look like old structure for processData compatibility
        // processData expects { Value: { O1, O2, SC, E, I } }
        return {
            Value: {
                I: data.id,
                O1: data.p1_name,
                O2: data.p2_name,
                SC: data.raw_sc,
                E: data.raw_e
            }
        };

    } catch (e) {
        console.error("DEBUG: Fetch Failed (Data Service)", e.message);
        return null;
    }
}

function getScore(game) {
    if (!game.SC) return "0-0";

    // Sets Score (SS)
    const s1_sets = game.SC.SS?.S1 || 0;
    const s2_sets = game.SC.SS?.S2 || 0;

    // Games Score (current set) - Find latest period in PS
    let s1_games = 0;
    let s2_games = 0;

    if (game.SC.PS && game.SC.PS.length > 0) {
        const currentPeriod = game.SC.PS[game.SC.PS.length - 1].Value;
        s1_games = currentPeriod?.S1 || 0;
        s2_games = currentPeriod?.S2 || 0;
    }

    // Format: "1-0 (4-2)" meaning 1 set to 0, current set 4-2
    return `${s1_sets}-${s2_sets} (${s1_games}-${s2_games})`;
}

function processData(data) {
    if (!data || !data.Value) {
        console.log("DEBUG: Data missing Value:", JSON.stringify(data).substring(0, 200));
        return null;
    }
    const game = data.Value;

    const events = game.E || [];
    const odd1 = events.find(e => e.T === 1);
    const odd2 = events.find(e => e.T === 3);

    if (!odd1 || !odd2) {
        console.log("DEBUG: Events found:", events.map(e => e.T));
        return { valid: false, reason: "Odds not found (T=1 or T=3 missing)" };
    }

    // List endpoint has different structure for Score (SC)
    // It usually has SC.FS (Final Score) and PS (Period Scores) but maybe less detail.

    // IMAGES (Might be missing in List, use placeholders if needed)
    // List endpoint typically doesn't include O1IMG/O2IMG. 
    // We can fetch them if needed, or just graceful fallback.
    const p1_image = null; // List doesn't provide images usually
    const p2_image = null;

    // SERVER (O1IS / O2IS) - Often missing in list
    const server = 0;

    // SCORE BREAKDOWN
    const points_p1 = game.SC?.SS?.S1 || '0';
    const points_p2 = game.SC?.SS?.S2 || '0';

    let sets_p1 = game.SC?.FS?.S1 || 0;
    let sets_p2 = game.SC?.FS?.S2 || 0;

    // Games in current set
    // List SC.PS is usually [ { Key: 1, Value: { S1: 6, S2: 4 } } ... ]
    let games_p1 = 0;
    let games_p2 = 0;
    let period_scores = [];

    if (game.SC?.PS && Array.isArray(game.SC.PS)) {
        period_scores = game.SC.PS.map(p => ({
            set: p.Key,
            s1: p.Value?.S1 || 0,
            s2: p.Value?.S2 || 0
        }));
        const current = period_scores[period_scores.length - 1];
        if (current) {
            games_p1 = current.s1;
            games_p2 = current.s2;
        }
    }

    return {
        valid: true,
        p1: game.O1,
        p2: game.O2,
        score: `${sets_p1}-${sets_p2} (${games_p1}-${games_p2}) ${points_p1}-${points_p2}`,
        c1: odd1.C,
        c2: odd2.C,
        matchId: game.I,
        p1_image,
        p2_image,
        server,
        points_p1,
        points_p2,
        games_p1,
        games_p2,
        sets_p1,
        sets_p2,
        period_scores
    };
}

async function updateMarketAndOrders(stats) {
    if (isSuspended) {
        console.log("⏸️ Market Suspended (Kill Switch). Skipping DB updates.");
        return;
    }

    // 1. UPDATE MARKET
    const { error: marketError } = await supabase
        .from('markets')
        .upsert({
            id: stats.matchId.toString(),
            p1_name: stats.p1,
            p2_name: stats.p2,
            p1_odds: stats.c1,
            p2_odds: stats.c2,
            pivot_price: stats.fair1,
            status: 'ACTIVE',
            // Detailed Stats
            p1_image: stats.p1_image,
            p2_image: stats.p2_image,
            server: stats.server,
            points_p1: stats.points_p1,
            points_p2: stats.points_p2,
            games_p1: stats.games_p1,
            games_p2: stats.games_p2,
            sets_p1: stats.sets_p1,
            sets_p2: stats.sets_p2,
            period_scores: stats.period_scores
        }, { onConflict: 'id' });

    if (marketError) {
        console.error("❌ Failed to update Market:", marketError.message);
        return;
    }

    // 1.5 SAVE PRICE HISTORY (For Chart Persistence)
    await supabase.from('market_history').insert({
        market_id: stats.matchId.toString(),
        price: stats.fair1
    });

    // 2. INJECT ORDERS (BOT)
    // Clear existing bot orders for this market (Simple approach for prototype)
    // Real MM would update/cancel specific orders.
    // For now, we assume we are the only liquidity provider or we clean up our own previous loop.
    // To make it simple: We just ADD orders. (In production, we'd cancel old ones).
    // Let's try to delete all orders for this market first to keep order book clean for the demo.
    await supabase.from('orders').delete().eq('market_id', stats.matchId.toString());

    const orders = [];

    // SPREAD CONFIG
    const spread = 2.0; // 2% spread
    const fairPrice = stats.fair1; // Pivot

    // BUY SIDE (Bids) - Lower than fair price
    // We want to BUY P1.
    // Order 1: Fair - 1%
    // P1 ORDERS
    // BUY P1 (Bid)
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice - 1, amount: 500, selection: 'P1' });
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice - 2, amount: 1000, selection: 'P1' });
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice - 3, amount: 2000, selection: 'P1' });

    // SELL P1 (Ask)
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice + 1, amount: 500, selection: 'P1' });
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice + 2, amount: 1000, selection: 'P1' });
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice + 3, amount: 2000, selection: 'P1' });

    // P2 ORDERS
    const fairPrice2 = 100 - fairPrice;

    // BUY P2 (Bid)
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice2 - 1, amount: 500, selection: 'P2' });
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice2 - 2, amount: 1000, selection: 'P2' });
    orders.push({ market_id: stats.matchId.toString(), side: 'BUY', price: fairPrice2 - 3, amount: 2000, selection: 'P2' });

    // SELL P2 (Ask)
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice2 + 1, amount: 500, selection: 'P2' });
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice2 + 2, amount: 1000, selection: 'P2' });
    orders.push({ market_id: stats.matchId.toString(), side: 'SELL', price: fairPrice2 + 3, amount: 2000, selection: 'P2' });

    const { error: ordersError } = await supabase.from('orders').insert(orders);

    if (ordersError) {
        console.error("❌ Failed to inject orders:", ordersError.message);
    } else {
        console.log(`🤖 Bot Injected 6 Orders around Pivot: ${fairPrice.toFixed(2)}`);
    }
}

async function startEngine() {
    console.log("🚀 Starting Data & Math Engine + Market Maker Bot...");
    console.log(`🎯 Target Match: ${MATCH_ID}`);

    let lastSignature = "";

    // Recursive loop function to allow dynamic polling intervals
    const runLoop = async () => {
        const now = new Date().toISOString().split('T')[1].split('.')[0];
        let nextPollMs = POLL_INTERVAL_MS;

        try {
            const data = await fetchMatchData();

            if (!data) {
                console.log(`[${now}] ❌ Match not found or Fetch Error. Sleeping 30s...`);
                setTimeout(runLoop, 30000); // Wait 30s if match not found
                return;
            }

            const result = processData(data);

            if (!result || !result.valid) {
                console.log(`[${now}] ⚠️ Data Invalid: ${result?.reason || 'Unknown'}. Retrying in ${POLL_INTERVAL_MS}ms...`);
                setTimeout(runLoop, POLL_INTERVAL_MS);
                return;
            }

            // DEDUPLICATION CHECK
            // Create a signature of the data points that trigger a DB update
            const currentSignature = JSON.stringify({
                mom: result.mom, // Momentum if we had it
                c1: result.c1,
                c2: result.c2,
                score: result.score,
                server: result.server,
                points: `${result.points_p1}-${result.points_p2}`
            });

            if (currentSignature === lastSignature) {
                console.log(`[${now}] ♻️ No change in odds/score. Skipping DB update.`);
                // We can still log the status briefly or just skip
                // console.log(`STATUS: ${isSuspended ? "⛔ PAUSED" : "✅ ACTIVE"} (Cached)`);
            } else {
                // DATA CHANGED - PROCEED
                lastSignature = currentSignature;

                // MATH
                const implied1 = toPrice(result.c1);
                const implied2 = toPrice(result.c2);
                const marketSum = implied1 + implied2;
                const margin = marketSum - 100;

                // FAIR PRICE (Normalized)
                const fair1 = (implied1 / marketSum) * 100;
                const fair2 = (implied2 / marketSum) * 100;

                // Add fair prices to result for DB update
                result.fair1 = fair1;
                result.fair2 = fair2;

                // KILL SWITCH
                let status = "✅ ACTIVE";
                if (implied1 < KILL_SWITCH_LOW || implied1 > KILL_SWITCH_HIGH ||
                    implied2 < KILL_SWITCH_LOW || implied2 > KILL_SWITCH_HIGH) {
                    status = "⛔ MARKET PAUSED - LIQUIDITY REMOVED";
                    isSuspended = true;
                    console.log("\n⚠️ DANGER: Extreme odds detected. Trading suspended.");
                } else {
                    isSuspended = false;
                }

                // DB UPDATE & BOT
                await updateMarketAndOrders(result);

                // DISPLAY
                // console.clear(); // Ensure clean output
                console.log(`\n============== ${now} ==============`);
                console.log(`MATCH: ${result.p1} vs ${result.p2}`);
                console.log(`SCORE: Sets[${result.sets_p1}-${result.sets_p2}] Games[${result.games_p1}-${result.games_p2}] Points[${result.points_p1}-${result.points_p2}]`);
                if (result.server !== 0) console.log(`SERVING: Player ${result.server}`);
                console.log(`STATUS: ${status}`);
                console.log(`MARKET MARGIN: ${margin.toFixed(2)}%`);
                console.log(`----------------------------------------`);
                console.log(`PLAYER 1 (${result.p1}): Odds: ${result.c1} | Fair: ${fair1.toFixed(2)}%`);
                console.log(`PLAYER 2 (${result.p2}): Odds: ${result.c2} | Fair: ${fair2.toFixed(2)}%`);
                console.log(`========================================`);
            }

        } catch (e) {
            console.error(`[${now}] 💥 Top Level Error:`, e);
        }

        // Schedule next run
        setTimeout(runLoop, nextPollMs);
    };

    // Start the loop
    runLoop();
}

startEngine();
