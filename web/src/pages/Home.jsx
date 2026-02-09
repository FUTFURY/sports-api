import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSports } from '../services/api';
import { Layers, TrendingUp } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

function Home() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate dates: 2 days before, 4 days after
    const dates = [];
    for (let i = -2; i <= 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }

    useEffect(() => {
        fetchSports();
    }, [selectedDate, language]);

    const fetchSports = async () => {
        setLoading(true);
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        let from = Math.floor(start.getTime() / 1000);
        from = from - (from % 300);

        let to = Math.floor(end.getTime() / 1000);
        to = to - (to % 300);

        const data = await getSports(from, to, language);
        setSports(data);
        setLoading(false);
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth();
    };

    const handleSportClick = (sport) => {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        let from = Math.floor(start.getTime() / 1000);
        from = from - (from % 300);
        let to = Math.floor(end.getTime() / 1000);
        to = to - (to % 300);

        navigate(`/leagues/${sport.id}?dateFrom=${from}&dateTo=${to}&sportName=${encodeURIComponent(sport.name)}`);
    };

    return (
        <div className="font-sans pb-40 overflow-x-hidden">
            {/* Immersive Hero Section */}
            <div className="relative w-full h-[60vh] min-h-[500px] flex flex-col justify-end p-8 md:p-16 lg:p-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 via-purple-900/20 to-app-bg z-0" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=2805&auto=format&fit=crop')] bg-cover bg-center opacity-30 z-[-1]" />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-app-bg/60 to-transparent z-0" />

                <div className="relative z-10 max-w-4xl space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-sm font-medium text-blue-200 shadow-lg"
                    >
                        <TrendingUp size={16} />
                        <span className="uppercase tracking-widest text-xs font-bold">Live Sports Hub</span>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tight text-white leading-[0.9]"
                    >
                        Experience the <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Thrill of Victory.</span>
                    </motion.h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="pt-6 w-full max-w-lg"
                    >
                        <SearchBar placeholder="Search for matches, teams, or leagues..." />
                    </motion.div>
                </div>
            </div>

            <div className="px-6 md:px-12 lg:px-24 -mt-20 relative z-20 space-y-16">

                {/* Date Shelf */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-xl font-display font-medium text-white/90">Match Day</h2>
                        <div className="text-sm text-zinc-500 font-medium">{selectedDate.toLocaleDateString(language, { month: 'long', year: 'numeric' })}</div>
                    </div>

                    <div className="flex overflow-x-auto pb-4 -mx-2 px-2 gap-4 no-scrollbar items-center mask-image-gradient">
                        {dates.map((date, index) => {
                            const active = isSameDay(date, selectedDate);
                            return (
                                <motion.button
                                    key={date.toISOString()}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.05 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(date)}
                                    className={`relative flex flex-col items-center justify-center min-w-[80px] h-[90px] rounded-2xl transition-all duration-300 border backdrop-blur-md ${active
                                        ? 'bg-white/10 text-white border-white/20 shadow-[0_0_30px_rgba(255,255,255,0.1)]'
                                        : 'bg-white/5 text-zinc-400 border-white/5 hover:bg-white/10 hover:border-white/10'
                                        }`}
                                >
                                    {active && (
                                        <motion.div
                                            layoutId="activeDate"
                                            className="absolute inset-0 bg-white/5 rounded-2xl border border-white/10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-60 z-10">
                                        {date.toLocaleDateString(language, { weekday: 'short' })}
                                    </span>
                                    <span className="text-3xl font-display font-bold z-10 tracking-tighter">
                                        {date.getDate()}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* Sports Shelf */}
                <div className="space-y-6">
                    <h2 className="text-xl font-display font-medium text-white/90 px-2">Featured Sports</h2>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-50">
                            <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase">Loading Sports...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {sports.map((sport, index) => (
                                <motion.div
                                    key={sport.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + index * 0.05 }}
                                    onClick={() => handleSportClick(sport)}
                                    whileHover={{ y: -5 }}
                                    className="group relative h-72 rounded-[2rem] overflow-hidden cursor-pointer shadow-lg"
                                >
                                    {/* Glass Background */}
                                    <div className="absolute inset-0 bg-card-bg backdrop-blur-2xl border border-white/5 group-hover:border-white/20 transition-all duration-300"></div>

                                    {/* Gradient Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                            className="w-20 h-20 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-2xl ring-1 ring-white/10 backdrop-blur-md group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-shadow duration-500"
                                        >
                                            <Layers className="text-zinc-400 group-hover:text-white transition-colors duration-300" size={36} />
                                        </motion.div>
                                        <h3 className="text-xl font-display font-bold text-white group-hover:text-blue-100 transition-colors">{sport.name}</h3>
                                        <div className="mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">View Leagues</span>
                                        </div>
                                    </div>

                                    {/* Hover Glow Effect */}
                                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-[60px] group-hover:bg-indigo-500/30 transition-colors duration-500 pointer-events-none"></div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Home;
