import mongoose, { Schema, Document } from 'mongoose';
import { User } from '../models/user';

export class UserDatabase {
    private static instance: UserDatabase;
    private userModel: mongoose.Model<any>;

    private constructor() {
        const userSchemaFields = {
            username: { type: String, required: true },
            email: { type: String, required: true },
            authentication: {
                password: { type: String, required: true, select: false },
                salt: { type: String, select: false },
                sessionToken: { type: String, select: false }
            },
        };

        const userSchema = new Schema(userSchemaFields);
        this.userModel = mongoose.models['User'] || mongoose.model('User', userSchema) as any;
    }

    public static getInstance(): UserDatabase {
        if (!UserDatabase.instance) {
            UserDatabase.instance = new UserDatabase();
        }
        return UserDatabase.instance;
    }

    public getUsers() {
        return this.userModel.find();
    }

    public getUserByEmail(email: string) {
        return this.userModel.findOne({ email });
    }

    public getUserByUsername(username: string) {
        return this.userModel.findOne({ username });
    }

    public getUserBySessionToken(sessionToken: string) {
        return this.userModel.findOne({ 'authentication.sessionToken': sessionToken });
    }

    public getUserById(id: string) {
        return this.userModel.findById(id);
    }

    public createUser(values: Record<string, any>) {
        return new this.userModel(values).save().then((user: any) => user.toObject());
    }

    public deleteUserById(id: string) {
        return this.userModel.findOneAndDelete({ _id: id });
    }

    public updateUserById(id: string, values: Record<string, any>) {
        return this.userModel.findByIdAndUpdate(id, values);
    }
}
