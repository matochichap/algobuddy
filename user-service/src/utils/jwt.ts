import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { JWT_ACCESS_EXPIRES_IN, JWT_ACCESS_SECRET } from '../config/constants';

export interface JWTPayload {
    userId: string;
    userRole?: UserRole;
    iat?: number;
    exp?: number;
}

/**
 * Generate an access token
 * @param userId 
 * @param userRole 
 * @returns 
 */
export function generateAccessToken(userId: string, userRole: UserRole) {
    return jwt.sign(
        { userId, userRole } as JWTPayload,
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' } as any
    );
}
