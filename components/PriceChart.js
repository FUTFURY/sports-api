'use client';

import { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries } from 'lightweight-charts';
import { supabase } from '@/lib/supabase';

export default function PriceChart({ marketId }) {
    const chartContainerRef = useRef();
    const [latestPrice, setLatestPrice] = useState(50); // Default 50
    const [chartLoaded, setChartLoaded] = useState(false);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: 'solid', color: '#0f172a' }, // slate-900
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            // Responsive sizing handling
            width: chartContainerRef.current.clientWidth,
            height: 300,
        });

        // v5 API: use addSeries instead of addLineSeries
        const lineSeries = chart.addSeries(LineSeries, {
            color: '#22c55e', // Green for Yes/P1
            lineWidth: 2,
            title: 'Yes (P1)',
        });

        const lineSeries2 = chart.addSeries(LineSeries, {
            color: '#ef4444', // Red for No/P2 (Inverse)
            lineWidth: 2,
            title: 'No (P2)',
            lineStyle: 2 // Dashed
        });

        // Handle Resize
        const handleResize = () => {
            chart.applyOptions({ width: chartContainerRef.current.clientWidth });
        };
        window.addEventListener('resize', handleResize);

        // Initial fetch of current state & history
        const fetchData = async () => {
            const { data } = await supabase
                .from('market_history')
                .select('*')
                .eq('market_id', marketId)
                .order('created_at', { ascending: true })
                .limit(500); // Limit to last 500 points for performance

            if (data && data.length > 0) {
                const history = data.map(d => ({
                    time: Math.floor(new Date(d.created_at).getTime() / 1000),
                    value: d.price
                }));

                // Inverse history for P2
                const history2 = data.map(d => ({
                    time: Math.floor(new Date(d.created_at).getTime() / 1000),
                    value: 100 - d.price
                }));

                // Sort by unique time just in case
                const uniqueHistory = [];
                const uniqueHistory2 = [];
                const seenTimes = new Set();

                history.forEach((item, i) => {
                    if (!seenTimes.has(item.time)) {
                        seenTimes.add(item.time);
                        uniqueHistory.push(item);
                        uniqueHistory2.push(history2[i]);
                    }
                });

                lineSeries.setData(uniqueHistory);
                lineSeries2.setData(uniqueHistory2);

                // Set latest price from last history item
                if (uniqueHistory.length > 0) {
                    setLatestPrice(uniqueHistory[uniqueHistory.length - 1].value);
                }
            }
        };
        fetchData();

        // Subscribe to Realtime Updates (Trades & Engine Updates)
        const channel = supabase
            .channel('public:market_history')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_history', filter: `market_id=eq.${marketId}` }, (payload) => {
                const newPoint = payload.new;
                if (newPoint.price) {
                    const time = Math.floor(new Date(newPoint.created_at).getTime() / 1000);
                    lineSeries.update({
                        time: time,
                        value: newPoint.price
                    });
                    lineSeries2.update({
                        time: time,
                        value: 100 - newPoint.price
                    });
                    setLatestPrice(newPoint.price);
                }
            })
            .subscribe();

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            supabase.removeChannel(channel);
        };
    }, [marketId]);

    return (
        <div className="relative w-full h-[450px] bg-[#1e1e1e] rounded-xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col">

            {/* CHART HEADER OVERLAY */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10 bg-gradient-to-b from-[#1e1e1e] to-transparent pointer-events-none">
                {/* Left: Stats */}
                <div className="pointer-events-auto">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="text-3xl font-bold text-white">Yes {latestPrice}%</div>
                        <div className="text-sm font-bold text-green-500 flex items-center">
                            ▲ 2.5%
                        </div>
                    </div>
                    <div className="text-xs text-gray-500 font-medium tracking-wide">
                        CHANCE OF WINNING
                    </div>
                </div>

                {/* Right: Time Controls */}
                <div className="flex gap-1 bg-[#2a2a2a] p-1 rounded-lg pointer-events-auto">
                    {['1H', '1D', '1W', '1M', 'ALL'].map(range => (
                        <button
                            key={range}
                            className={`px-3 py-1 text-xs font-bold rounded hover:bg-[#333] transition-colors ${range === 'ALL' ? 'text-white bg-[#333]' : 'text-gray-500'}`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* CHART CONTAINER */}
            <div ref={chartContainerRef} className="flex-1 w-full mt-4" /> {/* Added mt-4 to push chart down slightly */}
        </div>
    );
}
