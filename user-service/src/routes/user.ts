import { Router, Request, Response, NextFunction } from "express";
import { prisma } from "../db/prisma";
import { UserRole } from "shared";
import { validate, userSchemas } from "../middleware/validate";
import { deleteRefreshToken } from "../utils/refreshToken";
import { formatUserResponse, dataUrlToBuffer, bufferToDataUrl } from "../utils/image";

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

        res.status(200).json(formatUserResponse(user));
    } catch (err) {
        res.status(500).json({ error: "Failed to get user" });
    }
});

router.put('/me', validate(userSchemas.updateMeSchema), async (req, res) => {
    try {
        const userId = (req as any).validatedHeaders['x-user-id'];
        const { displayName, picture, image } = (req as any).validatedBody as { displayName?: string; picture?: string; image?: string };

        const data: any = { displayName, picture };

        if (image) {
            const parsed = dataUrlToBuffer(image);
            if (parsed) {
                data.image = parsed.buffer;
                data.imageMimeType = parsed.mimeType;
            }
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data
        });
        res.status(200).json(formatUserResponse(user));
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

// Get profile image by user ID - returns image as base64 data URL
router.get('/image/:id', validate(userSchemas.getImageSchema), async (req: Request, res: Response) => {
    try {
        const { id } = (req as any).validatedParams;
        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // If user has uploaded image, return it as base64 data URL
        if (user.image) {
            const dataUrl = bufferToDataUrl(user.image, (user as any).imageMimeType || 'image/jpeg');
            return res.status(200).json({ image: dataUrl });
        }

        // If no uploaded image, return Google picture URL or null
        return res.status(200).json({ image: user.picture || null });
    } catch (err) {
        console.error('Get image error:', err);
        res.status(500).json({ error: "Failed to get image" });
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

        res.status(200).json(users.map(formatUserResponse));
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: "Failed to search users" });
    }
});

router.put('/:id', validate(userSchemas.updateUserSchema), async (req, res) => {
    try {
        const { displayName, firstName, lastName, picture, email, role, image } = (req as any).validatedBody as {
            displayName?: string; firstName?: string; lastName?: string; picture?: string; email?: string; role?: UserRole; image?: string;
        };

        const data: any = { displayName, firstName, lastName, picture, email };
        if (role) data.role = role; // Don't set role if not provided

        if (image) {
            const parsed = dataUrlToBuffer(image);
            if (parsed) {
                data.image = parsed.buffer;
                data.imageMimeType = parsed.mimeType;
            }
        }

        const user = await prisma.user.update({
            where: { id: (req as any).validatedParams.id },
            data
        });
        res.status(200).json(formatUserResponse(user));
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
