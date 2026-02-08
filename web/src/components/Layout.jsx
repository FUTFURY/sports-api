import React from 'react';
import LanguageSwitcher from './LanguageSwitcher';
import { Link } from 'react-router-dom';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-black text-white font-sans">
            <header className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-gray-800">
                <LanguageSwitcher />
                <div className="p-4 flex items-center justify-between max-w-7xl mx-auto w-full">
                    <Link to="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        Sports Data
                    </Link>
                </div>
            </header>
            <main className="max-w-7xl mx-auto p-4 w-full">
                {children}
            </main>
        </div>
    );
};

export default Layout;
