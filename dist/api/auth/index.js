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
const joi_1 = __importDefault(require("joi"));
const koa_router_1 = __importDefault(require("koa-router"));
const bcryptjs_1 = require("bcryptjs");
const utils_1 = require("../../libs/utils");
const database_1 = __importDefault(require("../../libs/database"));
const tokens_1 = require("../../libs/tokens");
const auth = new koa_router_1.default();
auth.post('/register', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object().keys({
        username: joi_1.default.string().required(),
        password: joi_1.default.string().min(6).required(),
    });
    if (!(0, utils_1.validateBody)(ctx, schema))
        return;
    const { username, password } = ctx.request.body;
    try {
        const exists = yield database_1.default.user.findUnique({
            where: { username },
        });
        if (exists) {
            ctx.throw(409, '이미 이용 중인 아이디입니다.');
            return;
        }
        const user = yield database_1.default.user.create({
            data: {
                username,
                password: yield (0, bcryptjs_1.hash)(password, 10),
            },
        });
        ctx.body = user.id;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
auth.post('/login', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object().keys({
        username: joi_1.default.string().required(),
        password: joi_1.default.string().min(6).required(),
    });
    if (!(0, utils_1.validateBody)(ctx, schema))
        return;
    const { username, password } = ctx.request.body;
    try {
        const user = yield database_1.default.user.findUnique({
            where: { username },
        });
        if (!user) {
            ctx.throw(404, '등록된 사용자가 없습니다.');
            return;
        }
        const valid = yield (0, bcryptjs_1.compare)(password, user.password);
        if (!valid) {
            ctx.throw(401, '비밀번호가 다릅니다.');
            return;
        }
        // Prev RefreshToken delete
        const prevToken = user.token;
        if (prevToken && prevToken.length === 0) {
            yield database_1.default.user.update({
                where: { id: user.id },
                data: {
                    token: '',
                    updatedAt: new Date(),
                },
            });
        }
        const tokens = yield (0, tokens_1.createToken)(user);
        (0, tokens_1.setCookies)(ctx, tokens);
        ctx.body = user.id;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
auth.post('/logout', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = ctx.state.user;
        const user = yield database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            ctx.throw(401, '로그인 후 이용하세요');
            return;
        }
        if (user.token && user.token.length === 0) {
            ctx.throw(401, '발행된 토큰이 없습니다.');
            return;
        }
        (0, tokens_1.setCookies)(ctx);
        ctx.state.user = undefined;
        yield database_1.default.user.update({
            where: { id: userId },
            data: {
                token: '',
                updatedAt: new Date(),
            },
        });
        ctx.status = 204;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
auth.get('/check', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!ctx.state.user) {
            ctx.throw(401, '로그인 후 이용해 주세요.');
        }
        const { userId } = ctx.state.user;
        const user = yield database_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            ctx.throw(401, '로그인 후 이용하세요.');
            return;
        }
        const token = user.token;
        if (token && token.length === 0) {
            ctx.throw(401, '발행된 토큰이 없습니다.');
            return;
        }
        ctx.body = userId;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
exports.default = auth;
