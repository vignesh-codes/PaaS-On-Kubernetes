"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../../controllers/v2/authentication");
exports.default = (router) => {
    router.post('/auth/register', authentication_1.V2AuthController.v2register);
    router.post('/auth/login', authentication_1.V2AuthController.v2login);
};
//# sourceMappingURL=authentication.js.map