
import { Activity } from 'lucide-react';

export default function Header({ match, isLive }) {
    if (!match) return <div className="p-4 text-center">Loading Match Data...</div>;

    // Helper to safely get set score
    const getSetScore = (pIndex, setIndex) => {
        if (!match.period_scores || !match.period_scores[setIndex]) return '-';
        return pIndex === 1 ? match.period_scores[setIndex].s1 : match.period_scores[setIndex].s2;
    };

    return (
        <header className="bg-slate-900 border-b border-slate-800 pb-6 pt-4">
            {/* BRANDING */}
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                    <Activity className={`w-6 h-6 ${isLive ? 'text-green-500 animate-pulse' : 'text-gray-500'}`} />
                    <h1 className="text-xl font-bold text-white tracking-tight">Sports<span className="text-green-500">Trade</span></h1>
                </div>
                <div className="flex flex-col items-end">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
                        LIVE MARKET
                    </span>
                    <span className="text-xs text-slate-500 mt-1 font-mono">ID: {match.id}</span>
                </div>
            </div>

            {/* SCOREBOARD CONTAINER */}
            <div className="max-w-4xl mx-auto">

                {/* 1. PLAYERS & BIG POINTS */}
                <div className="flex items-center justify-between mb-8 px-4">
                    {/* PLAYER 1 */}
                    <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                            <img
                                src={match.p1_image || `https://ui-avatars.com/api/?name=${match.p1_name}&background=0D8ABC&color=fff`}
                                alt={match.p1_name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-slate-700 shadow-lg"
                            />
                            {match.server === 1 && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-slate-900 shadow-sm">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                        <div className="text-left">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Player 1</p>
                            <h2 className="text-2xl font-bold text-white leading-none">{match.p1_name}</h2>
                            <p className="text-xs text-slate-500 mt-1">Rank: (1)</p>
                        </div>
                    </div>

                    {/* BIG POINTS CENTER */}
                    {/* BIG POINTS CENTER */}
                    <div className="flex flex-col items-center justify-center px-10">
                        {/* Sets & Games Summary */}
                        <div className="flex flex-col items-center space-y-1 mb-2">
                            <div className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
                                Sets: <span className="text-white">{match.sets_p1 || 0}-{match.sets_p2 || 0}</span>
                            </div>
                            <div className="text-xs text-blue-300 font-bold tracking-widest uppercase">
                                Games: <span className="text-white">{match.games_p1 || 0}-{match.games_p2 || 0}</span>
                            </div>
                        </div>

                        {/* Points (15-30-40) */}
                        <div className="flex items-center space-x-2 text-6xl font-black text-white tabular-nums tracking-tighter">
                            <span className="text-blue-400">{match.points_p1 || '0'}</span>
                            <span className="text-slate-600">:</span>
                            <span className="text-green-400">{match.points_p2 || '0'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">Points</div>
                    </div>

                    {/* PLAYER 2 */}
                    <div className="flex items-center space-x-4 flex-1 justify-end text-right">
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Player 2</p>
                            <h2 className="text-2xl font-bold text-white leading-none">{match.p2_name}</h2>
                        </div>
                        <div className="relative">
                            <img
                                src={match.p2_image || `https://ui-avatars.com/api/?name=${match.p2_name}&background=E53935&color=fff`}
                                alt={match.p2_name}
                                className="w-16 h-16 rounded-full object-cover border-4 border-slate-700 shadow-lg"
                            />
                            {match.server === 2 && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full p-1 border-2 border-slate-900 shadow-sm">
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. HISTORY TABLE */}
                <div className="mx-auto max-w-2xl bg-slate-800/80 rounded-xl overflow-hidden shadow-2xl border border-slate-700/50 backdrop-blur-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-6 bg-slate-900/50 text-center py-2 border-b border-slate-700/50">
                        <div className="col-span-1"></div>
                        <div className="col-span-1 text-xs font-bold text-slate-400 uppercase tracking-widest">Sets</div>
                        <div className="col-span-1 text-xs font-bold text-slate-500 uppercase tracking-widest">Set 1</div>
                        <div className="col-span-1 text-xs font-bold text-slate-500 uppercase tracking-widest">Set 2</div>
                        <div className="col-span-1 text-xs font-bold text-slate-500 uppercase tracking-widest">Set 3</div>
                        <div className="col-span-1 text-xs font-bold text-slate-500 uppercase tracking-widest">Set 4</div>
                    </div>

                    {/* Player 1 Row */}
                    <div className="grid grid-cols-6 items-center py-3 border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <div className="col-span-1 flex justify-center">
                            <img src={match.p1_image} className="w-8 h-8 rounded-full border border-slate-600" />
                        </div>
                        <div className="col-span-1 text-center text-xl font-bold text-blue-400">{match.sets_p1}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(1, 0)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(1, 1)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(1, 2)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(1, 3)}</div>
                    </div>

                    {/* Player 2 Row */}
                    <div className="grid grid-cols-6 items-center py-3 hover:bg-slate-700/20 transition-colors">
                        <div className="col-span-1 flex justify-center">
                            <img src={match.p2_image} className="w-8 h-8 rounded-full border border-slate-600" />
                        </div>
                        <div className="col-span-1 text-center text-xl font-bold text-green-400">{match.sets_p2}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(2, 0)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(2, 1)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(2, 2)}</div>
                        <div className="col-span-1 text-center text-slate-300 font-mono">{getSetScore(2, 3)}</div>
                    </div>
                </div>

            </div>
        </header>
    );
}
