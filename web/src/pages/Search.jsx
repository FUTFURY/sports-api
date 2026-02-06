import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchEvents } from '../services/api';
import { ChevronLeft, Trophy, Calendar, Gamepad2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('text') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) return;
            setLoading(true);
            const data = await searchEvents(query);
            setResults(data);
            setLoading(false);
        };
        fetchResults();
    }, [query]);

    // Group results by type
    const leagues = results.filter(r => r.type === 'League');
    const games = results.filter(r => r.type === 'Game');

    const formatDate = (ts) => {
        if (!ts) return "";
        return new Date(ts * 1000).toLocaleString('fr-FR', {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-md py-4 z-10 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full hover:bg-gray-100 border border-gray-200 shadow-sm">
                        <ChevronLeft className="text-gray-700" />
                    </button>
                    <div className="flex-1">
                        <SearchBar placeholder="Search again..." />
                    </div>
                </div>
                <h1 className="text-xl font-bold ml-1 text-gray-800">
                    Results for "{query}"
                </h1>
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
                </div>
            ) : (
                <div className="space-y-8 pb-10">
                    {results.length === 0 && (
                        <div className="text-center text-gray-500 mt-10">
                            No results found for "{query}".
                        </div>
                    )}

                    {leagues.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-700">
                                <Trophy className="w-5 h-5 text-teal-600" /> Leagues
                            </h2>
                            <div className="grid gap-3">
                                {leagues.map(l => (
                                    <div
                                        key={l.id}
                                        onClick={() => navigate(`/games/${l.id}?leagueName=${encodeURIComponent(l.name)}`)}
                                        className="bg-white p-4 rounded-xl flex items-center gap-3 border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                                    >
                                        {l.logo ? (
                                            <img src={`https://imaginary-proxy.com/${l.logo}`} className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <Trophy className="w-8 h-8 text-gray-300" />
                                        )}
                                        <div className="flex-1">
                                            <div className="font-semibold">{l.name}</div>
                                            <div className="text-xs text-gray-500">{l.sportName} • {l.count} games</div>
                                        </div>
                                        <div className="text-gray-400">
                                            <gamepad2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {games.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-700">
                                <Gamepad2 className="w-5 h-5 text-teal-600" /> Games
                            </h2>
                            <div className="grid gap-3">
                                {games.map(g => (
                                    <div
                                        key={g.id}
                                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">
                                                {g.sportName}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(g.startTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 my-3">
                                            <div className="flex-1 text-right font-medium">{g.team1}</div>
                                            <div className="font-bold text-lg bg-gray-100 px-3 py-1 rounded-lg tabular-nums">
                                                {g.score || "VS"}
                                            </div>
                                            <div className="flex-1 text-left font-medium">{g.team2}</div>
                                        </div>

                                        <div className="text-xs text-center text-gray-400 border-t border-gray-100 pt-2 mt-2">
                                            {g.leagueName}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchPage;
