"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users_1 = require("../../controllers/users");
const auth_1 = require("../../middlewares/v1/auth");
exports.default = (router) => {
    router.get('/users', auth_1.V1Middleware.isAuthenticated, users_1.UserController.getAllUsers);
    router.delete('/users/:id', auth_1.V1Middleware.isAuthenticated, auth_1.V1Middleware.isOwner, users_1.UserController.deleteUser);
    router.patch('/users/:id', auth_1.V1Middleware.isAuthenticated, auth_1.V1Middleware.isOwner, users_1.UserController.updateUser);
};
//# sourceMappingURL=users.js.map