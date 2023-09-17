"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = void 0;
function validateBody(ctx, schema) {
    const { error } = schema.validate(ctx.request.body);
    if (error === null || error === void 0 ? void 0 : error.details) {
        ctx.status = 400;
        ctx.body = error.details[0].message;
        return false;
    }
    return true;
}
exports.validateBody = validateBody;
