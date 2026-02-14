'use client';

import React, { useEffect, useState } from 'react';

export default function MatchStats({ matchId }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!matchId) return;

        const fetchStats = async () => {
            try {
                const res = await fetch(`/api/scores/get-game-stats?id=${matchId}`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data.stats);
                }
            } catch (err) {
                console.error('Stats fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 15000); // 15s for detailed stats (less urgent than score)
        return () => clearInterval(interval);
    }, [matchId]);

    if (loading && !stats) return <div className="p-4 text-xs text-slate-500 italic">Syncing match data...</div>;
    if (!stats || stats.length === 0) return null;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-800/50 p-3 border-b border-slate-700">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Match Statistics</h3>
            </div>

            <div className="p-4 space-y-4">
                {stats.map((stat, idx) => {
                    const home = parseInt(stat.home) || 0;
                    const away = parseInt(stat.away) || 0;
                    const total = home + away || 1;
                    const p1Pct = (home / total) * 100;
                    const p2Pct = (away / total) * 100;

                    return (
                        <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-white">{stat.home}</span>
                                <span className="text-slate-500 uppercase">{stat.name}</span>
                                <span className="text-white">{stat.away}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full flex overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${p1Pct}%` }}
                                ></div>
                                <div
                                    className="h-full bg-slate-700 w-[2px]"
                                ></div>
                                <div
                                    className="h-full bg-pink-500 transition-all duration-500"
                                    style={{ width: `${p2Pct}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
