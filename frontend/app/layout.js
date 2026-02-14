'use client';

import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import dynamic from 'next/dynamic';

const Navbar = dynamic(() => import('../components/Navbar'), { ssr: false });

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
            </head>
            <body className="antialiased min-h-screen bg-slate-950 text-slate-50">
                <AuthProvider>
                    <Navbar />
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
