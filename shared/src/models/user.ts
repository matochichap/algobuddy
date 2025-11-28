// NOTE: keep in sync with @prisma/client UserRole enum
export const UserRole = {
    USER: "USER",
    ADMIN: "ADMIN",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export interface User {
    id: string;
    google_id: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
    email?: string;
    role?: UserRole;
    lastLogin?: Date;
    createdAt?: Date;
    lastUpdated?: Date;
}