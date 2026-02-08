import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
    { code: 'fr', label: '🇫🇷 FR' },
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'es', label: '🇪🇸 ES' },
    { code: 'de', label: '🇩🇪 DE' },
    { code: 'it', label: '🇮🇹 IT' },
    { code: 'ru', label: '🇷🇺 RU' },
    { code: 'pt', label: '🇵🇹 PT' },
];

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex gap-2 p-2 justify-end bg-gray-900 border-b border-gray-800">
            {languages.map((lang) => (
                <button
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${language === lang.code
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                >
                    {lang.label}
                </button>
            ))}
        </div>
    );
};

export default LanguageSwitcher;
