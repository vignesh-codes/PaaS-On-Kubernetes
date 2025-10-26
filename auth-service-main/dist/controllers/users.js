"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const users_1 = require("../db/users");
const logger_1 = require("../loggers/logger");
class UserController {
}
exports.UserController = UserController;
_a = UserController;
UserController.userDB = users_1.UserDatabase.getInstance();
UserController.getAllUsers = async (req, res) => {
    try {
        const users = await _a.userDB.getUsers();
        res.send(users);
        res.end();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        return res.sendStatus(400);
    }
};
UserController.updateUser = async (req, res) => {
    try {
        const { username } = req.body;
        const { id } = req.params;
        if (!username) {
            return res.sendStatus(400);
        }
        const userToUpdate = await _a.userDB.getUserById(id);
        userToUpdate.username = username;
        await userToUpdate.save();
        return res.status(200).json(userToUpdate).end();
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        res.sendStatus(400);
    }
};
UserController.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await _a.userDB.deleteUserById(id);
        return res.json(deletedUser);
    }
    catch (error) {
        logger_1.Logger.Error(error.toString());
        res.sendStatus(400);
    }
};
//# sourceMappingURL=users.js.map