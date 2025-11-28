'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MatchedUserInfo } from 'shared';

interface MatchContextType {
    matchedUser: MatchedUserInfo | null;
    setMatchedUser: (user: MatchedUserInfo) => void;
    clearMatchedUser: () => void;
    clearSessionStorage: () => void;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

const MATCH_STORAGE_KEY = 'matchInfo';

export function MatchProvider({ children }: { children: ReactNode }) {
    const [matchedUser, setMatchedUserState] = useState<MatchedUserInfo | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from sessionStorage on mount
    useEffect(() => {
        const stored = sessionStorage.getItem(MATCH_STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setMatchedUserState(parsed);
            } catch (err) {
                console.error('Error parsing stored match info:', err);
                sessionStorage.removeItem(MATCH_STORAGE_KEY);
            }
        }
        setIsInitialized(true);
    }, []);

    const setMatchedUser = (user: MatchedUserInfo) => {
        setMatchedUserState(user);
        sessionStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(user));
    };

    const clearMatchedUser = () => {
        setMatchedUserState(null);
    };

    const clearSessionStorage = () => {
        sessionStorage.removeItem(MATCH_STORAGE_KEY);
    }

    return (
        <MatchContext.Provider value={{ matchedUser, setMatchedUser, clearMatchedUser, clearSessionStorage }}>
            {isInitialized ? children : null}
        </MatchContext.Provider>
    );
}

export function useMatch() {
    const context = useContext(MatchContext);
    if (context === undefined) {
        throw new Error('useMatch must be used within a MatchProvider');
    }
    return context;
}