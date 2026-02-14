
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function OrderBook({ marketId }) {
    const [bids, setBids] = useState([]);
    const [asks, setAsks] = useState([]);

    const fetchOrders = async () => {
        if (!marketId) return;

        const { data } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', marketId)
            .eq('status', 'OPEN')
            .order('price', { ascending: false }); // High to Low for easy sorting

        if (data) processOrders(data);
    };

    const processOrders = (orders) => {
        const buyOrders = orders.filter(o => o.side === 'BUY').sort((a, b) => b.price - a.price); // Highest Bid first
        const sellOrders = orders.filter(o => o.side === 'SELL').sort((a, b) => a.price - b.price); // Lowest Ask first

        setBids(buyOrders);
        setAsks(sellOrders);
    };

    useEffect(() => {
        fetchOrders();

        const channel = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                // Simple strategy: Re-fetch all on any change for prototype simplicity
                // In prod, would splice delta.
                fetchOrders();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [marketId]);

    return (
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="p-3 border-b border-slate-700 bg-slate-800">
                <h3 className="font-semibold text-slate-200">Order Book</h3>
            </div>

            <div className="grid grid-cols-2 text-xs font-mono text-slate-500 p-2 border-b border-slate-800">
                <span>SIZE</span>
                <span className="text-right">PRICE</span>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col">
                {/* ASKS (Sells) - Red - Render in Reverse to show Lowest Ask at bottom near 'spread' */}
                <div className="flex flex-col-reverse justify-end flex-1 pb-1">
                    {asks.map(ask => (
                        <div key={ask.id} className="grid grid-cols-2 px-2 py-0.5 hover:bg-slate-800 cursor-pointer">
                            <span className="text-red-300">{ask.amount - ask.filled_amount}</span>
                            <span className="text-right text-red-400 font-bold">{ask.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="border-t border-b border-slate-700 py-1 text-center text-xs text-slate-500 bg-slate-950">
                    SPREAD: {(asks.length && bids.length) ? (asks[0].price - bids[0].price).toFixed(2) : '-'}
                </div>

                {/* BIDS (Buys) - Green - High Bids at top */}
                <div className="flex flex-col pt-1">
                    {bids.map(bid => (
                        <div key={bid.id} className="grid grid-cols-2 px-2 py-0.5 hover:bg-slate-800 cursor-pointer">
                            <span className="text-green-300">{bid.amount - bid.filled_amount}</span>
                            <span className="text-right text-green-400 font-bold">{bid.price.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
