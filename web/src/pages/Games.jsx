import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getGames } from '../services/api';
import { ChevronLeft } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import Heatmap from '../components/Heatmap';

function Games() {
    const { champId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [expandedGameId, setExpandedGameId] = useState(
        searchParams.get('gameId') ? parseInt(searchParams.get('gameId')) : null
    );

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const leagueName = searchParams.get('leagueName') || (champId === 'live' ? 'Live Matches' : 'Games');

    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGames = async () => {
            setLoading(true);
            const data = await getGames(champId, dateFrom, dateTo);
            setGames(data);
            setLoading(false);
        };
        fetchGames();
    }, [champId, dateFrom, dateTo]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-md py-4 z-10 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full hover:bg-gray-100 border border-gray-200 shadow-sm">
                        <ChevronLeft className="text-gray-700" />
                    </button>
                    <h1 className="text-lg font-bold truncate pr-4 text-gray-800">{leagueName}</h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">No games found.</div>
                    ) : (
                        games.map((game) => (
                            <div
                                key={game.id}
                                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm transition-transform hover:shadow-md"
                            >
                                <div className="flex justify-between items-center mb-3 text-sm text-gray-500 font-medium">
                                    <span>Match</span>
                                    <span className="text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                        {game.score || "VS"}
                                    </span>
                                </div>

                                {/* Clickable Area to Toggle Heatmap */}
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <span className="font-semibold text-lg text-gray-900">{game.teams?.home || "Home Team"}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                            <span className="font-semibold text-lg text-gray-900">{game.teams?.away || "Away Team"}</span>
                                        </div>
                                    </div>

                                    {/* Hint Text */}
                                    <div className="mt-2 text-center text-xs text-blue-500 font-medium">
                                        {expandedGameId === game.id ? "Minimize 1xZone" : "Tap to view Live 1xZone & Heatmap"}
                                    </div>
                                </div>

                                {/* Heatmap Section */}
                                {expandedGameId === game.id && (
                                    <div className="mt-4 animate-fadeIn">
                                        <Heatmap gameId={game.id} />
                                    </div>
                                )}

                                {/* Optional: Show stats count or other info */}
                                {game.stats && game.stats.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex flex-wrap gap-2">
                                        {game.stats.slice(0, 4).map((s, i) => (
                                            <span key={i} className="bg-gray-100 px-2 py-1 rounded border border-gray-200 font-medium">
                                                {s.label}: {s.value}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Games;
