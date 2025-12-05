import passport from "passport";
import { Router } from "express";
import { User } from "@prisma/client";
import { generateAccessToken } from '../utils/jwt';
import { createRefreshToken, deleteRefreshToken, validateRefreshToken } from '../utils/refreshToken';
import { JWT_REFRESH_EXPIRES_DAYS } from "../config/constants";
import { prisma } from "../db/prisma";
import { UserRole } from "shared";

const router = Router();

// Redirect to google for authentication
router.get('/google', passport.authenticate('google'));

// Handle callback from google
router.get('/google/callback', async (req, res) => {
    // Use passport authenticate without session
    passport.authenticate('google', { session: false }, async (err, user: User) => {
        if (err) {
            console.error('OAuth error:', err);
            return res.redirect(`${process.env.UI_BASE_URL}/auth/login`);
        }

        if (!user) {
            console.error('No user returned from OAuth');
            return res.redirect(`${process.env.UI_BASE_URL}/auth/login`);
        }

        try {
            // Create new refresh token in db
            const refreshToken = await createRefreshToken(user.id);

            // Redirect to frontend with tokens in query params
            const redirectUrl = `${process.env.UI_BASE_URL}?userId=${user.id}&refreshToken=${refreshToken}`;
            return res.redirect(redirectUrl);
        } catch (error) {
            console.error('OAuth callback error:', error);
            return res.redirect(`${process.env.UI_BASE_URL}/auth/login`);
        }
    })(req, res);
});

router.post('/refresh', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID not provided.' });
        }

        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token not provided' });
        }

        const validUserId = await validateRefreshToken(userId, refreshToken);
        if (userId !== validUserId) {
            return res.status(401).json({ error: 'Invalid or expired refresh token.' });
        }

        const { role } = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { role: true }
        });

        const accessToken = generateAccessToken(userId, role as UserRole);

        res.json({
            accessToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(401).json({ error: 'Token refresh error' });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const userId = req.cookies.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID not provided.' });
        }

        await deleteRefreshToken(userId);

        res.clearCookie('userId', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'none'
        });

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Could not log out' });
    }
});

export default router;