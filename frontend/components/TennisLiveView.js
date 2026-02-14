'use client';

import React from 'react';

export default function TennisLiveView({ gameState, match }) {
    if (!gameState) return null;

    const { ball, lastPlayer, events, team } = gameState;

    // Map 1xBet event codes to human readable text
    const getEventLabel = (code) => {
        const codes = {
            101: 'Service',
            102: 'Ace',
            103: 'Faute',
            104: 'Double Faute',
            105: 'Point Gagné',
            106: 'Hors Limites',
            107: 'Filet',
            // Add more as discovered
        };
        return codes[code] || 'Action';
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            {/* COURT HEADER */}
            <div className="bg-slate-800/50 p-3 border-b border-slate-700 flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    {/* LIVE CHIP ANIMATION */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 border border-red-500/50 rounded-full animate-pulse">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-[10px] font-black text-red-500 tracking-wider">LIVE</span>
                    </div>
                </h3>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">
                    1xZone Realtime
                </div>
            </div>

            {/* TENNIS COURT REPRESENTATION */}
            <div className="relative aspect-[16/9] w-full bg-emerald-900/40 overflow-hidden">
                {/* The Grid / Lines */}
                <div className="absolute inset-4 border-2 border-white/30 rounded-sm">
                    <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50"></div> {/* Net */}
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-white/20"></div> {/* Service Line Horizontal */}

                    {/* Inner service boxes */}
                    <div className="absolute inset-y-[20%] left-[25%] right-[25%] border-x border-white/20"></div>
                </div>

                {/* BALL MOVEMENT */}
                {ball && (
                    <div
                        className="absolute w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)] transition-all duration-300 ease-out z-10"
                        style={{
                            left: `${ball.x * 100}%`,
                            top: `${ball.y * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-25"></div>
                    </div>
                )}

                {/* PLAYER NAMES IN COURT */}
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none">
                    <div className={`rotate-270 text-[10px] font-bold uppercase tracking-tighter ${team === 1 ? 'text-yellow-400 scale-125' : 'text-white/40'}`}>
                        {match?.p1_name || 'Player 1'}
                    </div>
                </div>
                <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
                    <div className={`rotate-90 text-[10px] font-bold uppercase tracking-tighter ${team === 2 ? 'text-yellow-400 scale-125' : 'text-white/40'}`}>
                        {match?.p2_name || 'Player 2'}
                    </div>
                </div>

                {/* RECENT EVENT OVERLAY */}
                {events && events.length > 0 && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md border border-yellow-500/50 rounded-full text-xs font-bold text-yellow-400 animate-bounce">
                        {getEventLabel(events[0].code)} - {events[0].player === 'P1' ? match?.p1_name : match?.p2_name}
                    </div>
                )}
            </div>

            {/* STATS SUMMARY BELOW COURT */}
            <div className="p-4 bg-slate-900/50 grid grid-cols-2 gap-4 border-t border-slate-800">
                <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Current Point</div>
                    <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-white">{match?.points_p1 || '0'}</span>
                        <span className="text-slate-600 font-bold">-</span>
                        <span className="text-xl font-black text-white">{match?.points_p2 || '0'}</span>
                    </div>
                </div>

                <div className="space-y-1 text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Serving</div>
                    <div className="text-sm font-bold text-yellow-500 flex justify-end items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full shadow-[0_0_5px_rgba(234,179,8,0.8)]"></div>
                        {gameState.team === 1 ? (match?.p1_name || 'P1') : (match?.p2_name || 'P2')}
                    </div>
                </div>
            </div>
        </div>
    );
}
