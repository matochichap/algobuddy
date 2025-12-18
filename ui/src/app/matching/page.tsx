'use client';
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useMatch } from "@/contexts/MatchContext";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import { io, Socket } from "socket.io-client";
import { MatchedUserInfo, Difficulty, Topic, Language } from "shared";
import { getEnumDisplayName, getLanguageDisplayName } from "@/utils/common";

export default function MatchingPage() {
    const { user } = useUser();
    const { accessToken, authFetch } = useAuth();
    const { matchedUser, setMatchedUser, clearMatchedUser, clearSessionStorage } = useMatch();
    const router = useRouter();

    const [difficulty, setDifficulty] = useState<string | null>(Difficulty.EASY);
    const [topic, setTopic] = useState<string | null>(Topic.ARRAY);
    const [language, setLanguage] = useState<string | null>(Language.PYTHON);
    const [anyDifficulty, setAnyDifficulty] = useState(false);
    const [anyTopic, setAnyTopic] = useState(false);
    const [anyLanguage, setAnyLanguage] = useState(false);
    const [isMatching, setIsMatching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        return () => {
            // Cleanup socket on unmount
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const handleStartMatching = async () => {
        if (!user || !accessToken) {
            setError('Please log in to start matching');
            return;
        }

        setIsMatching(true);
        setError(null);
        clearMatchedUser();
        clearSessionStorage();

        try {
            // Connect to matching service through API Gateway
            const socket = io(process.env.NEXT_PUBLIC_MATCHING_SERVICE_BASE_URL, {
                path: '/socket/matching',
                query: {
                    token: accessToken
                },
                transports: ['websocket'],
                reconnection: false,
            });
            socketRef.current = socket;

            socket.on('connect', async () => {
                try {
                    const userInfo: MatchedUserInfo = {
                        userId: user.id,
                        displayName: user.displayName!,
                        email: user.email,
                        picture: user.picture,
                        difficulty: anyDifficulty ? 'ANY' : difficulty!,
                        topic: anyTopic ? 'ANY' : topic!,
                        language: anyLanguage ? 'ANY' : language!,
                    };

                    const response = await authFetch(`${process.env.NEXT_PUBLIC_MATCHING_SERVICE_BASE_URL}/api/match/start`, {
                        method: 'POST',
                        body: JSON.stringify(userInfo)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to start matching');
                    }
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to start matching');
                    setIsMatching(false);
                    // Disconnect socket if still connected
                    if (socketRef.current) {
                        socketRef.current.disconnect();
                        socketRef.current = null;
                    }
                }
            });

            socket.on('match_found', (data: MatchedUserInfo) => {
                setMatchedUser(data);
                setIsMatching(false);
            });

            socket.on('connect_error', (error) => {
                console.warn('Socket.io connection error:', error);
                setError(`Connection error: Try refreshing the page`);
                setIsMatching(false);
            });

            socket.on('disconnect_reason', (data) => {
                setError(`Disconnected: ${data.reason}`);
            });

            socket.on('disconnect', (reason) => {
                console.log('Socket.io disconnected:', reason);
                setIsMatching(false);
            });

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsMatching(false);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        }
    };

    const handleCancelMatching = async () => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setIsMatching(false);
        setError(null);
    };

    const handleJoinRoom = async () => {
        router.push(`/collaboration`);
    };

    return (
        <>
            <Header />
            <div className="min-h-[calc(100vh-4rem)] bg-gray-900 flex items-center justify-center py-8 overflow-y-auto">
                <div
                    className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 max-w-lg w-full mx-4 transition-[height] duration-500 ease-in-out overflow-hidden"
                    style={{
                        height: isMatching ? '320px' : matchedUser ? '520px' : '560px',
                    }}
                >

                    {/* Finding Your Match State */}
                    {isMatching && (
                        <div className="text-center">
                            <div className="mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 mx-auto rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-3xl">🔍</span>
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-100 mb-2">Finding Your Match</h2>
                            <p className="text-gray-400 mb-8">Looking for someone with similar preferences...</p>
                            <button
                                onClick={handleCancelMatching}
                                className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all hover:scale-105"
                            >
                                Cancel Search
                            </button>
                        </div>
                    )}

                    {/* Match Found State */}
                    {!isMatching && matchedUser && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-100 mb-2">Match Found</h1>
                                <p className="text-gray-400">You&apos;ve been paired with a practice partner</p>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                {matchedUser.picture ? (
                                    <Image
                                        src={matchedUser.picture}
                                        alt={matchedUser.displayName || 'User'}
                                        width={80}
                                        height={80}
                                        className="rounded-full border-2 border-gray-600"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                                        <span className="text-3xl text-white">
                                            {matchedUser.displayName?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                )}

                                <h3 className="text-xl font-bold text-gray-100 mt-3">
                                    {matchedUser.displayName || 'Anonymous User'}
                                </h3>

                                {matchedUser.email && (
                                    <p className="text-gray-400 text-sm">{matchedUser.email}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                                    <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                                    <p className="text-sm text-gray-200 font-medium">{getEnumDisplayName(matchedUser.difficulty)}</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                                    <p className="text-xs text-gray-500 mb-1">Topic</p>
                                    <p className="text-sm text-gray-200 font-medium">{getEnumDisplayName(matchedUser.topic)}</p>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-3 text-center border border-gray-700">
                                    <p className="text-xs text-gray-500 mb-1">Language</p>
                                    <p className="text-sm text-gray-200 font-medium">{getLanguageDisplayName(matchedUser.language)}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={handleJoinRoom}
                                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all"
                                >
                                    Join Room
                                </button>

                                <button
                                    onClick={() => {
                                        clearMatchedUser();
                                        clearSessionStorage();
                                        setError(null);
                                    }}
                                    className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors border border-gray-600"
                                >
                                    Find Another Match
                                </button>
                            </div>
                        </>
                    )}

                    {/* Find a Match Form State */}
                    {!isMatching && !matchedUser && (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-100 mb-2">Find a Match</h1>
                                <p className="text-gray-400">Select your preferences and start practicing with a peer</p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-900/30 border border-red-600 rounded-xl text-red-200 flex items-center gap-3">
                                    <span className="text-xl">⚠️</span>
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-5">
                                {/* Difficulty Selection */}
                                <div>
                                    <label className="text-gray-200 font-medium mb-3 block">Difficulty</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {Object.values(Difficulty).map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => {
                                                    setAnyDifficulty(false);
                                                    setDifficulty(d);
                                                }}
                                                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${!anyDifficulty && difficulty === d
                                                    ? d === 'EASY' ? 'bg-green-600/30 border-2 border-green-500 text-green-300'
                                                        : d === 'MEDIUM' ? 'bg-yellow-600/30 border-2 border-yellow-500 text-yellow-300'
                                                            : 'bg-red-600/30 border-2 border-red-500 text-red-300'
                                                    : 'bg-gray-800 border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                    }`}
                                            >
                                                {getEnumDisplayName(d)}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => {
                                                setAnyDifficulty(true);
                                                setDifficulty(null);
                                            }}
                                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${anyDifficulty
                                                ? 'bg-blue-600/30 border-2 border-blue-500 text-blue-300'
                                                : 'bg-gray-800 border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            Any
                                        </button>
                                    </div>
                                </div>

                                {/* Topic Selection */}
                                <div>
                                    <label className="text-gray-200 font-medium mb-3 block">Topic</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={topic || ''}
                                            onChange={(e) => setTopic(e.target.value as Topic)}
                                            disabled={anyTopic}
                                            className={`flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${anyTopic ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {Object.values(Topic).map((t) => (
                                                <option key={t} value={t}>
                                                    {getEnumDisplayName(t)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                if (anyTopic) {
                                                    setAnyTopic(false);
                                                    setTopic(Topic.ARRAY);
                                                } else {
                                                    setAnyTopic(true);
                                                    setTopic(null);
                                                }
                                            }}
                                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${anyTopic
                                                ? 'bg-blue-600/30 border-2 border-blue-500 text-blue-300'
                                                : 'bg-gray-800 border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            Any
                                        </button>
                                    </div>
                                </div>

                                {/* Language Selection */}
                                <div>
                                    <label className="text-gray-200 font-medium mb-3 block">Programming Language</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={language || ''}
                                            onChange={(e) => setLanguage(e.target.value as Language)}
                                            disabled={anyLanguage}
                                            className={`flex-1 px-4 py-2.5 rounded-lg bg-gray-800 text-gray-100 border border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${anyLanguage ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {Object.values(Language).map((l) => (
                                                <option key={l} value={l}>
                                                    {getLanguageDisplayName(l)}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={() => {
                                                if (anyLanguage) {
                                                    setAnyLanguage(false);
                                                    setLanguage(Language.PYTHON);
                                                } else {
                                                    setAnyLanguage(true);
                                                    setLanguage(null);
                                                }
                                            }}
                                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${anyLanguage
                                                ? 'bg-blue-600/30 border-2 border-blue-500 text-blue-300'
                                                : 'bg-gray-800 border border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300'
                                                }`}
                                        >
                                            Any
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Start Button */}
                            <button
                                onClick={handleStartMatching}
                                disabled={!user}
                                className="w-full mt-8 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20 flex items-center justify-center gap-2"
                            >
                                {user ? (
                                    <>
                                        Start Matching
                                    </>
                                ) : (
                                    'Please Log In to Start'
                                )}
                            </button>

                            <p className="text-center text-gray-500 text-sm mt-4">
                                You&apos;ll be matched with someone who has similar preferences
                            </p>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}