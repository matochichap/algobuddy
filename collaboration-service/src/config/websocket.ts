import { Server, Socket } from "socket.io";
import * as Y from "yjs";
import { addYdoc, getYdoc } from "../db/redis";

const socketClients = new Map<string, Socket>();
const docs = new Map<string, Y.Doc>();

function broadcastOnlineUsers(io: Server, userId: string, matchedUserId: string, roomId: string) {
    // socket ids in room
    const roomSocketIds = io.sockets.adapter.rooms.get(roomId);
    if (!roomSocketIds) return;
    // map socket ids to user ids
    const onlineUserIds: string[] = Array.from(roomSocketIds).map(socketId => {
        if (socketClients.get(userId)?.id === socketId) return userId;
        if (socketClients.get(matchedUserId)?.id === socketId) return matchedUserId;
        return null;
    }).filter(id => id !== null);
    // broadcast online user ids to room
    io.to(roomId).emit("online-users", onlineUserIds);
}

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
        socket.data.userId = userId;
        // track connected clients
        if (socketClients.has(userId)) {
            socket.emit("disconnect_reason", { reason: "User already connected" });
            socket.disconnect();
            return;
        }
        socketClients.set(userId, socket);
        console.log(`Client connected: ${userId}`);

        // join room and ydoc setup
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

        // chat setup
        socket.on("chat", (message: string) => {
            io.to(roomId).emit("chat", message);
        });

        // online users
        broadcastOnlineUsers(io, userId, matchedUserId, roomId);

        socket.on("disconnect", () => {
            socket.leave(roomId);
            socketClients.delete(userId);
            broadcastOnlineUsers(io, userId, matchedUserId, roomId);
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