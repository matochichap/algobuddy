import crypto from "crypto";
import { Server, Socket } from "socket.io";
import { cleanupExpired } from "../db/redis";
import { MatchedUserInfo } from "shared";

const socketClients = new Map<string, Socket>();

function attachWebsocketServer(server: any) {
    const io = new Server(server, {
        path: '/socket/matching',
        cors: {
            origin: process.env.UI_BASE_URL,
            credentials: true,
        },
    });

    io.on("connection", (socket: Socket) => {
        const userId = socket.handshake.headers['x-user-id'] as string;
        if (socketClients.has(userId)) {
            closeWsConnection(userId, "User already connected");
            return;
        }
        socketClients.set(userId, socket);
        console.log(`Client connected: ${userId}`);

        socket.on("disconnect", () => {
            cleanupExpired(userId);
            socketClients.delete(userId);
            console.log("Socket disconnected for client:", userId);
        });
    });
}

function notifyMatch(user1Info: MatchedUserInfo, user2Info: MatchedUserInfo, matchedDifficulty: string, matchedTopic: string, matchedLanguage: string) {
    const questionSeed = crypto.randomBytes(8).toString('hex');
    const user1MatchedUserInfo: MatchedUserInfo = {
        userId: user2Info.userId,
        displayName: user2Info.displayName,
        email: user2Info.email,
        picture: user2Info.picture,
        difficulty: matchedDifficulty,
        topic: matchedTopic,
        language: matchedLanguage,
        questionSeed,
    }

    const user2MatchedUserInfo: MatchedUserInfo = {
        userId: user1Info.userId,
        displayName: user1Info.displayName,
        email: user1Info.email,
        picture: user1Info.picture,
        difficulty: matchedDifficulty,
        topic: matchedTopic,
        language: matchedLanguage,
        questionSeed,
    }

    socketClients.get(user1Info.userId)?.emit("match_found", user1MatchedUserInfo);
    socketClients.get(user2Info.userId)?.emit("match_found", user2MatchedUserInfo);
    closeWsConnection(user1Info.userId, "Match found");
    closeWsConnection(user2Info.userId, "Match found");
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

export { attachWebsocketServer, notifyMatch, closeWsConnection };