import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { getLeagues } from '../services/api';
import { ChevronLeft, Trophy } from 'lucide-react';
import SearchBar from '../components/SearchBar';

function Leagues() {
    const { sportId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sportName = searchParams.get('sportName') || 'Leagues';

    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeagues = async () => {
            setLoading(true);
            const data = await getLeagues(sportId, dateFrom, dateTo);
            setLeagues(data);
            setLoading(false);
        };
        fetchLeagues();
    }, [sportId, dateFrom, dateTo]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
            <header className="flex flex-col gap-4 mb-6 sticky top-0 bg-gray-50/90 backdrop-blur-md py-4 z-10 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full hover:bg-gray-100 border border-gray-200 shadow-sm">
                        <ChevronLeft className="text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold truncate text-gray-800">{sportName}</h1>
                </div>
                <SearchBar />
            </header>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
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
                                className="bg-white p-4 rounded-xl flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer hover:shadow-md border border-gray-200 shadow-sm"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {league.logo ? (
                                        <img src={`https://imaginary-proxy.com/${league.logo}`} alt="logo" className="w-8 h-8 object-contain" onError={(e) => e.target.style.display = 'none'} />
                                    ) : (
                                        <Trophy className="w-6 h-6 text-teal-500" />
                                    )}
                                    <span className="font-medium truncate text-gray-800">{league.name}</span>
                                </div>
                                <div className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold text-gray-500 border border-gray-200">
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
