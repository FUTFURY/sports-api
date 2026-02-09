import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchEvents } from '../services/api';
import { ChevronLeft, Trophy, Calendar, Gamepad2, Info } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const query = searchParams.get('text') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) return;
            setLoading(true);
            const data = await searchEvents(query, language);
            setResults(data);
            setLoading(false);
        };
        fetchResults();
    }, [query, language]);

    // Group results by type
    const teams = results.filter(r => r.type === 'Team');
    const leagues = results.filter(r => r.type === 'League');
    const games = results.filter(r => r.type === 'Game');

    const formatDate = (ts) => {
        if (!ts) return "";
        return new Date(ts * 1000).toLocaleString(language, {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

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
                    <div className="flex-1">
                        <SearchBar placeholder="Search again..." />
                    </div>
                </div>
                <h1 className="text-2xl font-display font-medium text-zinc-400 ml-1">
                    Results for <span className="text-white font-bold">"{query}"</span>
                </h1>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">Searching...</p>
                </div>
            ) : (
                <div className="space-y-10 pb-10">
                    {results.length === 0 && !loading && (
                        <div className="text-center text-zinc-500 mt-20 text-lg">
                            No results found for "{query}".
                        </div>
                    )}

                    {teams.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-400 uppercase tracking-wider text-xs">
                                <Trophy className="w-4 h-4 text-blue-500" /> Teams ({teams.length})
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {teams.map(t => (
                                    <div
                                        key={t.id}
                                        className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center text-lg font-bold text-zinc-500 border border-white/5 shadow-inner">
                                            {t.name.substring(0, 1)}
                                        </div>
                                        <div className="overflow-hidden">
                                            <div className="font-bold text-base text-white truncate">{t.name}</div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{t.sportName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {leagues.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-400 uppercase tracking-wider text-xs">
                                <Trophy className="w-4 h-4 text-purple-500" /> Leagues ({leagues.length})
                            </h2>
                            <div className="grid gap-3">
                                {leagues.map(l => (
                                    <div
                                        key={l.id}
                                        onClick={() => navigate(`/games/${l.id}?leagueName=${encodeURIComponent(l.name)}`)}
                                        className="bg-white/5 p-4 rounded-2xl flex items-center gap-4 border border-white/5 cursor-pointer hover:bg-white/10 hover:border-white/10 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                    >
                                        <div className="flex-1">
                                            <div className="font-bold text-lg text-white mb-1">{l.name}</div>
                                            <div className="text-xs text-zinc-500 font-medium">{l.sportName} • {l.count} games</div>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400">
                                            <Gamepad2 className="w-4 h-4" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {games.length > 0 && (
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-zinc-400 uppercase tracking-wider text-xs">
                                <Gamepad2 className="w-4 h-4 text-green-500" /> Games ({games.length})
                            </h2>
                            <div className="grid gap-4">
                                {games.map(g => (
                                    <div
                                        key={g.id}
                                        onClick={() => {
                                            const start = g.startTime;
                                            const from = start ? start - 86400 : "";
                                            const to = start ? start + 86400 : "";
                                            navigate(`/games/${g.leagueId}?leagueName=${encodeURIComponent(g.leagueName)}&gameId=${g.id}&dateFrom=${from}&dateTo=${to}`);
                                        }}
                                        className="bg-card-bg backdrop-blur-md p-5 rounded-3xl border border-white/5 cursor-pointer hover:border-white/20 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all active:scale-[0.99]"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
                                                {g.sportName}
                                            </div>
                                            <div className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatDate(g.startTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-6 my-2">
                                            <div className="flex-1 text-right font-bold text-lg text-zinc-200 leading-tight">{g.team1}</div>
                                            <div className="font-mono font-bold text-xl bg-black/40 px-4 py-2 rounded-xl text-white border border-white/10 shadow-inner">
                                                {g.score || "VS"}
                                            </div>
                                            <div className="flex-1 text-left font-bold text-lg text-zinc-200 leading-tight">{g.team2}</div>
                                        </div>

                                        <div className="text-xs text-center text-zinc-500 border-t border-white/5 pt-3 mt-3 font-medium uppercase tracking-wide">
                                            {g.leagueName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchPage;
