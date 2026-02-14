'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import OrderBook from '@/components/OrderBook';
import PriceChart from '@/components/PriceChart';
import TradePanel from '@/components/TradePanel';
import Portfolio from '@/components/Portfolio';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { use1xZone } from '@/hooks/use1xZone';
import TennisLiveView from '@/components/TennisLiveView';
import MatchStats from '@/components/MatchStats';



export default function MatchPage() {
  const params = useParams();
  const MARKET_ID = params?.id;

  const { user, profile, refreshProfile } = useAuth();
  const balance = profile?.balance || 0;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // REAL-TIME WEBSOCKET (Direct from 1xBet, costs $0 in Supabase)
  const { gameState, status: wsStatus } = use1xZone(MARKET_ID);

  // Fetch Match Data from BACKEND API
  useEffect(() => {
    if (!MARKET_ID) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/scores/match/${MARKET_ID}`);
        if (!res.ok) throw new Error('Match not found');
        const data = await res.json();
        setMatch(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching match:', error);
        setLoading(false);
      }
    };

    fetchMatch();
    const intervalId = setInterval(fetchMatch, 10000); // Polling reduced to 10s (WS handles live changes)

    return () => clearInterval(intervalId);
  }, [MARKET_ID]);

  // Merge WebSocket stats into match state
  useEffect(() => {
    if (gameState?.raw && match) {
      // Deep update only if necessary to avoid re-renders
      setMatch(prev => ({
        ...prev,
        live_zone: gameState, // Inject real-time movement
        score: gameState.raw.SC?.FS ? `${gameState.raw.SC.FS.S1}-${gameState.raw.SC.FS.S2}` : prev.score,

        // Update Sets (Full Score)
        sets_p1: gameState.raw.SC?.FS?.S1 ?? prev.sets_p1,
        sets_p2: gameState.raw.SC?.FS?.S2 ?? prev.sets_p2,

        // Update Set Scores Table
        period_scores: gameState.raw.SC?.PS?.map(p => ({
          s1: p.Value?.S1,
          s2: p.Value?.S2
        })) ?? prev.period_scores,

        // Update Games (Current Set Score)
        // PS is usually list of sets. Last element is current set. Its value is games (e.g. 6-5)
        games_p1: gameState.raw.SC?.PS?.[gameState.raw.SC.PS.length - 1]?.Value?.S1 ?? prev.games_p1 ?? 0,
        games_p2: gameState.raw.SC?.PS?.[gameState.raw.SC.PS.length - 1]?.Value?.S2 ?? prev.games_p2 ?? 0,

        // Update Points (Current Game - 15, 30, 40)
        // SC.S1/S2 are often points in 1xBet live feed when available, or SC.QP (Quarter Points / Current Points)
        points_p1: gameState.raw.SC?.S1 ?? gameState.raw.SC?.QP?.S1 ?? prev.points_p1 ?? 0,
        points_p2: gameState.raw.SC?.S2 ?? gameState.raw.SC?.QP?.S2 ?? prev.points_p2 ?? 0
      }));
    }
  }, [gameState]);


  if (!MARKET_ID) return <div className="text-white p-10">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-50">
      <Header match={match} isLive={match?.status === 'ACTIVE'} />

      <main className="flex-1 p-4 grid grid-cols-12 gap-6">

        {/* LEFT COLUMN - LIVE COURT & CHART (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">

          {/* LIVE TENNIS VISUAL (Free WebSocket Data) */}
          <TennisLiveView gameState={gameState} match={match} />

          {/* CHART AREA */}
          <div className="flex-1 min-h-[450px] bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-widest">Market Price History</h3>
            <PriceChart marketId={MARKET_ID} />
          </div>

          {/* TRADING ACTIONS */}
          <div>
            <TradePanel marketId={MARKET_ID} userId={user?.id} market={match} />
          </div>
        </div>

        {/* RIGHT COLUMN - STATS & ORDER BOOK (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">

          {/* ACCOUNT & BALANCE */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-6 rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-500/10">
            <h3 className="text-indigo-200 text-[10px] font-bold tracking-widest uppercase mb-1">Available Funds</h3>
            <div className="text-4xl font-black text-white tracking-tight">${balance?.toFixed(2)}</div>
          </div>

          {/* DETAILED MATCH STATS (1xBet API) */}
          <MatchStats matchId={MARKET_ID} />

          {/* PORTFOLIO */}
          <Portfolio userId={user?.id} marketId={MARKET_ID} currentMarket={match} />

          {/* ORDER BOOK */}
          <div className="flex-1 min-h-[400px]">
            <OrderBook marketId={MARKET_ID} />
          </div>
        </div>

      </main>

    </div>
  );
}
