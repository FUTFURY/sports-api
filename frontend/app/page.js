'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CalendarRow from '../components/CalendarRow';

export default function Lobby() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Fetch matches
  const fetchMatches = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // NOTE: For now we only have "Live Games".
      // In the future, we would pass ?date={selectedDate} to the API.
      // Currently, selecting a future date might show empty or just live games.

      // Use Proxy to Data Service
      const res = await fetch('/api/scores/matches-live', { cache: 'no-store' });

      if (!res.ok) throw new Error("API Error");

      const data = await res.json();

      // Filter? If date is today, show live. If date is future, show nothing (mock) for now?
      // User requested "Calendar", so let's pretend strictly:
      const today = new Date().toISOString().split('T')[0];

      if (selectedDate === today) {
        setMatches(data.matches || []);
      } else {
        // MOCK FUTURE/PAST DATA or Empty
        setMatches([]);
      }
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    const intervalId = setInterval(() => {
      // Silent refresh (don't set loading to true)
      fetchMatches(true);
    }, 5000); // Poll every 5 seconds for faster updates

    return () => clearInterval(intervalId);
  }, [selectedDate]);

  const handleMatchClick = async (matchId) => {
    // Bot auto-start is now handled by the Bot Service manager loop automatically
    console.log(`Open match ${matchId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">

      {/* HEADER & CALENDAR */}
      <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
        <div className="p-4 border-b border-white/5">
          <h1 className="text-2xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            🎾 Tennis Market
          </h1>
        </div>

        <CalendarRow onSelectDate={setSelectedDate} />
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-slate-400">
          {selectedDate === new Date().toISOString().split('T')[0] ? "Today's Matches (Live)" : `Matches for ${selectedDate}`}
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 animate-pulse">Loading matches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <Link
                href={`/match/${match.id}`}
                key={match.id}
                onClick={() => handleMatchClick(match.id)}
                className="block group"
              >
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">{match.league}</span>
                    {/* Assume Live for now if coming from live API */}
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      LIVE
                    </span>
                  </div>

                  <div className="space-y-4 mb-6">
                    {/* Header Row for Columns */}
                    <div className="flex justify-end gap-3 px-1 mb-1 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                      <div className="w-8 text-center">Set</div>
                      <div className="w-8 text-center text-blue-400">Game</div>
                      <div className="w-10 text-center text-emerald-400">Point</div>
                    </div>

                    {/* Player 1 Row */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg text-slate-200 truncate pr-2 flex-1">{match.p1}</span>
                      <div className="flex items-center justify-end gap-3 text-center">
                        <span className="w-8 font-bold text-white text-lg leading-none">{match.sets_p1 ?? match.score?.split('-')[0] ?? 0}</span>
                        <span className="w-8 font-bold text-blue-400 text-lg leading-none">{match.games_p1 ?? 0}</span>
                        <div className="w-10 bg-slate-950/50 rounded py-0.5 border border-slate-700/50 flex justify-center">
                          <span className="font-mono font-bold text-emerald-400 text-lg leading-none">{match.points_p1 ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Player 2 Row */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg text-slate-200 truncate pr-2 flex-1">{match.p2}</span>
                      <div className="flex items-center justify-end gap-3 text-center">
                        <span className="w-8 font-bold text-white text-lg leading-none">{match.sets_p2 ?? match.score?.split('-')[1] ?? 0}</span>
                        <span className="w-8 font-bold text-blue-400 text-lg leading-none">{match.games_p2 ?? 0}</span>
                        <div className="w-10 bg-slate-950/50 rounded py-0.5 border border-slate-700/50 flex justify-center">
                          <span className="font-mono font-bold text-emerald-400 text-lg leading-none">{match.points_p2 ?? 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-sm text-slate-500">
                    <span>{match.hasOdds ? "✅ Active Market" : "❌ No Liquidity"}</span>
                    <span className="text-blue-400 group-hover:underline">Trade Now &rarr;</span>
                  </div>
                </div>
              </Link>
            ))}

            {matches.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600">
                <span className="text-4xl mb-4">🎾</span>
                <p className="text-lg">No matches found for this date.</p>
                <p className="text-sm">Try selecting "Today"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div >
  );
}
