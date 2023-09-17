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
require("dotenv/config");
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const app_1 = __importDefault(require("./app"));
function _bootStrap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const configurations = {
                production: { ssl: true, port: 443, hostname: 'api.dnkdream.com' },
                development: { ssl: false, port: 4000, hostname: 'localhost' },
            };
            const environment = process.env.NODE_ENV || 'production';
            const config = configurations[environment];
            let httpServer;
            let httpsServer;
            if (config.ssl) {
                httpServer = http_1.default.createServer(app_1.default.callback());
                httpsServer = https_1.default.createServer({
                    key: fs_1.default.readFileSync(`${process.env.SSL_KEY}`),
                    cert: fs_1.default.readFileSync(`${process.env.SSL_CERT}`),
                }, app_1.default.callback());
                httpServer.listen(80);
                httpsServer.listen(config.port, () => {
                    console.log(`Dnk Dreams Backend server on ${config.port}`);
                });
            }
            else {
                httpServer = http_1.default.createServer(app_1.default.callback());
                httpServer.listen(config.port, () => {
                    console.log(`Dnk dreams Development server on ${config.port}`);
                });
            }
        }
        catch (err) {
            console.error(err);
        }
    });
}
_bootStrap();
