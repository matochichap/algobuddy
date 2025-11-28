import { Request } from 'express';
import { UserRole } from '../models/user';

export interface JwtPayload {
    userId: string;
    userRole?: UserRole;
    iat?: number;
    exp?: number;
}

/**
 * Extended Request interface to include auth property after using verifyAccessToken middleware
 */
export interface JwtRequest extends Request {
    auth?: {
        userId: string;
        userRole: UserRole;
        iat: number;
        exp: number;
    };
}

/**
 * Extended Request interface to include custom auth headers forwarded by API Gateway
 */
export interface AuthRequest extends Request {
    headers: Request['headers'] & {
        'x-user-id'?: string;
        'x-user-role'?: string;
    };
}