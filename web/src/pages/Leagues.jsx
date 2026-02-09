import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getLeagues } from '../services/api';
import { ChevronLeft, Trophy } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

function Leagues() {
    const { sportId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sportName = searchParams.get('sportName') || 'Leagues';

    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            setLoading(true);
            const data = await getLeagues(sportId, dateFrom, dateTo, language);
            setLeagues(data);
            setLoading(false);
        };
        fetchLeagues();
    }, [sportId, dateFrom, dateTo, language]);

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
                        {sportName}
                    </motion.h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-4"></div>
                    <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">Loading Leagues...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leagues.length === 0 ? (
                        <div className="col-span-full text-center text-zinc-500 mt-20 text-lg">No leagues found.</div>
                    ) : (
                        leagues.map((league, index) => (
                            <motion.div
                                key={league.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/games/${league.id}?dateFrom=${dateFrom}&dateTo=${dateTo}&leagueName=${encodeURIComponent(league.name)}`)}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative bg-card-bg backdrop-blur-xl rounded-3xl p-5 flex items-center justify-between cursor-pointer border border-white/5 hover:border-white/20 hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl" />

                                <div className="flex items-center gap-5 overflow-hidden relative z-10">
                                    <div className="w-14 h-14 shrink-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/5 shadow-lg group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
                                        <Trophy className="w-6 h-6 text-zinc-400 group-hover:text-yellow-400 transition-colors duration-300" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-display font-bold text-lg text-white group-hover:text-blue-100 truncate transition-colors duration-300 leading-tight">
                                            {league.name}
                                        </span>
                                        <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                                            International
                                        </span>
                                    </div>
                                </div>

                                <div className="relative z-10 ml-4 flex flex-col items-end">
                                    <div className="bg-white/5 px-3 py-1.5 rounded-lg text-sm font-bold text-white border border-white/5 group-hover:border-white/20 group-hover:bg-white/10 transition-all shadow-sm">
                                        {league.count}
                                    </div>
                                    <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-1 group-hover:text-zinc-500 transition-colors">Matches</span>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Leagues;
