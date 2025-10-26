"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.V1AuthController = void 0;
const users_1 = require("../../db/users");
const helpers_1 = require("../../helpers");
const logger_1 = require("../../loggers/logger");
class V1AuthController {
}
exports.V1AuthController = V1AuthController;
_a = V1AuthController;
V1AuthController.userDB = users_1.UserDatabase.getInstance();
V1AuthController.v1login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.sendStatus(400);
        }
        const user = await _a.userDB.getUserByEmail(email).select("+authentication.salt +authentication.password");
        if (!user) {
            return res.sendStatus(400);
        }
        const expectedHash = (0, helpers_1.authentication)(user.authentication.salt, password);
        if (user.authentication.password != expectedHash) {
            return res.sendStatus(401);
        }
        const salt = (0, helpers_1.random)();
        user.authentication.sessionToken = (0, helpers_1.authentication)(salt, user._id.toString());
        await user.save();
        res.cookie("VWS-AUTH", user.authentication.sessionToken, {
            domain: 'localhost',
            path: "/"
        });
        return res.status(200).json(user).end();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return res.sendStatus(400);
    }
};
V1AuthController.v1register = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.sendStatus(400);
        }
        ;
        const existingUser = await _a.userDB.getUserByEmail(email);
        if (existingUser) {
            return res.sendStatus(400);
        }
        ;
        const salt = (0, helpers_1.random)();
        const user = await _a.userDB.createUser({
            email,
            username,
            authentication: {
                salt,
                password: (0, helpers_1.authentication)(salt, password)
            },
        });
        return res.status(200).json(user).end();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return res.sendStatus(400);
    }
};
V1AuthController.v1logSuccessMsg = async (req, res, next) => {
    logger_1.Logger.Info("successfully registered");
    next();
};
//# sourceMappingURL=authentication.js.map