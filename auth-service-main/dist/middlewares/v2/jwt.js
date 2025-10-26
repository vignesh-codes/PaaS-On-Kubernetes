"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJwt = exports.generateJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../../loggers/logger");
const constants_1 = require("../../constants/constants");
const generateJwt = async (user) => {
    try {
        const payload = {
            username: user.username,
            email: user.email
        };
        const jwtToken = jsonwebtoken_1.default.sign(payload, constants_1.JWT_SECRET, { expiresIn: "1200m" });
        return jwtToken;
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return null;
    }
};
exports.generateJwt = generateJwt;
const validateJwt = async (token) => {
    try {
        const decodedToken = jsonwebtoken_1.default.verify(token, constants_1.JWT_SECRET);
        return {
            username: decodedToken.username,
            email: decodedToken.email,
        };
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.Logger.Error(error.toString());
        }
        else {
            logger_1.Logger.Error(error.toString());
        }
        return null;
    }
};
exports.validateJwt = validateJwt;
//# sourceMappingURL=jwt.js.map