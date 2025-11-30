import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { UserRole } from "shared";
import { validate, userSchemas } from "../middleware/validate";
import { deleteRefreshToken } from "../utils/refreshToken";

const router = Router();

router.get('/me', validate(userSchemas.getMeSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).validatedHeaders['x-user-id'];
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to get user" });
    }
});

router.put('/me', validate(userSchemas.updateMeSchema), async (req, res) => {
    try {
        const userId = (req as any).validatedHeaders['x-user-id'];
        const { displayName, picture } = (req as any).validatedBody as { displayName?: string; picture?: string };
        const user = await prisma.user.update({
            where: { id: userId },
            data: { displayName, picture }
        });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to update user" });
    }
});

router.delete('/me', validate(userSchemas.deleteMeSchema), async (req, res) => {
    try {
        const userId = (req as any).validatedHeaders['x-user-id'];
        // Delete refresh token for user
        await deleteRefreshToken(userId);

        // Delete the user
        await prisma.user.delete({
            where: { id: userId },
        });

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

router.get('/search', validate(userSchemas.searchUsersSchema), async (req, res) => {
    try {
        const { q } = (req as any).validatedQuery as { q: string };
        const take = 20; // Limit results to 20 users

        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { google_id: { contains: q, mode: 'insensitive' } },
                    { displayName: { contains: q, mode: 'insensitive' } },
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                ]
            },
            take
        });

        res.status(200).json(users);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: "Failed to search users" });
    }
});

router.put('/:id', validate(userSchemas.updateUserSchema), async (req, res) => {
    try {
        const { displayName, firstName, lastName, picture, email, role } = (req as any).validatedBody as {
            displayName?: string; firstName?: string; lastName?: string; picture?: string; email?: string; role?: UserRole;
        };

        const data: any = { displayName, firstName, lastName, picture, email };
        if (role) data.role = role; // Don't set role if not provided

        const user = await prisma.user.update({
            where: { id: (req as any).validatedParams.id },
            data
        });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Failed to update user" });
    }
});

router.delete('/:id', validate(userSchemas.deleteUserSchema), async (req, res) => {
    try {
        const { id } = (req as any).validatedParams;
        // Delete refresh token for user
        await deleteRefreshToken(id);

        // Delete user
        await prisma.user.delete({
            where: { id },
        });
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default router;
