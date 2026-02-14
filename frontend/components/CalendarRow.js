
import { useState, useEffect, useRef } from 'react';

export default function CalendarRow({ onSelectDate }) {
    const scrollRef = useRef(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [dates, setDates] = useState([]);

    useEffect(() => {
        // Generate dates: 2 days back, today, 7 days forward
        const list = [];
        const today = new Date();

        for (let i = -2; i <= 7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            list.push({
                date: d.toISOString().split('T')[0],
                dayName: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
                dayNum: d.getDate(),
                isToday: i === 0
            });
        }
        setDates(list);
    }, []);

    // Scroll to today on load
    useEffect(() => {
        if (scrollRef.current) {
            // Simple center logic or just scroll slightly
            scrollRef.current.scrollLeft = 100;
        }
    }, [dates]);

    const handleSelect = (date) => {
        setSelectedDate(date);
        onSelectDate(date);
    };

    return (
        <div className="w-full overflow-x-auto no-scrollbar py-4 px-2 bg-[#1c1c1e] border-b border-gray-800">
            <div ref={scrollRef} className="flex space-x-4 min-w-max px-2">
                {dates.map((item) => (
                    <button
                        key={item.date}
                        onClick={() => handleSelect(item.date)}
                        className={`flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-200 ${selectedDate === item.date
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                                : 'bg-[#2c2c2e] text-gray-400 hover:bg-[#3a3a3c]'
                            }`}
                    >
                        <span className="text-xs font-medium uppercase">{item.dayName}</span>
                        <span className="text-xl font-bold">{item.dayNum}</span>
                        {item.isToday && (
                            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
