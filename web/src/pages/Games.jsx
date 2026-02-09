import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getGames, getLiveGames } from '../services/api';
import { ChevronLeft, Info, Trophy, Clock, PlayCircle } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import Heatmap from '../components/Heatmap';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

function Games() {
    const { champId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();

    const [expandedGameId, setExpandedGameId] = useState(
        searchParams.get('gameId') ? parseInt(searchParams.get('gameId')) : null
    );

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const leagueName = searchParams.get('leagueName') || (champId === 'live' ? 'Live Matches' : 'Games');

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            let data = [];
            if (champId === 'live') {
                data = await getLiveGames(language);
            } else {
                data = await getGames(champId, dateFrom, dateTo, language);
            }
            setGames(data);
            setLoading(false);
        };
        fetchGames();
    }, [champId, dateFrom, dateTo, language]);

    return (
        <div className="font-sans px-4 pb-20 min-h-screen">
            <header className="flex flex-col gap-6 mb-8 mt-6 md:mt-10">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/5 backdrop-blur-sm transition-all group"
                    >
                        <ChevronLeft className="text-zinc-400 group-hover:text-white" size={24} />
                    </motion.button>
                    <motion.h1
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-3xl md:text-4xl font-display font-bold text-white tracking-tight truncate"
                    >
                        {leagueName}
                    </motion.h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">Loading Games...</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.length === 0 ? (
                        <div className="text-center text-zinc-500 mt-20 text-lg">No games found for this period.</div>
                    ) : (
                        games.map((game, index) => (
                            <motion.div
                                key={game.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group relative bg-card-bg backdrop-blur-3xl rounded-[24px] overflow-hidden border border-white/5 hover:border-white/20 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 transform hover:-translate-y-1"
                                onClick={() => navigate(`/game/${game.id}`)}
                            >
                                {/* Active Game Glow - Subtle background animation */}
                                {game.score && (
                                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                                )}

                                <div className="p-6 md:p-8 relative z-10">
                                    {/* Header: Status & Score */}
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-3">
                                            {game.score ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">Live</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-zinc-400 backdrop-blur-md">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Upcoming</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Score Badge */}
                                        <div className={`px-4 py-2 rounded-xl text-xl font-bold font-mono tracking-widest border backdrop-blur-md shadow-inner ${game.score
                                            ? 'bg-gradient-to-br from-white/10 to-white/5 border-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                                            : 'bg-black/40 border-white/5 text-zinc-600'}`}>
                                            {game.score || "VS"}
                                        </div>
                                    </div>

                                    {/* Teams Display */}
                                    <div className="flex items-center justify-between gap-8 mb-8">
                                        {/* Home Team */}
                                        <div className="flex items-center gap-4 flex-1 overflow-hidden group/team">
                                            <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-bold text-zinc-400 border border-white/5 shadow-lg group-hover/team:scale-110 transition-transform duration-300">
                                                {game.teams?.home?.substring(0, 2).toUpperCase() || "H"}
                                            </div>
                                            <span className="text-xl md:text-2xl font-display font-bold text-white tracking-tight truncate group-hover/team:text-blue-200 transition-colors">
                                                {game.teams?.home || "Home Team"}
                                            </span>
                                        </div>

                                        {/* Away Team */}
                                        <div className="flex items-center gap-4 flex-1 justify-end overflow-hidden group/team text-right">
                                            <span className="text-xl md:text-2xl font-display font-bold text-zinc-400 group-hover:text-zinc-200 tracking-tight truncate group-hover/team:text-white transition-colors">
                                                {game.teams?.away || "Away Team"}
                                            </span>
                                            <div className="relative w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-sm font-bold text-zinc-400 border border-white/5 shadow-lg group-hover/team:scale-110 transition-transform duration-300">
                                                {game.teams?.away?.substring(0, 2).toUpperCase() || "A"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="pt-5 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-xs font-bold text-blue-400 hover:text-white transition-all uppercase tracking-wider group/btn shadow-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExpandedGameId(expandedGameId === game.id ? null : game.id)
                                                }}
                                            >
                                                <PlayCircle size={14} className="group-hover/btn:scale-110 transition-transform" />
                                                <span>{expandedGameId === game.id ? "Hide Tracker" : "Live Tracker"}</span>
                                            </button>

                                            <button
                                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white transition-colors"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/game/${game.id}`);
                                                }}
                                            >
                                                <Info size={16} />
                                            </button>
                                        </div>

                                        {game.stats && game.stats.length > 0 && (
                                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                                <Trophy size={12} className="text-yellow-500/50" />
                                                Stats Ready
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedGameId === game.id && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="bg-black/40 border-t border-white/5 backdrop-blur-xl"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="p-6">
                                                <Heatmap gameId={game.id} />
                                                <div className="mt-4 flex justify-center">
                                                    <button
                                                        onClick={() => navigate(`/game/${game.id}`)}
                                                        className="text-xs text-zinc-500 hover:text-white underline underline-offset-4 decoration-zinc-700 hover:decoration-white transition-all"
                                                    >
                                                        View Full Match Details
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Games;
