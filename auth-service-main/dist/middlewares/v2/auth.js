"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2Middleware = void 0;
const lodash_1 = require("lodash");
const logger_1 = require("../../loggers/logger");
const users_1 = require("../../db/users");
const jwt_1 = require("./jwt");
class V2Middleware {
}
exports.V2Middleware = V2Middleware;
_a = V2Middleware;
V2Middleware.userDB = users_1.UserDatabase.getInstance();
V2Middleware.isAuthenticated = async (req, res, next) => {
    try {
        const jwt = req.headers["jwt"];
        if (!jwt) {
            return res.sendStatus(401);
        }
        const decodedToken = await (0, jwt_1.validateJwt)(jwt);
        if (!decodedToken) {
            return res.sendStatus(400);
        }
        const existingUser = await _a.userDB.getUserByEmail(decodedToken.email);
        if (!existingUser) {
            return res.sendStatus(403);
        }
        (0, lodash_1.merge)(req, { identity: existingUser });
        return next();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return res.sendStatus(400);
    }
};
V2Middleware.isOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const currentUserId = (0, lodash_1.get)(req, 'identity._id');
        if (!currentUserId) {
            return res.sendStatus(400);
        }
        if (currentUserId.toString() != id) {
            return res.sendStatus(400);
        }
        next();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        res.sendStatus(400);
    }
};
//# sourceMappingURL=auth.js.map