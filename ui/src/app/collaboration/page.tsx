'use client';
import { useEffect, useRef, useState, useMemo } from "react";
import { useMatch } from "@/contexts/MatchContext";
import { useAuth } from "@/contexts/AuthContext";
import { io, Socket } from "socket.io-client";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import Editor from "@monaco-editor/react";
import Spinner from "@/components/Spinner";
import { useRouter } from "next/navigation";
import { Question } from "shared";
import { useUser } from "@/contexts/UserContext";

interface ChatMessage {
    sender: string;
    content: string;
}

export default function CollaborationPage() {
    const [question, setQuestion] = useState<Question | null>(null);
    const [chat, setChat] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>("");
    const { accessToken, authFetch } = useAuth();
    const { user } = useUser();
    const { matchedUser, clearMatchedUser, clearSessionStorage } = useMatch();
    const docRef = useRef<Y.Doc | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const [ready, setReady] = useState(false);
    const router = useRouter();

    const handleLeaveRoom = useMemo(() => {
        return () => {
            clearMatchedUser();
            clearSessionStorage();
            router.push("/");
        }
    }, [clearMatchedUser, clearSessionStorage, router]);

    const handleSendMessage = () => {
        if (socketRef.current) {
            const message: ChatMessage = {
                sender: user?.displayName || "Unknown",
                content: chatInput.trim(),
            }
            socketRef.current.emit("chat", message);
        }
    };

    useEffect(() => {
        if (!accessToken || !matchedUser) {
            router.push("/");
            return;
        };

        // setup websocket connection
        const socket = io(process.env.NEXT_PUBLIC_COLLABORATION_SERVICE_BASE_URL, {
            path: '/socket/collaboration',
            query: {
                token: accessToken,
                matchedUserId: matchedUser.userId,
                difficulty: matchedUser.difficulty,
                topic: matchedUser.topic,
                language: matchedUser.language,
            },
            transports: ['websocket'],
        });

        const doc = new Y.Doc();

        socket.on("yjs-update", (update: ArrayBufferLike) => {
            // NOTE: Need to convert ArrayBuffer to Uint8Array
            Y.applyUpdate(doc, new Uint8Array(update));
        });

        socket.on("chat", (message: ChatMessage) => {
            setChat((prevChat) => [...prevChat, message]);
        });

        doc.on("update", (update: Uint8Array) => {
            socket.emit("yjs-update", update);
        });

        docRef.current = doc;
        socketRef.current = socket;

        // fetch question
        const params = new URLSearchParams({
            topic: matchedUser.topic,
            difficulty: matchedUser.difficulty,
            questionSeed: matchedUser.questionSeed!,
        });

        authFetch(`${process.env.NEXT_PUBLIC_QUESTION_SERVICE_BASE_URL}/api/question?${params}`, {
            method: "GET",
        })
            .then(res => res.json())
            .then(data => setQuestion(data))
            .catch(err => console.error("Failed to fetch question:", err));

        // finish setup
        setReady(true);

        return () => {
            socket.disconnect();
            doc.destroy();
            docRef.current = null;
            socketRef.current = null;
        };
    }, [accessToken, matchedUser, router, authFetch]);

    if (!ready) return <Spinner />;

    return (
        <div style={{ width: "100%", height: "100vh", border: "1px solid #222" }}>
            <button onClick={handleLeaveRoom}>Leave Room</button>
            <div>
                <h2>Question:</h2>
                <h3>{question?.title}</h3>
                <p>{question?.difficulty}</p>
                <p>{question?.topics?.join(", ")}</p>
                <p>{question?.description}</p>
            </div>
            <div>
                <h2>Chat:</h2>
                <div style={{ height: "200px", overflowY: "scroll", border: "1px solid #555", padding: "8px" }}>
                    {chat.map((msg, idx) => (
                        <p key={idx}><strong>{msg.sender}:</strong> {msg.content}</p>
                    ))}
                </div>
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && chatInput.trim() !== "") {
                            handleSendMessage();
                            setChatInput("");
                        }
                    }}
                    placeholder="Type a message..."
                />
                <button onClick={handleSendMessage} />
            </div>
            <Editor
                height="100vh"
                defaultLanguage="javascript"
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
                }}
            />
        </div>
    );
}
