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
exports.authorizeUser = exports.jwtMiddleware = exports.cors = void 0;
const tokens_1 = require("./tokens");
const database_1 = __importDefault(require("./database"));
/**
 * Cors config
 * @param ctx
 * @param next
 * @returns
 */
const cors = (ctx, next) => {
    const allowedHosts = [
        /^https:\/\/api.dnkdream.com$/,
        /^https:\/\/hanuri.or.kr$/,
        /^https:\/\/www.hanuri.or.kr$/,
    ];
    if (process.env.NODE_ENV !== 'production') {
        allowedHosts.push(/^http:\/\/localhost/);
    }
    const { origin } = ctx.headers;
    if (origin) {
        const valid = allowedHosts.some((regex) => regex.test(origin));
        if (!valid)
            return next();
        ctx.set('Access-Control-Allow-Origin', origin);
        ctx.set('Access-Control-Allow-Credentials', 'true');
        if (ctx.method === 'OPTIONS') {
            ctx.set('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With, Cookie');
            ctx.set('Access-Control-Allow-Methods', 'GET,HEAD,PUT,POST,DELETE,PATCH');
        }
        return next();
    }
    else {
        return next();
    }
};
exports.cors = cors;
/**
 * Jwt Middleware
 * @param ctx
 * @param next
 * @returns
 */
const jwtMiddleware = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    let accessToken = ctx.cookies.get('accessToken');
    let refreshToken = ctx.cookies.get('refreshToken');
    // 두 토큰이 없을 경우
    if (!accessToken && !refreshToken) {
        ctx.state.user = undefined;
        console.log('토큰 없음');
        return next();
    }
    try {
        if ((accessToken && refreshToken) || (!accessToken && refreshToken)) {
            // 두 토큰 다 있거나 Refresh Token이 있을 경우 디코딩 후 리프레쉬
            const refreshTokenData = yield (0, tokens_1.decodeToken)(refreshToken);
            const diff = refreshTokenData.exp * 1000 - new Date().getTime();
            if (diff < 1000 * 60 * 30 || !accessToken) {
                yield (0, tokens_1.tokenRefresh)(ctx, refreshToken);
            }
            ctx.state.user = {
                userId: refreshTokenData.userId,
            };
            return next();
        }
        else if (accessToken && !refreshToken) {
            // Access Token 유효, Refresh Token 만료
            const accessTokenData = yield (0, tokens_1.decodeToken)(accessToken);
            const user = yield database_1.default.user.findUnique({
                where: { id: accessTokenData.userId },
            });
            if (!user) {
                ctx.throw(500, '사용자가 없습니다.');
                return next();
            }
            const refreshTokenData = yield (0, tokens_1.decodeToken)(user.token);
            if (refreshTokenData) {
                yield database_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        token: '',
                    },
                });
            }
            const tokens = yield (0, tokens_1.createToken)(user);
            (0, tokens_1.setCookies)(ctx, tokens);
            ctx.state.user = {
                userId: user.id,
            };
            return next();
        }
    }
    catch (err) {
        console.error(err);
        return next();
    }
});
exports.jwtMiddleware = jwtMiddleware;
const authorizeUser = (ctx, next) => __awaiter(void 0, void 0, void 0, function* () {
    if (!ctx.state.user) {
        ctx.throw(403, '로그인 후 이용하세요.');
        return;
    }
    const user = yield database_1.default.user.findUnique({
        where: { id: ctx.state.user.userId },
    });
    if (!user) {
        ctx.throw(401, '사용자가 없습니다.');
        return;
    }
    return next();
});
exports.authorizeUser = authorizeUser;
