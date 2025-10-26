"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MONGOURL = exports.JWT_SECRET = void 0;
exports.JWT_SECRET = process.env.JWT_SECRET || "jlasfndafgnogbnsrijgbrgujobn";
exports.MONGOURL = process.env.MONGOURL || "mongodb://paas_user:paas_password@mongodb-service.core-services.svc.cluster.local:27017/paas_db";
//# sourceMappingURL=constants.js.map