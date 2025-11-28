import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { JWT_ACCESS_EXPIRES_IN, JWT_ACCESS_SECRET } from '../config/constants';
import { JwtPayload } from 'shared';

/**
 * Generate an access token
 * @param userId 
 * @param userRole 
 * @returns 
 */
export function generateAccessToken(userId: string, userRole: UserRole) {
    return jwt.sign(
        { userId, userRole } as JwtPayload,
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRES_IN, algorithm: 'HS256' } as any
    );
}
