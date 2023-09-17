"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_router_1 = __importDefault(require("koa-router"));
const koa_bodyparser_1 = __importDefault(require("koa-bodyparser"));
const koa_logger_1 = __importDefault(require("koa-logger"));
const koa_static_1 = __importDefault(require("koa-static"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const cors_1 = __importDefault(require("@koa/cors"));
const middlewares_1 = require("./libs/middlewares");
const api_1 = __importDefault(require("./api"));
const app = new koa_1.default();
const router = new koa_router_1.default();
const staticDir = path_1.default.resolve(process.cwd(), 'uploads');
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? 'https://api.dnkdream.com'
        : 'http://localhost:3000',
    credentials: true,
}));
app.use((0, koa_logger_1.default)());
app.use((0, koa_bodyparser_1.default)());
app.use(middlewares_1.jwtMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());
app.use((0, koa_static_1.default)(staticDir));
router.use('/api', api_1.default.routes());
if (!fs_1.default.existsSync(`${staticDir}/images`) && `${staticDir}/videos`) {
    fs_1.default.mkdirSync(`${staticDir}/images`);
    fs_1.default.mkdirSync(`${staticDir}/videos`);
}
exports.default = app;
