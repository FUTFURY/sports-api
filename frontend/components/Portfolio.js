'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Portfolio({ marketId, currentMarket }) {
    const { user } = useAuth();
    const [positions, setPositions] = useState([]);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('positions'); // 'positions' or 'history'

    // Fetch initial data
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            // 1. Fetch Positions
            const { data: posData } = await supabase
                .from('positions')
                .select('*')
                .eq('user_id', user.id)
                .eq('market_id', marketId);

            if (posData) setPositions(posData);

            // 2. Fetch History
            const { data: histData } = await supabase
                .from('user_transactions')
                .select('*')
                .eq('user_id', user.id)
                .eq('market_id', marketId)
                .order('created_at', { ascending: false });

            if (histData) setHistory(histData);
        };

        fetchData();

        // Subscribe to changes (Positions only for now)
        const channel = supabase
            .channel('portfolio_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'positions', filter: `user_id=eq.${user.id}` }, () => {
                fetchData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_transactions', filter: `user_id=eq.${user.id}` }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [user, marketId]);

    // Calculate total invested
    const totalInvested = positions.reduce((sum, pos) => sum + (pos.amount * pos.average_price), 0);
    const totalValue = positions.reduce((sum, pos) => {
        const isP1 = pos.selection === 'P1' || pos.selection === '1';
        const marketPrice = isP1 ? currentMarket?.pivot_price : (100 - currentMarket?.pivot_price);
        return sum + (pos.amount * (marketPrice || 0));
    }, 0);
    const totalPnL = totalValue - totalInvested;

    if (!user) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-center">
                <p className="text-slate-500 text-sm">Sign in to view your portfolio</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            {/* STATISTICS HEADER */}
            <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 p-4 border-b border-slate-700">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Invested</div>
                        <div className="text-lg font-mono font-bold text-blue-400">${totalInvested.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Value</div>
                        <div className="text-lg font-mono font-bold text-purple-400">${totalValue.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">P&L</div>
                        <div className={`text-lg font-mono font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="flex space-x-4 border-b border-slate-800 px-4 pt-3 pb-2">
                <button
                    onClick={() => setActiveTab('positions')}
                    className={`text-xs tracking-wider uppercase font-bold pb-1 ${activeTab === 'positions' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}
                >
                    Positions ({positions.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`text-xs tracking-wider uppercase font-bold pb-1 ${activeTab === 'history' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}
                >
                    History ({history.length})
                </button>
            </div>

            {/* CONTENT */}
            <div className="p-4">
                {activeTab === 'positions' ? (
                    positions.length === 0 ? (
                        <div className="text-sm text-slate-500 text-center py-8">
                            <div className="text-4xl mb-2">📊</div>
                            <div>No active positions</div>
                            <div className="text-xs mt-1">Make a trade to start!</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {positions.map(pos => {
                                const isP1 = pos.selection === 'P1' || pos.selection === '1';
                                const playerName = isP1 ? currentMarket?.p1_name : currentMarket?.p2_name;
                                const marketPrice = isP1 ? currentMarket?.pivot_price : (100 - currentMarket?.pivot_price);
                                const invested = pos.amount * pos.average_price;
                                const currentValue = pos.amount * (marketPrice || 0);
                                const pnl = currentValue - invested;
                                const isProfit = pnl >= 0;

                                return (
                                    <div key={pos.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-base text-white">{playerName || 'Unknown'}</div>
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    {pos.amount} units @ ${Number(pos.average_price).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className={`px-2 py-1 rounded text-xs font-bold ${isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                                {pnl > 0 ? '+' : ''}${pnl.toFixed(2)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-700/50">
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase">Invested</div>
                                                <div className="text-xs font-mono text-slate-300">${invested.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase">Value</div>
                                                <div className="text-xs font-mono text-slate-300">${currentValue.toFixed(2)}</div>
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-slate-500 uppercase">Market</div>
                                                <div className="text-xs font-mono text-slate-300">{marketPrice?.toFixed(0)}¢</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                        {history.length === 0 ? (
                            <div className="text-sm text-slate-500 text-center py-8">
                                <div className="text-4xl mb-2">📜</div>
                                <div>No transactions yet</div>
                            </div>
                        ) : (
                            history.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center text-xs p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-bold px-2 py-0.5 rounded ${tx.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                {tx.type}
                                            </span>
                                            <span className="text-slate-400">{tx.selection}</span>
                                        </div>
                                        <div className="text-slate-600 text-[10px]">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-300 font-mono">{tx.amount} units</div>
                                        <div className="text-slate-500 text-[10px]">@ ${Number(tx.price).toFixed(2)}</div>
                                        <div className="text-blue-400 font-bold">${(tx.amount * tx.price).toFixed(2)}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
