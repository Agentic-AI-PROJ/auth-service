import jwt, { type SignOptions } from 'jsonwebtoken';
import { type IUser } from '../models/User.js';
import logger from './logger.js';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-jwt-secret-change-in-production';
const JWT_EXPIRES_IN: number = process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN) : 60 * 60 * 24 * 7; // 7 days default

export interface JWTPayload {
    userId: string;
    email: string;
    role: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: IUser): string {
    const payload: JWTPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: (user.role as any).name || 'user', // Fallback or ensure populated
    };
    const options: SignOptions = {
        expiresIn: JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
}
