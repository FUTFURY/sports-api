import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SearchBar({ placeholder = "Search for teams, leagues, or matches..." }) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            navigate(`/search?text=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl group">
            {/* Animated Glow Effect */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isFocused ? 1 : 0 }}
                className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30"
            />

            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="w-full pl-14 pr-14 py-5 bg-white/5 border border-white/10 rounded-3xl text-white placeholder-zinc-500 transition-all outline-none focus:bg-black/60 focus:border-white/20 focus:shadow-[0_0_40px_rgba(99,102,241,0.2)] font-medium backdrop-blur-2xl text-base"
                />

                {/* Search Icon */}
                <motion.div
                    animate={{
                        scale: isFocused ? 1.1 : 1,
                        rotate: isFocused ? 5 : 0
                    }}
                    className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300 ${isFocused ? 'text-indigo-400' : 'text-zinc-500'
                        }`}
                >
                    <Search size={22} />
                </motion.div>

                {/* AI Sparkle Icon (when typing) */}
                {query && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute left-12 top-1/2 -translate-y-1/2 text-purple-400"
                    >
                        <Sparkles size={14} className="animate-pulse" />
                    </motion.div>
                )}

                {/* Clear Button */}
                {query && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        type="button"
                        onClick={() => setQuery('')}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-zinc-400 hover:text-white transition-all"
                    >
                        <X size={16} />
                    </motion.button>
                )}
            </div>

            {/* Search Hint */}
            {isFocused && !query && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-3 left-0 right-0 p-4 rounded-2xl glass-card text-sm text-zinc-400"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles size={14} className="text-purple-400" />
                        <span className="font-semibold text-white">Quick Tips</span>
                    </div>
                    <p>Try searching for "PSG", "Champions League", or "Messi"</p>
                </motion.div>
            )}
        </form>
    );
}
