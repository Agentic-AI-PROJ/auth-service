import mongoose, { Schema, Document } from 'mongoose';

export interface IProvider {
    provider: 'google' | 'github' | 'email';
    providerId: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
}

export interface IUser extends Document {
    email: string;
    displayName: string;
    avatar?: string;
    role: Schema.Types.ObjectId;
    providers: IProvider[];
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProviderSchema = new Schema<IProvider>({
    provider: {
        type: String,
        enum: ['google', 'github', 'email'],
        required: true,
    },
    providerId: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
});

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
        },
        role: {
            type: Schema.Types.ObjectId,
            ref: 'Role',
            required: true,
        },
        providers: {
            type: [ProviderSchema],
            default: [],
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'banned', 'deleted', 'suspended', 'pending', 'disabled'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient provider lookups
UserSchema.index({ 'providers.provider': 1, 'providers.providerId': 1 });

const User = mongoose.model<IUser>('User', UserSchema, 'users');

export default User;
