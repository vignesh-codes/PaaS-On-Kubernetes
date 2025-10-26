"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = __importDefault(require("./v1/authentication"));
const authentication_2 = __importDefault(require("./v2/authentication"));
const users_1 = __importDefault(require("./v1/users"));
const users_2 = __importDefault(require("./v2/users"));
const v1router = express_1.default.Router();
const v2router = express_1.default.Router();
exports.default = () => {
    (0, authentication_1.default)(v1router);
    (0, users_1.default)(v1router);
    (0, authentication_2.default)(v2router);
    (0, users_2.default)(v2router);
    return { v1router, v2router };
};
//# sourceMappingURL=index.js.map