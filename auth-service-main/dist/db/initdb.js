"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../constants/constants");
const logger_1 = require("../loggers/logger");
class MongoDB {
    static async initDb() {
        try {
            logger_1.Logger.Info("Trying to connect to MongoDB");
            await mongoose_1.default.connect(constants_1.MONGOURL);
            logger_1.Logger.Info("Connected to MongoDB");
        }
        catch (error) {
            logger_1.Logger.Error("Error connecting to MongoDB:" + error.toString());
        }
        this.connectToDb();
    }
    static connectToDb() {
        mongoose_1.default.connection.on('error', (error) => {
            logger_1.Logger.Error("MongoDB connection error:" + error.toString());
        });
    }
}
exports.MongoDB = MongoDB;
//# sourceMappingURL=initdb.js.map