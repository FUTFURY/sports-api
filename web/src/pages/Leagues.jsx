import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getLeagues } from '../services/api';
import { ChevronLeft, Trophy } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useLanguage } from '../contexts/LanguageContext';

function Leagues() {
    const { sportId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { language } = useLanguage();

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sportName = searchParams.get('sportName') || 'Leagues';

    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            setLoading(true);
            const data = await getLeagues(sportId, dateFrom, dateTo, language);
            setLeagues(data);
            setLoading(false);
        };
        fetchLeagues();
    }, [sportId, dateFrom, dateTo, language]);

    return (
        <div className="font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-10 border-b border-gray-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 border border-gray-700 shadow-sm text-gray-200">
                        <ChevronLeft />
                    </button>
                    <h1 className="text-xl font-bold truncate text-gray-100">{sportName}</h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
                </div>
            ) : (
                <div className="space-y-3">
                    {leagues.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">No leagues found.</div>
                    ) : (
                        leagues.map((league) => (
                            <div
                                key={league.id}
                                onClick={() => navigate(`/games/${league.id}?dateFrom=${dateFrom}&dateTo=${dateTo}&leagueName=${encodeURIComponent(league.name)}`)}
                                className="bg-gray-900 p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:shadow-lg border border-gray-800 hover:border-blue-500/30"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {league.logo ? (
                                        <img src={`https://imaginary-proxy.com/${league.logo}`} alt="logo" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                    ) : (
                                        <Trophy className="w-6 h-6 text-blue-500" />
                                    )}
                                    <span className="font-medium truncate text-gray-200">{league.name}</span>
                                </div>
                                <div className="bg-gray-800 px-2 py-1 rounded-md text-xs font-bold text-gray-400 border border-gray-700">
                                    {league.count}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Leagues;
