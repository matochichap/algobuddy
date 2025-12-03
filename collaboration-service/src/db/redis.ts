import Redis from 'ioredis';
import * as Y from 'yjs';
import { YDOC_EXPIRATION_TIME } from '../config/constants';
import { normalise } from '../utils/common';

const redis = new Redis({
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!),
    password: process.env.REDIS_PASSWORD!
});

redis.on("connect", () => {
    console.log("Connected to Redis");
});

async function addYdoc(roomId: string, questionId: string, ydoc: Y.Doc): Promise<void> {
    if (!roomId || !questionId || !ydoc) {
        console.error("Invalid parameters to addYdoc");
    }
    const ydocString = Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString('base64');
    await redis.set(`ydoc:${roomId}:${normalise(questionId)}`, ydocString, 'EX', YDOC_EXPIRATION_TIME);
}

async function getYdoc(roomId: string, questionId: string): Promise<Y.Doc> {
    const ydoc = new Y.Doc();
    return await redis.get(`ydoc:${roomId}:${questionId}`).then((ydocString) => {
        if (ydocString) {
            const ydocBuffer = Buffer.from(ydocString, 'base64');
            Y.applyUpdate(ydoc, new Uint8Array(ydocBuffer));
            return ydoc;
        }
        return ydoc;
    });
}

export { addYdoc, getYdoc };