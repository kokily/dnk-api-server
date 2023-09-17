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
const joi_1 = __importDefault(require("joi"));
const middlewares_1 = require("../../libs/middlewares");
const utils_1 = require("../../libs/utils");
const database_1 = __importDefault(require("../../libs/database"));
const hanuri = new koa_router_1.default();
hanuri.post('/', middlewares_1.authorizeUser, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const schema = joi_1.default.object().keys({
        title: joi_1.default.string().required(),
        body: joi_1.default.string().required(),
        tags: joi_1.default.array().items(joi_1.default.string()).required(),
        thumbnail: joi_1.default.string().required(),
        year: joi_1.default.string().required(),
    });
    if (!(0, utils_1.validateBody)(ctx, schema))
        return;
    const { title, body, tags, thumbnail, year } = ctx.request
        .body;
    try {
        const hanuri = yield database_1.default.hanuri.create({
            data: {
                title,
                body,
                tags,
                thumbnail,
                year,
            },
        });
        ctx.body = hanuri;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
hanuri.get('/', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, cursor } = ctx.query;
    try {
        const page = cursor !== null && cursor !== void 0 ? cursor : '';
        const cursorObj = page === '' ? undefined : { id: page };
        const limit = 9;
        const hanuries = yield database_1.default.hanuri.findMany({
            where: {
                year,
            },
            cursor: cursorObj,
            skip: page !== '' ? 1 : 0,
            take: limit,
        });
        ctx.body = hanuries;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
hanuri.get('/:id', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = ctx.params;
    try {
        const hanuri = yield database_1.default.hanuri.findUnique({
            where: { id },
        });
        if (!hanuri) {
            ctx.throw(404, '존재하지 않는 게시글입니다.');
            return;
        }
        ctx.body = hanuri;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
hanuri.put('/:id', middlewares_1.authorizeUser, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = ctx.params;
    const schema = joi_1.default.object().keys({
        title: joi_1.default.string().required(),
        body: joi_1.default.string().required(),
        tags: joi_1.default.array().items(joi_1.default.string()).required(),
        thumbnail: joi_1.default.string().required(),
        year: joi_1.default.string().required(),
    });
    if (!(0, utils_1.validateBody)(ctx, schema))
        return;
    const { title, body, tags, thumbnail, year } = ctx.request
        .body;
    try {
        const hanuri = yield database_1.default.hanuri.update({
            where: { id },
            data: {
                title,
                body,
                tags,
                thumbnail,
                year,
                updatedAt: new Date(),
            },
        });
        ctx.body = hanuri;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
hanuri.delete('/:id', middlewares_1.authorizeUser, (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = ctx.params;
    try {
        yield database_1.default.hanuri.delete({ where: { id } });
        ctx.status = 204;
    }
    catch (err) {
        ctx.throw(500, err);
    }
}));
exports.default = hanuri;
