'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function Navbar() {
    const router = useRouter();
    const { user, profile, signOut, refreshProfile } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const handleLogout = async () => {
        await signOut();
        // signOut now handles redirect
    };

    const handleRefreshBalance = async () => {
        setRefreshing(true);
        await refreshProfile();
        setTimeout(() => setRefreshing(false), 500);
    };

    return (
        <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    SportsTrade
                </Link>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {/* BALANCE DISPLAY avec bouton refresh */}
                            <div className="bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Balance</span>
                                    <span className="text-lg font-mono font-bold text-emerald-400">
                                        ${profile?.balance?.toFixed(2) || '0.00'}
                                    </span>
                                </div>

                                {/* Refresh Button */}
                                <button
                                    onClick={handleRefreshBalance}
                                    disabled={refreshing}
                                    className={`p-1.5 rounded-full hover:bg-slate-700/50 transition-all ${refreshing ? 'animate-spin' : ''}`}
                                    title="Refresh balance"
                                >
                                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>

                                {/* User Avatar */}
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm font-bold ring-2 ring-blue-500/50 hover:ring-blue-400 transition-all"
                                >
                                    {user.email[0].toUpperCase()}
                                </button>
                            </div>

                            {/* LOGOUT BUTTON */}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 text-sm font-semibold rounded-lg transition-all border border-red-600/30 hover:border-red-500/50"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
