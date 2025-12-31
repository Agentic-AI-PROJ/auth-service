import { type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { type IUser } from '../models/User.js';
import Role from '../models/Role.js';
import { generateToken } from '../utils/jwt.js';
import logger from '../utils/logger.js';
import { checkFeature } from '../utils/featureCheck.js';

export const availableAuths = async (req: Request, res: Response) => {
    try {
        const auths: string[] = [];
        const google_auth = await checkFeature('google-auth');
        const github_auth = await checkFeature('github-auth');
        const email_auth = await checkFeature('email-auth');
        if (google_auth) {
            auths.push('google');
        }
        if (github_auth) {
            auths.push('github');
        }
        if (email_auth) {
            auths.push('email');
        }
        return res.status(200).json(auths);
    } catch (error) {
        logger.error('Error getting available auths:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password || !displayName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Check if they already have an email provider
            const emailProvider = existingUser.providers.find(p => p.provider === 'email');
            if (emailProvider) {
                return res.status(400).json({ message: 'User already exists' });
            }

            // If user exists but no email provider (e.g. only google), we could link it, 
            // but for now let's just return error or handle simple case.
            // The requirement says "similar to system we have... provider=email... providerId=hashedPassword"
            // If user exists with same email but different provider, we might want to add the email provider.
            // Let's assume we append the provider if the user exists.

            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.providers.push({
                provider: 'email',
                providerId: hashedPassword,
                email: email
            });
            await existingUser.save();
            await existingUser.populate('role');

            const token = generateToken(existingUser);
            return res.status(201).json({ token });
        }

        // New user
        // Find default role
        const userRole = await Role.findOne({ name: 'user' });
        if (!userRole) {
            logger.error('Default role "user" not found');
            return res.status(500).json({ message: 'Internal server error' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            displayName,
            role: userRole._id,
            providers: [{
                provider: 'email',
                providerId: hashedPassword,
                email: email
            }]
        });

        await newUser.save();
        await newUser.populate('role');
        const token = generateToken(newUser);

        logger.info(`User registered: ${email}`);
        res.status(201).json({ token });

    } catch (error) {
        logger.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing email or password' });
        }

        const user = await User.findOne({ email }).populate('role');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const emailProvider = user.providers.find(p => p.provider === 'email');
        if (!emailProvider) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, emailProvider.providerId);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        logger.info(`User logged in: ${email}`);
        res.json({ token });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
