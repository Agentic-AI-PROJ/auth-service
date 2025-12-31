import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User, { type IUser, type IProvider } from '../models/User.js';
import logger from '../utils/logger.js';

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        logger.error('Error deserializing user:', error);
        done(error, null);
    }
});

// Helper function to find or create user with provider
async function findOrCreateUser(
    provider: 'google' | 'github',
    profile: any,
    accessToken: string,
    refreshToken?: string
): Promise<IUser> {
    const email = profile.emails?.[0]?.value;
    const providerId = profile.id;

    if (!email) {
        throw new Error('No email found in profile');
    }

    // Check if user exists with this provider
    let user = await User.findOne({
        'providers.provider': provider,
        'providers.providerId': providerId,
    });

    if (user) {
        // Update existing provider info
        const providerIndex = user.providers.findIndex(
            (p) => p.provider === provider && p.providerId === providerId
        );
        if (providerIndex !== -1 && user.providers[providerIndex]) {
            user.providers[providerIndex].accessToken = accessToken;
            if (refreshToken) {
                user.providers[providerIndex].refreshToken = refreshToken;
            }
            user.providers[providerIndex].email = email;
        }
        await user.save();
        await user.populate('role');
        logger.info(`User logged in with ${provider}: ${email}`);
        return user;
    }

    // Check if user exists with same email (link accounts)
    user = await User.findOne({ email });

    if (user) {
        // Add new provider to existing user
        const newProvider: IProvider = {
            provider,
            providerId,
            email,
            accessToken,
            ...(refreshToken && { refreshToken }),
        };
        user.providers.push(newProvider);
        await user.save();
        await user.populate('role');
        logger.info(`Linked ${provider} account to existing user: ${email}`);
        return user;
    }

    // Create new user
    const displayName = profile.displayName || profile.username || email.split('@')[0];
    const avatar = profile.photos?.[0]?.value;

    // Find default role
    const Role = (await import('../models/Role.js')).default;
    const userRole = await Role.findOne({ name: 'user' });

    if (!userRole) {
        throw new Error('Default role "user" not found');
    }

    user = new User({
        email,
        displayName,
        avatar,
        role: userRole._id,
        providers: [
            {
                provider,
                providerId,
                email,
                accessToken,
                ...(refreshToken && { refreshToken }),
            },
        ],
    });

    await user.save();
    await user.populate('role');
    logger.info(`New user created with ${provider}: ${email}`);
    return user;
}

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3000'}/auth/google/callback`,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await findOrCreateUser('google', profile, accessToken, refreshToken);
                    done(null, user);
                } catch (error) {
                    logger.error('Google OAuth error:', error);
                    done(error as Error, undefined);
                }
            }
        )
    );
    logger.info('Google OAuth strategy configured');
} else {
    logger.warn('Google OAuth credentials not found in environment variables');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
        new GitHubStrategy(
            {
                clientID: process.env.GITHUB_CLIENT_ID,
                clientSecret: process.env.GITHUB_CLIENT_SECRET,
                callbackURL: `${process.env.CALLBACK_URL || 'http://localhost:3000'}/auth/github/callback`,
                scope: ['user:email'],
            },
            async (accessToken: string, refreshToken: string, profile: any, done: any) => {
                try {
                    const user = await findOrCreateUser('github', profile, accessToken, refreshToken);
                    done(null, user);
                } catch (error) {
                    logger.error('GitHub OAuth error:', error);
                    done(error as Error, undefined);
                }
            }
        )
    );
    logger.info('GitHub OAuth strategy configured');
} else {
    logger.warn('GitHub OAuth credentials not found in environment variables');
}

export default passport;
