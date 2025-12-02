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

export default function CollaborationPage() {
    const { accessToken } = useAuth();
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

    useEffect(() => {
        if (!accessToken || !matchedUser) {
            router.push("/");
            return;
        };

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
            Y.applyUpdate(doc, new Uint8Array(update), 'server');
        });

        doc.on("update", (update: Uint8Array, origin) => {
            if (origin !== 'server') {
                socket.emit("yjs-update", update);
            }
        });

        docRef.current = doc;
        socketRef.current = socket;
        setReady(true);

        return () => {
            socket.disconnect();
            doc.destroy();
            docRef.current = null;
            socketRef.current = null;
        };
    }, [accessToken, matchedUser, router]);

    if (!ready) return <Spinner />;

    return (
        <div style={{ width: "100%", height: "100vh", border: "1px solid #222" }}>
            <button onClick={handleLeaveRoom}>Leave Room</button>
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
