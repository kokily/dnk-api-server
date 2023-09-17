"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
let db;
if (process.env.NODE_ENV === 'production') {
    db = new client_1.PrismaClient();
}
else {
    if (!global.db) {
        global.db = new client_1.PrismaClient();
    }
    db = global.db;
}
exports.default = db;
