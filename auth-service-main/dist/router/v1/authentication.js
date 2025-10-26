"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authentication_1 = require("../../controllers/v1/authentication");
exports.default = (router) => {
    router.post('/auth/register', authentication_1.V1AuthController.v1logSuccessMsg, authentication_1.V1AuthController.v1register);
    router.post('/auth/login', authentication_1.V1AuthController.v1login);
};
//# sourceMappingURL=authentication.js.map