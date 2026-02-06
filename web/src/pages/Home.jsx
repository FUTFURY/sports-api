import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSports } from '../services/api';
import { Layers } from 'lucide-react';
import SearchBar from '../components/SearchBar';

function Home() {
    const navigate = useNavigate();
    const [sports, setSports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate dates: 2 days before, 4 days after
    const dates = [];
    for (let i = -2; i <= 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d);
    }

    useEffect(() => {
        fetchSports();
    }, [selectedDate]);

    const fetchSports = async () => {
        setLoading(true);
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        let from = Math.floor(start.getTime() / 1000);
        from = from - (from % 300);

        let to = Math.floor(end.getTime() / 1000);
        to = to - (to % 300);

        const data = await getSports(from, to);
        setSports(data);
        setLoading(false);
    };

    const isSameDay = (d1, d2) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth();
    };

    const handleSportClick = (sport) => {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        let from = Math.floor(start.getTime() / 1000);
        from = from - (from % 300);
        let to = Math.floor(end.getTime() / 1000);
        to = to - (to % 300);

        navigate(`/leagues/${sport.id}?dateFrom=${from}&dateTo=${to}&sportName=${encodeURIComponent(sport.name)}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 font-sans">
            <header className="flex flex-col gap-4 mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                        Sports Fury
                    </h1>
                    <button onClick={fetchSports} className="p-2 bg-white rounded-full hover:bg-gray-100 shadow-sm transition border border-gray-200">
                        🔄
                    </button>
                </div>
                <SearchBar />
            </header>

            <div className="flex overflow-x-auto pb-4 mb-4 gap-3 no-scrollbar">
                {dates.map((date) => (
                    <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={`flex flex-col items-center justify-center min-w-[60px] h-20 rounded-2xl border transition-all ${isSameDay(date, selectedDate)
                            ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-md'
                            : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300 shadow-sm'
                            }`}
                    >
                        <span className="text-xs font-bold uppercase">
                            {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        <span className="text-xl font-bold">
                            {date.getDate()}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center mt-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-teal-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {sports.length === 0 ? (
                        <div className="col-span-2 text-center text-gray-500 mt-10">
                            No sports active for this date.
                        </div>
                    ) : (
                        sports.map((sport) => (
                            <div
                                key={sport.id}
                                onClick={() => handleSportClick(sport)}
                                className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 active:scale-95 transition-transform cursor-pointer hover:shadow-md border border-gray-100 shadow-sm"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                                    <Layers className="text-teal-600" />
                                </div>
                                <span className="font-semibold text-center text-sm text-gray-800">{sport.name}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

export default Home;
