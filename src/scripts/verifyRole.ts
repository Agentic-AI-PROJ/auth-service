import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Role from '../models/Role.js';
import connectDB from '../config/db.js';
import { generateToken, verifyToken } from '../utils/jwt.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const verifyRole = async () => {
    try {
        await connectDB();

        const email = `test-role-${Date.now()}@example.com`;
        const password = 'password123';
        const displayName = 'Test Role User';

        console.log(`Registering user: ${email}`);

        // Simulate registration logic
        const userRole = await Role.findOne({ name: 'user' });
        if (!userRole) {
            throw new Error('Default role not found');
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

        console.log('User created with role:', (newUser.role as any).name);

        if ((newUser.role as any).name !== 'user') {
            throw new Error('Role assignment failed');
        }

        const token = generateToken(newUser);
        console.log('Token generated');

        const decoded = verifyToken(token);
        console.log('Token decoded:', decoded);

        if (decoded.role !== 'user') {
            throw new Error('Token role mismatch');
        }

        console.log('Verification successful');
        process.exit(0);
    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
};

verifyRole();
