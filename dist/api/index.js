"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const auth_1 = __importDefault(require("./auth"));
const upload_1 = __importDefault(require("./upload"));
const hanuri_1 = __importDefault(require("./hanuri"));
const api = new koa_router_1.default();
api.use('/auth', auth_1.default.routes());
api.use('/upload', upload_1.default.routes());
api.use('/hanuri', hanuri_1.default.routes());
exports.default = api;
