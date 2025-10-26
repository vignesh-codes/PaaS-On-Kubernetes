"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2AuthController = void 0;
const users_1 = require("../../db/users");
const helpers_1 = require("../../helpers");
const jwt_1 = require("../../middlewares/v2/jwt");
const logger_1 = require("../../loggers/logger");
class V2AuthController {
}
exports.V2AuthController = V2AuthController;
_a = V2AuthController;
V2AuthController.userDB = users_1.UserDatabase.getInstance();
V2AuthController.v2login = async (req, res) => {
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
        let jwtToken = "";
        try {
            jwtToken = await (0, jwt_1.generateJwt)(user);
        }
        catch (error) {
            logger_1.Logger.Error("Error generating JWT token:" + error.toString());
            return res.sendStatus(401);
        }
        let userObj = user.toObject();
        userObj.authentication.jwtToken = jwtToken;
        return res.status(200).json(userObj).end();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return res.sendStatus(400);
    }
};
V2AuthController.v2register = async (req, res) => {
    try {
        console.log("trying to register here ", req.body);
        const { email, password, username } = req.body;
        if (!email || !password || !username) {
            return res.status(400).json({ message: "email, password, or username is missing" });
        }
        ;
        const existingUser = await _a.userDB.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: "email already exists" });
        }
        ;
        const existingUsername = await _a.userDB.getUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: "username already exists" });
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
        return res.status(400).json({ message: error.toString() });
    }
};
//# sourceMappingURL=authentication.js.map