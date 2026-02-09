import React, { useState } from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { Link, useLocation } from 'react-router-dom';
import { Trophy, Search, Home, Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { path: '/', icon: <Home size={20} />, label: 'Home' },
        { path: '/search', icon: <Search size={20} />, label: 'Search' },
    ];

    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex overflow-hidden relative">
            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-30%] right-[-15%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[150px] opacity-50 animate-pulse"></div>
                <div className="absolute bottom-[-30%] left-[-15%] w-[800px] h-[800px] bg-pink-600/10 rounded-full blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-[40%] left-[50%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[120px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-20 lg:w-72 h-screen fixed left-0 top-0 bg-black/60 backdrop-blur-2xl border-r border-white/10 z-50 pt-8 pb-6 transition-all duration-500">
                {/* Logo */}
                <div className="px-6 mb-12 flex items-center justify-center lg:justify-start gap-3">
                    <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl glow-primary"
                    >
                        <Zap size={24} className="text-white" fill="white" />
                    </motion.div>
                    <div className="hidden lg:block">
                        <h1 className="text-2xl font-display font-bold tracking-tight gradient-text">
                            FutFury
                        </h1>
                        <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-widest">Sports Hub</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="relative block group"
                        >
                            {isActive(item.path) && (
                                <motion.div
                                    layoutId="activeNav"
                                    className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl glow-primary border border-white/10"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <div className={`relative z-10 flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${isActive(item.path)
                                    ? 'text-white font-semibold'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                }`}>
                                <span className={`transition-all duration-300 ${isActive(item.path)
                                        ? 'scale-110 text-indigo-400'
                                        : 'group-hover:scale-110 group-hover:text-indigo-400'
                                    }`}>
                                    {item.icon}
                                </span>
                                <span className="hidden lg:block text-base">{item.label}</span>
                            </div>
                        </Link>
                    ))}
                </nav>

                {/* Language Switcher */}
                <div className="px-4 mt-auto">
                    <div className="p-5 rounded-2xl glass-card">
                        <LanguageSwitcher />
                    </div>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-2xl border-b border-white/10 z-50 px-4 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg glow-primary"
                    >
                        <Zap size={18} className="text-white" fill="white" />
                    </motion.div>
                    <div>
                        <h1 className="font-display font-bold text-lg tracking-tight gradient-text">FutFury</h1>
                    </div>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-40 md:hidden pt-24 px-6"
                    >
                        <nav className="space-y-3">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-4 p-5 rounded-2xl text-lg font-semibold transition-all ${isActive(item.path)
                                            ? 'glass-card text-white glow-primary'
                                            : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                >
                                    <span className={isActive(item.path) ? 'text-indigo-400' : ''}>
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <div className="mt-8">
                            <div className="p-5 rounded-2xl glass-card">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 md:ml-20 lg:ml-72 w-full h-screen overflow-y-auto relative custom-scrollbar">
                <div className="relative z-10 w-full min-h-screen pt-20 md:pt-0 pb-20">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
