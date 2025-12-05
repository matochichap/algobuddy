'use client';
import Spinner from '@/components/Spinner';
import { useRouter } from 'next/navigation';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
    isLoading: boolean;
    accessToken: string | null;
    logout: () => Promise<void>;
    refreshAccessToken: () => Promise<string | null>;
    authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const router = useRouter();

    const logout = useCallback(async (): Promise<void> => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAccessToken(null);
        }
    }, []);

    const refreshAccessToken = useCallback(async (): Promise<string | null> => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_BASE_URL}/api/auth/refresh`, {
                method: 'POST',
                credentials: 'include',
            });

            if (response.status === 401) {
                setAccessToken(null);
                return null;
            }

            if (response.ok) {
                const data = await response.json();
                setAccessToken(data.accessToken);
                return data.accessToken;
            }
            return null;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return null;
        }
    }, []);

    const authFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
        };

        const fetchWithToken = async (accessToken: string) => {
            headers['Authorization'] = `Bearer ${accessToken}`;
            const response = await fetch(url, {
                ...options,
                headers,
            });
            return response;
        }

        let response;

        if (accessToken) {
            response = await fetchWithToken(accessToken);
            if (response.status === 401) {
                const newToken = await refreshAccessToken();
                if (newToken) {
                    setAccessToken(newToken);
                    response = await fetchWithToken(newToken);
                }
            }
        } else {
            response = await fetch(url, options);
        }

        return response;
    }, [accessToken, refreshAccessToken]);

    useEffect(() => {
        if (!accessToken && !isLoading) {
            // Redirect to login page
            router.push('/auth/login');
        }
    }, [accessToken, isLoading, router]);

    useEffect(() => {
        const initAuth = async () => {
            // Check for tokens in URL
            if (typeof window !== 'undefined') {
                const params = new URLSearchParams(window.location.search);
                const userId = params.get('userId');
                const refreshToken = params.get('refreshToken');

                if (userId && refreshToken) {
                    // Set cookies
                    const days = 7;
                    const date = new Date();
                    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                    const expires = "; expires=" + date.toUTCString();

                    document.cookie = `userId=${userId}${expires}; path=/; Secure; SameSite=None`;
                    document.cookie = `refreshToken=${refreshToken}${expires}; path=/; Secure; SameSite=None`;

                    // Clear URL params
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }

            const newToken = await refreshAccessToken();
            if (newToken) {
                setAccessToken(newToken);
            }
            setIsLoading(false);
        };

        initAuth();
    }, [refreshAccessToken]);

    if (isLoading) {
        return (<div className="flex items-center justify-center h-screen">
            <Spinner />
        </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            isLoading,
            accessToken,
            logout,
            refreshAccessToken,
            authFetch
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};