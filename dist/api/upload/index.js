"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const formidable_1 = require("formidable");
const middlewares_1 = require("../../libs/middlewares");
const path_1 = __importDefault(require("path"));
const upload = new koa_router_1.default();
upload.post('/image', middlewares_1.authorizeUser, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/images');
        const form = new formidable_1.IncomingForm({
            uploadDir,
            keepExtensions: true,
        });
        form.on('error', (err) => {
            console.log(err);
        });
        const target = yield form.parse(ctx.req);
        ctx.body = target;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
upload.post('/video', middlewares_1.authorizeUser, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads/videos');
        const form = new formidable_1.IncomingForm({
            uploadDir,
            keepExtensions: true,
            maxFileSize: 800 * 1024 * 1024,
        });
        form.on('error', (err) => {
            console.log(err);
        });
        form.on('progress', (bytesReceived, bytesExpected) => {
            console.log(bytesReceived, bytesExpected);
        });
        form.parse(ctx.req);
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
exports.default = upload;
