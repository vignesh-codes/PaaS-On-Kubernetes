"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserDatabase = void 0;
const mongoose_1 = __importStar(require("mongoose"));
class UserDatabase {
    constructor() {
        const userSchemaFields = {
            username: { type: String, required: true },
            email: { type: String, required: true },
            authentication: {
                password: { type: String, required: true, select: false },
                salt: { type: String, select: false },
                sessionToken: { type: String, select: false }
            },
        };
        const userSchema = new mongoose_1.Schema(userSchemaFields);
        this.userModel = mongoose_1.default.models['User'] || mongoose_1.default.model('User', userSchema);
    }
    static getInstance() {
        if (!UserDatabase.instance) {
            UserDatabase.instance = new UserDatabase();
        }
        return UserDatabase.instance;
    }
    getUsers() {
        return this.userModel.find();
    }
    getUserByEmail(email) {
        return this.userModel.findOne({ email });
    }
    getUserByUsername(username) {
        return this.userModel.findOne({ username });
    }
    getUserBySessionToken(sessionToken) {
        return this.userModel.findOne({ 'authentication.sessionToken': sessionToken });
    }
    getUserById(id) {
        return this.userModel.findById(id);
    }
    createUser(values) {
        return new this.userModel(values).save().then((user) => user.toObject());
    }
    deleteUserById(id) {
        return this.userModel.findOneAndDelete({ _id: id });
    }
    updateUserById(id, values) {
        return this.userModel.findByIdAndUpdate(id, values);
    }
}
exports.UserDatabase = UserDatabase;
//# sourceMappingURL=users.js.map