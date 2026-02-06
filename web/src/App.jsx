import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Leagues from './pages/Leagues';
import Games from './pages/Games';
import Search from './pages/Search';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/leagues/:sportId" element={<Leagues />} />
                <Route path="/games/:champId" element={<Games />} />
                <Route path="/search" element={<Search />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
