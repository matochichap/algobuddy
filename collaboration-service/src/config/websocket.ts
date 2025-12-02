import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { addYdoc, getYdoc } from "../db/redis";

const socketClients = new Map<string, Socket>();
const docs = new Map<string, Y.Doc>();

function attachWebsocketServer(server: any) {
    const io = new Server(server, {
        path: '/socket/collaboration',
        cors: {
            origin: process.env.UI_BASE_URL,
            credentials: true,
        },
    });

    io.on("connection", async (socket: Socket) => {
        const userId = socket.handshake.headers['x-user-id'] as string;
        // track connected clients
        if (socketClients.has(userId)) {
            closeWsConnection(userId, "User already connected");
            return;
        }
        socketClients.set(userId, socket);
        console.log(`Client connected: ${userId}`);

        // join room
        const { matchedUserId, difficulty, topic, language } = socket.handshake.query as {
            matchedUserId: string;
            difficulty: string;
            topic: string;
            language: string;
        };
        const roomId = [userId, matchedUserId].sort().join("_");

        if (!docs.has(roomId)) {
            docs.set(roomId, await getYdoc(roomId, difficulty, topic, language));
        }

        const doc = docs.get(roomId)!;
        socket.join(roomId);

        socket.emit("yjs-update", Y.encodeStateAsUpdate(doc));
        socket.on("yjs-update", (update: Uint8Array) => {
            Y.applyUpdate(doc, update);
            socket.to(roomId).emit("yjs-update", update);
        });

        socket.on("disconnect", () => {
            socket.leave(roomId);
            socketClients.delete(userId);
            console.log(`User ${userId} left room ${roomId}`);
            // room is empty
            if (io.sockets.adapter.rooms.get(roomId) === undefined && docs.has(roomId)) {
                // cache doc
                addYdoc(roomId, difficulty, topic, language, doc);
                docs.delete(roomId);
                console.log("Deleted room: ", roomId);
            }
        });
    });
}

function closeWsConnection(userId: string, reason?: string) {
    const socket = socketClients.get(userId);
    if (socket) {
        if (reason) {
            socket?.emit("disconnect_reason", { reason });
        }
        socket.disconnect();
        socketClients.delete(userId);
    }
}

export { attachWebsocketServer, closeWsConnection };