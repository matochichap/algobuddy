import redis from '../db/redis';
import crypto from 'crypto';
import { JWT_REFRESH_EXPIRES_DAYS } from '../config/constants';

const hash = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new refresh token
 */
export async function createRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = hash(refreshToken);
    await redis.set(`refreshToken:${userId}`, hashedToken, 'EX', JWT_REFRESH_EXPIRES_DAYS * 24 * 60 * 60);
    return refreshToken;
}

/**
 * Revoke a user's refresh token
 */
export async function deleteRefreshToken(userId: string): Promise<string | null> {
    const result = await redis.del(`refreshToken:${userId}`);
    return result ? userId : null;
}

/**
 * Validate a refresh token and return user ID if valid
 */
export async function validateRefreshToken(userId: string, refreshToken: string): Promise<string | null> {
    const hashedToken = hash(refreshToken);
    const storedToken = await redis.get(`refreshToken:${userId}`);
    return storedToken === hashedToken ? userId : null;
}
