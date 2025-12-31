import { Router, type Request, type Response } from 'express';
import passport from '../config/passport.js';
import logger from '../utils/logger.js';
import { generateToken } from '../utils/jwt.js';
import { type IUser } from '../models/User.js';
import { register, login, availableAuths } from '../controllers/auth.controller.js';

const router = Router();

router.get('/available-auths', availableAuths);

// Email/Password routes
router.post('/register', register);
router.post('/login', login);

// Google OAuth routes
router.get(
    '/google',
    (req: Request, res: Response, next) => {
        // Store redirect parameter in state to preserve it through OAuth flow
        const redirect = req.query.redirect as string | undefined;
        const state = redirect ? JSON.stringify({ redirect }) : undefined;

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false,
            state
        })(req, res, next);
    }
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=google_auth_failed`,
        session: false
    }),
    (req: Request, res: Response) => {
        // Successful authentication - generate JWT
        const user = req.user as IUser;
        const token = generateToken(user);

        logger.info(`Google OAuth successful for user: ${user.email}`);

        // Retrieve redirect from state parameter
        let redirectPath = '';
        try {
            const state = req.query.state as string | undefined;
            if (state) {
                const parsed = JSON.parse(state);
                if (parsed.redirect) {
                    redirectPath = `&redirect=${encodeURIComponent(parsed.redirect)}`;
                }
            }
        } catch (err) {
            logger.warn('Failed to parse state parameter:', err);
        }

        // Redirect to frontend with token in URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}${redirectPath}`);
    }
);

// GitHub OAuth routes
router.get(
    '/github',
    (req: Request, res: Response, next) => {
        // Store redirect parameter in state to preserve it through OAuth flow
        const redirect = req.query.redirect as string | undefined;
        const state = redirect ? JSON.stringify({ redirect }) : undefined;

        passport.authenticate('github', {
            scope: ['user:email'],
            session: false,
            state
        })(req, res, next);
    }
);

router.get(
    '/github/callback',
    passport.authenticate('github', {
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth?error=github_auth_failed`,
        session: false
    }),
    (req: Request, res: Response) => {
        // Successful authentication - generate JWT
        const user = req.user as IUser;
        const token = generateToken(user);

        logger.info(`GitHub OAuth successful for user: ${user.email}`);

        // Retrieve redirect from state parameter
        let redirectPath = '';
        try {
            const state = req.query.state as string | undefined;
            if (state) {
                const parsed = JSON.parse(state);
                if (parsed.redirect) {
                    redirectPath = `&redirect=${encodeURIComponent(parsed.redirect)}`;
                }
            }
        } catch (err) {
            logger.warn('Failed to parse state parameter:', err);
        }

        // Redirect to frontend with token in URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${frontendUrl}/auth/callback?token=${token}${redirectPath}`);
    }
);

export default router;
