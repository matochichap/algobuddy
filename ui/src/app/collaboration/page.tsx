'use client';
import { useEffect, useRef, useState, useMemo } from "react";
import { useMatch } from "@/contexts/MatchContext";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import Editor from "@monaco-editor/react";
import Spinner from "@/components/Spinner";
import UserAvatar from "@/components/UserAvatar";
import { useRouter } from "next/navigation";
import { Question, Difficulty } from "shared";
import { useUser } from "@/contexts/UserContext";
import Link from 'next/link';
import Image from "next/image";
import logo from '@/images/algobuddy-square-icon.png';
import { getEnumDisplayName, getLanguageDisplayName } from "@/utils/common";
import { ChatMessage, PistonResponse, AvatarInfo } from "@/types/collaboration";

export default function CollaborationPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [onlineUsers, setOnlineUsers] = useState<AvatarInfo[]>([]);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [ready, setReady] = useState(false);

    const { accessToken, authFetch } = useAuth();
    const { user } = useUser();
    const { matchedUser, clearMatchedUser, clearSessionStorage } = useMatch();

    const docRef = useRef<Y.Doc | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    const router = useRouter();

    const handleLeaveRoom = useMemo(() => {
        return () => {
            socketRef.current?.emit("leave-room", user?.displayName || "Unknown User");
            clearMatchedUser();
            clearSessionStorage();
            router.push("/");
        }
    }, [clearMatchedUser, clearSessionStorage, router, user]);

    const handleSendMessage = useMemo(() => {
        return () => {
            if (socketRef.current && chatInput.trim()) {
                const message: ChatMessage = {
                    sender: user?.displayName || "Unknown",
                    content: chatInput.trim(),
                }
                socketRef.current.emit("chat", message);
                setChatInput("");
            }
        }
    }, [chatInput, user]);

    const handleRunCode = useMemo(() => {
        return async () => {
            if (!docRef.current || !matchedUser) return;

            const code = docRef.current.getText("code").toString();
            const language = matchedUser.language.toLowerCase();

            if (!language) {
                setOutput(`Language "${matchedUser.language}" is not supported.`);
                return;
            }

            setIsRunning(true);
            setOutput("Running...");

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_PISTON_API_BASE_URL}/api/v2/piston/execute`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        language: language,
                        version: "*",
                        files: [
                            {
                                content: code,
                            },
                        ],
                    }),
                });

                const result: PistonResponse = await response.json();

                let outputText = "";
                if (result.compile?.stderr) {
                    outputText += `Compile Error:\n${result.compile.stderr}\n`;
                }
                if (result.run.stderr) {
                    outputText += `Runtime Error:\n${result.run.stderr}\n`;
                }
                if (result.run.stdout) {
                    outputText += result.run.stdout;
                }
                if (!outputText) {
                    outputText = "No output";
                }

                setOutput(outputText);
            } catch (error) {
                setOutput(`Error: ${error instanceof Error ? error.message : "Failed to execute code"}`);
            } finally {
                setIsRunning(false);
            }
        };
    }, [matchedUser]);

    useEffect(() => {
        let isMounted = true;
        let socket: Socket | null = null;
        let doc: Y.Doc | null = null;

        const initialisePage = async () => {
            if (!accessToken || !matchedUser) {
                router.push("/");
                return;
            };

            // fetch question
            const params = new URLSearchParams({
                topic: matchedUser.topic,
                difficulty: matchedUser.difficulty,
                questionSeed: matchedUser.questionSeed!,
            });

            let fetchedQuestion: Question | null = null;

            try {
                const res = await authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question?${params}`, {
                    method: "GET",
                });
                const data = await res.json();
                if (isMounted) {
                    setQuestion(data);
                    fetchedQuestion = data;
                }
            } catch (err) {
                console.error("Failed to fetch question:", err);
            }

            // setup websocket connection
            socket = io(process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_BASE_URL, {
                path: '/socket/collaboration',
                query: {
                    token: accessToken,
                    matchedUserId: matchedUser.userId,
                    questionId: fetchedQuestion?.id || "",
                },
                transports: ['websocket'],
                forceNew: true,
            });

            doc = new Y.Doc();

            socket.on("yjs-update", (update: ArrayBufferLike) => {
                // NOTE: Need to convert ArrayBuffer to Uint8Array
                if (doc) Y.applyUpdate(doc, new Uint8Array(update));
            });

            socket.on("chat", (message: ChatMessage) => {
                if (!isMounted) return;
                setChat((prevChat) => [...prevChat, message]);
            });

            socket.on("online-users", (onlineUserIds: string[]) => {
                if (!isMounted) return;
                const onlineUsers = onlineUserIds.map(id => {
                    if (id === user?.id) return { userId: user.id, displayName: user.displayName, picture: user.picture };
                    if (id === matchedUser.userId) return { userId: matchedUser.userId, displayName: matchedUser.displayName, picture: matchedUser.picture };
                    return null;
                }).filter(id => id !== null) as AvatarInfo[];
                setOnlineUsers(onlineUsers);
            });

            socket.on("leave-room", (partnerDisplayName) => {
                alert(`${partnerDisplayName} has left the room.`);
            })

            doc.on("update", (update: Uint8Array) => {
                if (socket) socket.emit("yjs-update", update);
            });

            if (isMounted) {
                docRef.current = doc;
                socketRef.current = socket;
                setReady(true);
            } else {
                socket.disconnect();
                doc.destroy();
            }
        }

        initialisePage();

        return () => {
            isMounted = false;
            if (socket) {
                socket.removeAllListeners();
                socket.disconnect();
            }
            if (doc) doc.destroy();
            docRef.current = null;
            socketRef.current = null;
            setReady(false);
        };
    }, [accessToken, matchedUser, router, user, authFetch]);

    // auto scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat]);

    if (!ready) return <Spinner fullScreen={true} />;

    return (
        <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
            {/* Header Bar */}
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                            <Image src={logo} alt="Algobuddy" />
                        </div>
                        <span className="text-xl font-bold text-gray-100">AlgoBuddy</span>
                    </Link>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                            <span className="text-sm text-gray-200 font-medium">Online</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {
                                onlineUsers.map((avatar, idx) => (
                                    <div key={idx} title={avatar.displayName}>
                                        <UserAvatar
                                            userId={avatar.userId}
                                            authFetch={authFetch}
                                            picture={avatar.picture}
                                            displayName={avatar.displayName}
                                            size="sm"
                                            className="hover:opacity-80 transition-opacity"
                                        />
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                    <button
                        onClick={handleLeaveRoom}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                        Leave Room
                    </button>
                </div>
            </div>

            {/* Main Content - Split Panel */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Question & Chat */}
                <div className="w-1/2 flex flex-col border-r border-gray-700 p-4 gap-4">
                    {/* Question Section */}
                    <div className="flex-shrink-0 overflow-y-auto max-h-[50vh] bg-gray-800 rounded-lg border border-gray-700">
                        <div className="p-5">
                            <div className="mb-4">
                                <h2 className="text-2xl font-bold text-gray-100 mb-3">
                                    {question?.title || "Loading question..."}
                                </h2>
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-xs px-2 py-0.5 rounded-full border ${question?.difficulty === Difficulty.EASY ? 'bg-green-600/30 border-green-500 text-green-200' :
                                        question?.difficulty === Difficulty.MEDIUM ? 'bg-yellow-600/30 border-yellow-500 text-yellow-200' :
                                            'bg-red-600/30 border-red-500 text-red-200'
                                        }`}>
                                        {getEnumDisplayName(question?.difficulty || "UNKNOWN")}
                                    </span>
                                    {question?.topics && question.topics.length > 0 && (
                                        <div className="flex gap-2">
                                            {question.topics.map((topic, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-blue-600/30 border-blue-500 text-blue-200 border"
                                                >
                                                    {getEnumDisplayName(topic)}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                                {question?.description}
                            </div>
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-h-0">
                            <div className="px-4 py-2.5 bg-gray-800/50 flex-shrink-0">
                                <h3 className="text-md font-semibold text-gray-200">Chat</h3>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0 bg-gray-850">
                                {chat.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-8">
                                        No messages yet. Start chatting!
                                    </p>
                                ) : (
                                    chat.map((msg, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex ${msg.sender === user?.displayName ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-lg px-3 py-2 ${msg.sender === user?.displayName
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-700 text-gray-100'
                                                    }`}
                                            >
                                                <p className="text-xs font-semibold mb-1 opacity-75">
                                                    {msg.sender}
                                                </p>
                                                <p className="text-sm break-words">{msg.content}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="px-4 py-3 bg-gray-800/50 flex-shrink-0">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" && chatInput.trim() !== "") {
                                                handleSendMessage();
                                            }
                                        }}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-gray-700 text-gray-100 border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Code Editor & Output */}
                <div className="w-1/2 flex flex-col p-4 gap-4">
                    {/* Code Editor Card */}
                    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg border border-gray-700 overflow-hidden min-h-0">
                        {/* Code Editor Header */}
                        <div className="bg-gray-800/50 px-4 py-2.5 flex-shrink-0">
                            <h3 className="text-md font-semibold text-gray-200">
                                {getLanguageDisplayName(matchedUser?.language || "UNKNOWN")}
                            </h3>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1 relative">
                            {docRef.current && <Editor
                                height="100%"
                                defaultLanguage={matchedUser?.language.toLowerCase()}
                                theme="vs-dark"
                                onMount={(editor) => {
                                    new MonacoBinding(
                                        docRef.current!.getText("code"),
                                        editor.getModel()!,
                                        new Set([editor]),
                                        null
                                    );
                                }}
                                options={{
                                    automaticLayout: true,
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                }}
                            />}
                        </div>
                    </div>

                    {/* Run & Output Card */}
                    <div className="flex-shrink-0 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                        <div className="px-4 py-2.5 bg-gray-800/50 flex items-center justify-between">
                            <h3 className="text-md font-semibold text-gray-200">Output</h3>
                            <button
                                onClick={handleRunCode}
                                disabled={isRunning}
                                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                            >
                                {isRunning ? (
                                    <>
                                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                        Running...
                                    </>
                                ) : (
                                    <>▶ Run Code</>
                                )}
                            </button>
                        </div>

                        {/* Output Section */}
                        <div className="px-4 py-3 bg-gray-900 h-40 overflow-y-auto">
                            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                {output || "Click 'Run Code' to see output"}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
