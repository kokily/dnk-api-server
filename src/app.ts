import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import logger from 'koa-logger';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import cors from '@koa/cors';
import { jwtMiddleware } from './libs/middlewares';
import api from './api';

const app = new Koa();
const router = new Router();

const staticDir = path.resolve(process.cwd(), 'uploads');

app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? 'https://api.dnkdream.com'
        : 'http://localhost:3000',
    credentials: true,
  }),
);
app.use(logger());
app.use(bodyParser());
app.use(jwtMiddleware);
app.use(router.routes());
app.use(router.allowedMethods());
app.use(serve(staticDir));

router.use('/api', api.routes());

if (!fs.existsSync(`${staticDir}/images`) && `${staticDir}/videos`) {
  fs.mkdirSync(`${staticDir}/images`);
  fs.mkdirSync(`${staticDir}/videos`);
}

export default app;
