import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getGames, getLiveGames } from '../services/api';
import { ChevronLeft } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import Heatmap from '../components/Heatmap';
import { useLanguage } from '../contexts/LanguageContext';

function Games() {
    const { champId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();

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
            let data = [];
            if (champId === 'live') {
                data = await getLiveGames(language);
            } else {
                data = await getGames(champId, dateFrom, dateTo, language);
            }
            setGames(data);
            setLoading(false);
        };
        fetchGames();
    }, [champId, dateFrom, dateTo, language]);

    return (
        <div className="font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-gray-700 shadow-sm text-gray-200">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-lg font-bold truncate pr-4 text-gray-100">{leagueName}</h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">No games found.</div>
                    ) : (
                        games.map((game) => (
                            <div
                                key={game.id}
                                className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-sm transition-transform hover:shadow-lg hover:border-blue-500/30"
                            >
                                <div className="flex justify-between items-center mb-3 text-sm text-gray-400 font-medium">
                                    <span>Match</span>
                                    <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                                        {game.score || "VS"}
                                    </span>
                                </div>

                                {/* Clickable Area to Toggle Heatmap */}
                                <div
                                    className="cursor-pointer"
                                    onClick={() => setExpandedGameId(expandedGameId === game.id ? null : game.id)}
                                >
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                                            <span className="font-semibold text-lg text-gray-200">{game.teams?.home || "Home Team"}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors">
                                            <span className="font-semibold text-lg text-gray-200">{game.teams?.away || "Away Team"}</span>
                                        </div>
                                    </div>

                                    {/* Hint Text */}
                                    <div className="mt-2 text-center text-xs text-blue-400 font-medium">
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
                                    <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 flex flex-wrap gap-2">
                                        {game.stats.slice(0, 4).map((s, i) => (
                                            <span key={i} className="bg-gray-800 px-2 py-1 rounded border border-gray-700 font-medium text-gray-400">
                                                {s.label}: {s.score || s.value}
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
