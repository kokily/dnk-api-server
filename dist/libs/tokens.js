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
exports.tokenRefresh = exports.decodeToken = exports.createToken = exports.generateToken = exports.setCookies = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const database_1 = __importDefault(require("./database"));
/**
 * Cookie Setting
 * @param ctx
 * @param tokens
 */
function setCookies(ctx, tokens) {
    if (tokens) {
        ctx.cookies.set('accessToken', tokens.accessToken, {
            httpOnly: tokens.accessToken ? true : undefined,
            domain: process.env.NODE_ENV === 'production' ? '.hanuri.or.kr' : undefined,
            secure: process.env.NODE_ENV === 'production' && true,
            sameSite: 'lax',
            maxAge: tokens.accessToken ? 1000 * 15 : undefined,
        });
        ctx.cookies.set('refreshToken', tokens.refreshToken, {
            httpOnly: tokens.refreshToken ? true : undefined,
            domain: process.env.NODE_ENV === 'production' ? '.hanuri.or.kr' : undefined,
            secure: process.env.NODE_ENV === 'production' && true,
            sameSite: 'lax',
            maxAge: tokens.refreshToken ? 1000 * 60 * 60 * 24 * 30 : undefined,
        });
    }
    else {
        ctx.cookies.set('accessToken');
        ctx.cookies.set('refreshToken');
    }
}
exports.setCookies = setCookies;
/**
 * Generate Token
 * @param payload
 * @param options
 * @returns string
 */
function generateToken(payload, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const secretKey = process.env.JWT_SECRET;
        const jwtOptions = Object.assign({ issuer: 'hanuri.or.kr', expiresIn: '15d' }, options);
        if (!jwtOptions.expiresIn) {
            delete jwtOptions.expiresIn;
        }
        return new Promise((resolve, reject) => {
            if (!secretKey)
                return;
            (0, jsonwebtoken_1.sign)(payload, secretKey, jwtOptions, (err, token) => {
                if (err || token === undefined) {
                    reject(err);
                }
                else {
                    resolve(token);
                }
            });
        });
    });
}
exports.generateToken = generateToken;
function createToken(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = yield generateToken({ userId: user.id, username: user.username }, { subject: 'accessToken', expiresIn: '15m' });
        const refreshToken = yield generateToken({ userId: user.id }, { subject: 'refreshToken', expiresIn: '15d' });
        yield database_1.default.user.update({
            where: { id: user.id },
            data: {
                token: refreshToken,
            },
        });
        return { accessToken, refreshToken };
    });
}
exports.createToken = createToken;
/**
 * Decode Token
 * @param token
 * @returns
 */
function decodeToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const secretKey = process.env.JWT_SECRET;
        return new Promise((resolve, reject) => {
            if (!secretKey)
                return;
            (0, jsonwebtoken_1.verify)(token, secretKey, (err, decoded) => {
                if (err)
                    reject(err);
                resolve(decoded);
            });
        });
    });
}
exports.decodeToken = decodeToken;
/**
 * Token Refresh
 * @param ctx
 * @param prevRefreshToken
 * @returns
 */
function tokenRefresh(ctx, prevRefreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const decoded = yield decodeToken(prevRefreshToken);
            const user = yield database_1.default.user.findUnique({
                where: { id: decoded.userId },
            });
            if (!user) {
                ctx.throw(500, 'Invalid User Error');
            }
            const now = new Date().getTime();
            const diff = decoded.exp * 1000 - now;
            let refreshToken = prevRefreshToken;
            if (diff < 1000 * 60 * 60 * 24 * 15) {
                refreshToken = yield generateToken({
                    userId: user.id,
                }, { subject: 'refreshToken', expiresIn: '15d' });
            }
            const accessToken = yield generateToken({ user_id: user.id, username: user.username }, { subject: 'accessToken', expiresIn: '15m' });
            setCookies(ctx, { accessToken, refreshToken });
            yield database_1.default.user.update({
                where: { id: user.id },
                data: {
                    token: refreshToken,
                },
            });
            return decoded.userId;
        }
        catch (err) {
            ctx.throw(500, err);
        }
    });
}
exports.tokenRefresh = tokenRefresh;
