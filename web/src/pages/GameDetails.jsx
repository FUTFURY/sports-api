
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGameStats } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { ArrowLeft, Play, Calendar, Trophy, BarChart2 } from 'lucide-react';

const GameDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [game, setGame] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            const data = await getGameStats(id, language);
            setGame(data);
            setLoading(false);
        };

        fetchDetails();
        // Refresh every 30s
        const interval = setInterval(fetchDetails, 30000);
        return () => clearInterval(interval);
    }, [id, language]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-zinc-400">Loading Game Details...</p>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
                <p className="text-xl mb-4">Game not found</p>
                <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300">
                    Go Back
                </button>
            </div>
        );
    }

    // Heuristics for image placeholders if logos not provided in this endpoint
    // (Search endpoint provides them, but getGameZip might not always)
    const getLogo = (teamName) => `https://ui-avatars.com/api/?name=${teamName}&background=random&color=fff&size=128`;

    return (
        <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-indigo-500/30 pb-20">

            {/* --- HERO SECTION --- */}
            <div className="relative w-full h-[60vh] max-h-[600px] overflow-hidden">
                {/* Background Blur */}
                <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-zinc-950/80 to-zinc-950 z-10"></div>
                <div className="absolute inset-0 flex">
                    <div className="w-1/2 bg-blue-900/20 blur-[100px]"></div>
                    <div className="w-1/2 bg-red-900/20 blur-[100px]"></div>
                </div>

                {/* Navbar (Transparent) */}
                <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all group"
                    >
                        <ArrowLeft size={24} className="text-white group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="text-xs font-bold tracking-widest text-zinc-400 uppercase bg-white/5 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
                        {game.league}
                    </div>
                </div>

                {/* Scoreboard Content */}
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center pt-10">

                    <div className="flex items-center justify-center gap-8 md:gap-20 w-full max-w-4xl px-4">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-4 flex-1 text-center">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-2xl flex items-center justify-center p-4 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                                <img src={getLogo(game.teams.home)} alt={game.teams.home} className="max-w-full max-h-full object-contain drop-shadow-md" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white">{game.teams.home}</h2>
                        </div>

                        {/* Score */}
                        <div className="flex flex-col items-center">
                            <div className="text-6xl md:text-8xl font-black tracking-tighter tabular-nums bg-clip-text text-transparent bg-gradient-to-br from-white to-zinc-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                                {game.score.replace(':', '-')}
                            </div>
                            <div className={`mt-4 px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-2 ${game.id ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-800 text-zinc-400'}`}>
                                {game.id ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                        </span>
                                        LIVE • {game.time || "In Progress"}
                                    </>
                                ) : (
                                    <span>{game.time || "Ended"}</span>
                                )}
                            </div>
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-4 flex-1 text-center">
                            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/5 rounded-2xl flex items-center justify-center p-4 shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
                                <img src={getLogo(game.teams.away)} alt={game.teams.away} className="max-w-full max-h-full object-contain drop-shadow-md" />
                            </div>
                            <h2 className="text-xl md:text-3xl font-bold tracking-tight text-white">{game.teams.away}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STATS SECTION --- */}
            <div className="max-w-3xl mx-auto px-4 -mt-10 relative z-30">
                <div className="bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/5 shadow-2xl">

                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <BarChart2 className="text-indigo-400" size={24} />
                            Match Stats
                        </h3>
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div> <span className="text-xs text-zinc-400">Home</span>
                            <div className="h-2 w-2 rounded-full bg-red-500"></div> <span className="text-xs text-zinc-400">Away</span>
                        </div>
                    </div>

                    {game.stats && game.stats.length > 0 ? (
                        <div className="space-y-8">
                            {game.stats.map((stat, idx) => (
                                <StatRow key={stat.key || idx} label={stat.name} home={stat.home} away={stat.away} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-zinc-500">
                            <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                            <p>No detailed stats available for this match.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const StatRow = ({ label, home, away }) => {
    // Calculate percentage for progress bars
    const hVal = parseFloat(home);
    const aVal = parseFloat(away);
    const total = hVal + aVal;

    // Default to 50% if total is 0 to avoid NaN
    const hPercent = total === 0 ? 50 : (hVal / total) * 100;
    const aPercent = total === 0 ? 50 : (aVal / total) * 100;

    return (
        <div className="group">
            <div className="flex justify-between text-sm font-semibold mb-2 px-1">
                <span className="text-white tabular-nums">{home}</span>
                <span className="text-zinc-400 uppercase text-xs tracking-wider">{label}</span>
                <span className="text-white tabular-nums">{away}</span>
            </div>

            <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-zinc-800">
                <div
                    className="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${hPercent}%` }}
                ></div>
                <div className="w-[2px] bg-zinc-950"></div>
                <div
                    className="bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] transition-all duration-1000 ease-out"
                    style={{ width: `${aPercent}%` }}
                ></div>
            </div>
        </div>
    );
};

export default GameDetails;
