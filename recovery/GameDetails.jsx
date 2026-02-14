
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameStats } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, BarChart2, Zap } from 'lucide-react';
import Heatmap from '../components/Heatmap';

const GameDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const data = await getGameStats(id, language);
                if (data) {
                    setGame(data);
                    setError(false);
                } else {
                    setError(true);
                }
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
        const interval = setInterval(fetchDetails, 30000);
        return () => clearInterval(interval);
    }, [id, language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                <p className="text-zinc-500 font-medium tracking-widest uppercase text-sm animate-pulse">Loading Game Data...</p>
            </div>
        );
    }

    if (error || !game) {
        return (
            <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center text-white text-center p-6">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
                    <Zap size={40} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-display font-bold mb-2">Game Not Found</h2>
                <p className="text-zinc-400 max-w-md mb-8">
                    We couldn't retrieve the details for this match. It might have ended too long ago or is currently unavailable.
                </p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10"
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Heuristics for random nice placeholders if needed
    const getLogo = (teamName) => `https://ui-avatars.com/api/?name=${teamName}&background=random&color=fff&size=200`;

    return (
        <div className="min-h-screen bg-app-bg text-white font-sans overflow-x-hidden selection:bg-indigo-500/30 pb-20">

            {/* --- HERO SECTION --- */}
            <div className="relative w-full h-[65vh] max-h-[700px] flex flex-col group">

                {/* Background Ambient Layers */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 via-app-bg/80 to-app-bg z-10"></div>

                {/* Dynamic Background Colors based on pseudo-random */}
                <div className="absolute inset-0 flex opacity-60">
                    <div className="w-1/2 bg-blue-600/20 blur-[150px] translate-y-[-20%]"></div>
                    <div className="w-1/2 bg-red-600/20 blur-[150px] translate-y-[-20%]"></div>
                </div>

                {/* Navbar */}
                <div className="relative z-50 p-6 md:p-10 flex justify-between items-start">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-4 bg-white/5 hover:bg-white/10 backdrop-blur-xl rounded-full transition-all group border border-white/5 hover:border-white/20"
                    >
                        <ArrowLeft size={24} className="text-zinc-300 group-hover:text-white transition-colors" />
                    </button>

                    <div className="px-5 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-xs font-bold tracking-widest text-zinc-300 uppercase shadow-lg">
                        {game.league || "Unknown League"}
                    </div>
                </div>

                {/* Scoreboard Content */}
                <div className="flex-1 z-20 flex flex-col justify-center items-center pb-20">

                    <div className="flex items-center justify-center gap-6 md:gap-20 w-full max-w-6xl px-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-6 flex-1 text-center group/team">
                            <div className="relative w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-[2rem] flex items-center justify-center p-6 shadow-2xl backdrop-blur-sm border border-white/10 transition-transform duration-500 group-hover/team:scale-105">
                                <div className="absolute inset-0 bg-blue-500/20 rounded-[2rem] blur-xl opacity-0 group-hover/team:opacity-100 transition-opacity duration-500"></div>
                                <img src={getLogo(game.teams.home)} alt={game.teams.home} className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                            </div>
                            <h2 className="text-lg md:text-3xl font-display font-bold tracking-tight text-white/90">{game.teams.home}</h2>
                        </div>

                        {/* Score Display */}
                        <div className="flex flex-col items-center mx-2 scale-90 md:scale-100">
                            <div className="text-7xl md:text-9xl font-display font-black tracking-tighter tabular-nums text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.15)] leading-none select-none">
                                {game.score.replace(':', '-')}
                            </div>

                            <div className={`mt-8 px-6 py-2 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase flex items-center gap-3 border shadow-xl backdrop-blur-md transition-all ${game.status && game.status !== 'Unknown' ? 'bg-red-500/20 text-red-100 border-red-500/30 shadow-red-500/10' : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/50'}`}>
                                {game.status && game.status !== 'Unknown' ? (
                                    <>
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                        LIVE • {game.time || "In Progress"}
                                    </>
                                ) : (
                                    <span>{game.time || "Ended"}</span>
                                )}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-6 flex-1 text-center group/team">
                            <div className="relative w-24 h-24 md:w-40 md:h-40 bg-gradient-to-br from-white/10 to-white/5 rounded-[2rem] flex items-center justify-center p-6 shadow-2xl backdrop-blur-sm border border-white/10 transition-transform duration-500 group-hover/team:scale-105">
                                <div className="absolute inset-0 bg-red-500/20 rounded-[2rem] blur-xl opacity-0 group-hover/team:opacity-100 transition-opacity duration-500"></div>
                                <img src={getLogo(game.teams.away)} alt={game.teams.away} className="relative z-10 w-full h-full object-contain drop-shadow-2xl" />
                            </div>
                            <h2 className="text-lg md:text-3xl font-display font-bold tracking-tight text-white/90">{game.teams.away}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="max-w-4xl mx-auto px-4 -mt-20 relative z-30 opacity-0 animate-slide-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                <div className="bg-card-bg backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">

                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                        <h3 className="text-2xl font-display font-bold flex items-center gap-3 text-white">
                            <BarChart2 className="text-accent" size={28} />
                            Match Insights
                        </h3>
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div> <span className="text-zinc-400">Home</span></div>
                            <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div> <span className="text-zinc-400">Away</span></div>
                        </div>
                    </div>

                    {game.stats && game.stats.length > 0 ? (
                        <div className="space-y-10">
                            {game.stats.map((stat, idx) => (
                                <StatRow key={stat.key || idx} label={stat.name} home={stat.home} away={stat.away} idx={idx} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 flex flex-col items-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                                <BarChart2 size={32} className="text-zinc-600" />
                            </div>
                            <p className="text-lg font-medium text-zinc-500">Stats are compiling...</p>
                        </div>
                    )}

                </div>
            </div>

            {/* --- LIVE TRACKER / HEATMAP SECTION --- */}
            <div className="max-w-4xl mx-auto px-4 mt-8 relative z-30 opacity-0 animate-slide-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
                <div className="bg-card-bg backdrop-blur-2xl rounded-[2.5rem] p-4 md:p-8 border border-white/10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
                    <Heatmap gameId={id} />
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, home, away, idx }) => {
    // Calculate percentage for progress bars
    const hVal = parseFloat(home);
    const aVal = parseFloat(away);
    const total = hVal + aVal;

    // Default to 50% if total is 0
    let hPercent = 50;
    let aPercent = 50;

    if (total > 0) {
        hPercent = (hVal / total) * 100;
        aPercent = (aVal / total) * 100;
    }

    return (
        <div className="group" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="flex justify-between items-end mb-3 px-1">
                <span className="text-2xl font-bold tabular-nums text-white leading-none">{home}</span>
                <span className="text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-bold pb-1">{label}</span>
                <span className="text-2xl font-bold tabular-nums text-white leading-none">{away}</span>
            </div>

            <div className="flex h-3 w-full rounded-full overflow-hidden bg-white/5 ring-1 ring-white/5 p-[2px]">
                <div
                    className="h-full rounded-l-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-1000 ease-out relative"
                    style={{ width: `${hPercent}%` }}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>
                </div>
                <div className="w-[2px] bg-transparent"></div>
                <div
                    className="h-full rounded-r-full bg-gradient-to-l from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all duration-1000 ease-out relative"
                    style={{ width: `${aPercent}%` }}
                >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20"></div>
                </div>
            </div>
        </div>
    );
};

export default GameDetails;
