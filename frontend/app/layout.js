import "./globals.css";
import { AuthProvider } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export const metadata = {
    title: "SportsTrade",
    description: "Live Sports Trading Platform",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <head>
                {/* Fonts can be loaded here if needed, or via next/font/google if properly configured */}
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
