import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Role = mongoose.model<IRole>('Role', RoleSchema, 'roles');

export default Role;
