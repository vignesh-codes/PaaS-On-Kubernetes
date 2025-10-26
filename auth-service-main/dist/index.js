"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const router_1 = __importDefault(require("./router"));
const logger_1 = require("./loggers/logger");
const initdb_1 = require("./db/initdb");
initdb_1.MongoDB.initDb();
const app = (0, express_1.default)();
app.use(logger_1.accessLogger);
app.use((0, cors_1.default)({
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use((0, cookie_parser_1.default)());
app.use(body_parser_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
const server = http_1.default.createServer(app);
server.listen(5000, () => {
    logger_1.Logger.Info(`Server is running on port 5000`);
    console.log("server running on http://localhost:5000");
});
const { v1router, v2router } = (0, router_1.default)();
app.use("/v1", v1router);
app.use("/v2", v2router);
app.use((err, req, res, next) => {
    logger_1.Logger.Error(err.stack || err.message || JSON.stringify(err));
    res.status(500).send('Something went wrong!');
});
//# sourceMappingURL=index.js.map