"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.accessLogger = void 0;
const morgan_1 = __importDefault(require("morgan"));
const winston_1 = __importDefault(require("winston"));
const fs_1 = __importDefault(require("fs"));
const logsDir = 'logs';
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir);
}
const accessLogStream = fs_1.default.createWriteStream(`${logsDir}/access.log`, { flags: 'a' });
const infoLogStream = fs_1.default.createWriteStream(`${logsDir}/info.log`, { flags: 'a' });
const errorLogStream = fs_1.default.createWriteStream(`${logsDir}/error.log`, { flags: 'a' });
const infoLogger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.Stream({ stream: infoLogStream })
    ],
});
const errorLogger = winston_1.default.createLogger({
    level: 'error',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: [
        new winston_1.default.transports.Console(),
        new winston_1.default.transports.Stream({ stream: errorLogStream })
    ],
});
exports.accessLogger = (0, morgan_1.default)('combined', { stream: accessLogStream });
exports.Logger = {
    Info: (message) => infoLogger.info(message),
    Error: (message) => errorLogger.error(message),
};
//# sourceMappingURL=logger.js.map