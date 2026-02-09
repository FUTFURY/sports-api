import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { motion } from 'framer-motion';

const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
    { code: 'pt', label: 'Português', flag: '🇵🇹' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

const LanguageSwitcher = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                <Globe size={14} className="text-indigo-400" />
                <span>Language</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {languages.map((lang) => (
                    <motion.button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`relative flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${language === lang.code
                                ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-white border border-white/20 shadow-lg glow-primary'
                                : 'bg-white/5 text-zinc-500 border border-transparent hover:bg-white/10 hover:text-zinc-300 hover:border-white/10'
                            }`}
                    >
                        {language === lang.code && (
                            <motion.div
                                layoutId="activeLang"
                                className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="text-lg relative z-10">{lang.flag}</span>
                        <span className="truncate relative z-10 text-xs font-bold">{lang.code.toUpperCase()}</span>
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default LanguageSwitcher;
