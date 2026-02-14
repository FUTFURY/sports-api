'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        checkUser();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            } else {
                setUser(null);
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription?.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle() to gracefully handle missing rows

            if (error) {
                console.warn("Profile fetch error:", error.message);
                if (error.message.includes('not find the table')) {
                    console.error("⚠️ The 'profiles' table doesn't exist. Please run setup_auth.sql in Supabase.");
                }
                return;
            }

            if (data) {
                setProfile(data);
            } else {
                console.warn("⚠️ User has no profile. Please run fix_missing_profiles.sql in Supabase.");
                setProfile(null);
            }
        } catch (e) {
            console.error("Unexpected error fetching profile:", e);
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setProfile(null);
            // Force page reload to clear all state
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
            // Force logout anyway
            setUser(null);
            setProfile(null);
            window.location.href = '/login';
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
