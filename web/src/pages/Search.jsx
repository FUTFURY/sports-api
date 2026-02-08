import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchEvents } from '../services/api';
import { ChevronLeft, Trophy, Calendar, Gamepad2 } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../contexts/LanguageContext';

function SearchPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();
    const query = searchParams.get('text') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.length < 2) return;
            setLoading(true);
            const data = await searchEvents(query, language);
            setResults(data);
            setLoading(false);
        };
        fetchResults();
    }, [query, language]);

    // Group results by type
    const teams = results.filter(r => r.type === 'Team');
    const leagues = results.filter(r => r.type === 'League');
    const games = results.filter(r => r.type === 'Game');

    const formatDate = (ts) => {
        if (!ts) return "";
        return new Date(ts * 1000).toLocaleString(language, {
            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-gray-700 shadow-sm text-gray-200">
                        <ChevronLeft />
                    </button>
                    <div className="flex-1">
                        <SearchBar placeholder="Search again..." />
                    </div>
                </div>
                <h1 className="text-xl font-bold ml-1 text-gray-200">
                    Results for "{query}"
                </h1>
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-8 pb-10">
                    {results.length === 0 && !loading && (
                        <div className="text-center text-gray-500 mt-10">
                            No results found for "{query}".
                        </div>
                    )}

                    {teams.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-400">
                                <Trophy className="w-5 h-5 text-blue-500" /> Teams
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {teams.map(t => (
                                    <div
                                        key={t.id}
                                        className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-sm flex items-center gap-3"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400 border border-gray-700">
                                            {t.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm line-clamp-1 text-gray-200">{t.name}</div>
                                            <div className="text-xs text-gray-500">{t.sportName}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {leagues.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-400">
                                <Trophy className="w-5 h-5 text-blue-500" /> Leagues
                            </h2>
                            <div className="grid gap-3">
                                {leagues.map(l => (
                                    <div
                                        key={l.id}
                                        onClick={() => navigate(`/games/${l.id}?leagueName=${encodeURIComponent(l.name)}`)}
                                        className="bg-gray-900 p-4 rounded-xl flex items-center gap-3 border border-gray-800 shadow-sm cursor-pointer hover:shadow-lg hover:border-blue-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex-1">
                                            <div className="font-semibold text-gray-200">{l.name}</div>
                                            <div className="text-xs text-gray-500">{l.sportName} • {l.count} games</div>
                                        </div>
                                        <div className="text-gray-600">
                                            <Gamepad2 className="w-5 h-5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {games.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-400">
                                <Gamepad2 className="w-5 h-5 text-blue-500" /> Games
                            </h2>
                            <div className="grid gap-3">
                                {games.map(g => (
                                    <div
                                        key={g.id}
                                        onClick={() => {
                                            const start = g.startTime;
                                            const from = start ? start - 86400 : "";
                                            const to = start ? start + 86400 : "";
                                            navigate(`/games/${g.leagueId}?leagueName=${encodeURIComponent(g.leagueName)}&gameId=${g.id}&dateFrom=${from}&dateTo=${to}`);
                                        }}
                                        className="bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-sm cursor-pointer hover:shadow-lg hover:border-blue-500/30 transition-all active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                                                {g.sportName}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(g.startTime)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 my-3">
                                            <div className="flex-1 text-right font-medium text-gray-300">{g.team1}</div>
                                            <div className="font-bold text-lg bg-gray-800 px-3 py-1 rounded-lg tabular-nums text-gray-100 border border-gray-700">
                                                {g.score || "VS"}
                                            </div>
                                            <div className="flex-1 text-left font-medium text-gray-300">{g.team2}</div>
                                        </div>

                                        <div className="text-xs text-center text-gray-600 border-t border-gray-800 pt-2 mt-2">
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
